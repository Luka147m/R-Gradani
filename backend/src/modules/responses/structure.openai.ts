/**
 * @file structure.openai.ts
 *
 * Ova datoteka sadrži logiku za:
 *  Strukturiranje komentara pomoću OpenAI LLM-a
 *  Funkcije za pokretanje strukturiranja komentara u batch-evima ili sve odjednom
 *
 */
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import prisma from "../../config/prisma";
import { logToJob, isJobCancelled } from "../helper/logger";
import { getCommentsWithoutResponses, getCommentsWithoutResponsesForDataset } from "./responses.repository";
import { CriticalApiError, JobCancelledError } from './error.openai';

const openai = new OpenAI();

const prompts = {
    strukturiranje: `Tekst koji ću ti dati je komentar na određeni skup podataka na portalu otvorenih podataka.
        Cilj komentara je ukazati na nedostatke u tom skupu podataka te dati prijedloge za poboljšanja.
        Strukturiraj komentar u nekoliko izjava koje će se kasnije koristiti za analizu koliko su ti prijedlozi usvojeni u skupu podataka.
        Svaka izjava predstavlja jedan problem koji se pojavljuje u skupu podataka.
        Neka izjave budu jasne i sažete. Smiješ preformulirati postojeću rečenicu kako bi bila sažetija, pri tome rečenica ne smije izgubiti bitne informacije.
        Nemoj dodavati svoje prijedloge i zaključke. Nemoj dodavati nepotreba i opširna objašnjenja.
        Svaka izjava treba sadržavati kategoriju kojoj pripada s obzirom na sadržaj.
        Moguće kategorije: METAPODACI (npr. kvaliteta, popunjenost, točnost), KVALITETA I DOSLJEDNOST (npr. nepotpuni podatci, neusklađenost formata i standarda, višestruki formati),
        STRUKTURA PODATAKA (npr. nedostajući stupci ili nazivi stupaca, pogrešni tipovi podataka), FORMAT PODATAKA (npr. dostupni formati datoteka, kodiranje), POVEZANOST (s drugih skupovima), AŽURIRANOST, OSTALO).`,
}

// Za strukturiranje komentara koristimo gpt-5-mini
const model = "gpt-5-mini";

// Tipovi
const izjavaSchema = z.object({
    id: z.number(),         // id izjave unutar komentara
    text: z.string(),       // tekst izjave
    category: z.string(),   // kategorija izjave
});

const izjaveSchema = z.object({
    statements: z.array(izjavaSchema),
});

type Statement = {
    id: number;
    text: string;
    category: string;
};

/**
 * Pomoćna funkcija čisti HTML tagove iz komentara i formatira ga za slanje LLM-u
 *
 * @param comment - originalni komentar s mogućim HTML tagovima
 * @returns tekst komentara bez HTML tagova
 */
function cleanComment(comment?: string | null): string {
    if (!comment) return "";

    return comment
        .replace(/<p>\s*<\/p>/gi, "\n\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{2,}/g, "\n\n")
        .trim();
}

/**
 * Funkcija koja prima jedan komentar i šalje ga na openai za strukturiranje
 *
 * @param comment - tekst komentara za strukturiranje
 * @returns niz strukturiranih izjava
 * @throws Baca grešku, ako se dogodi greška tijekom poziva API, odnosno ako ne valja ključ ili smo potrošili sve novce
 */
async function structureComment(comment: string, jobId: string): Promise<Statement[]> {
    if (isJobCancelled(jobId)) {
        throw new JobCancelledError(jobId);
    }
    try {
        const response = await openai.responses.create({
            model,
            instructions: prompts.strukturiranje,
            input: [{ role: "user", content: cleanComment(comment) }],
            text: { format: zodTextFormat(izjaveSchema, "event") },
        });

        // console.log("LLM response received.");
        // console.log(response.output_text);

        const responseObj = JSON.parse(response.output_text);
        const parsed = izjaveSchema.parse(responseObj);
        return parsed.statements;

    } catch (err: any) {
        if (err.status === 401) {
            throw new CriticalApiError("Invalid API key");
        } else if (err.status === 402) {
            throw new CriticalApiError("Insufficient funds");
        } else if (err.status === 429) {
            console.error("Rate limit exceeded, try again later");
            return [];
        } else {
            console.error("Unknown error:", err.message);
            return [];
        }
    }
}

/**
 * Funkcija koja pokreće strukturiranje N komentara koji nemaju odgovore, batch
 * 
 * @param limit - maksimalan broj komentara za dohvat
 * @param offset - offset za dohvat komentara (koristi 0)
 * @param jobId - ID zadatka za logiranje
 * @throws Baca grešku, ako se dogodi greška tijekom poziva API, odnosno ako ne valja ključ ili smo potrošili sve novce
 */
async function structureNComments(limit: number, offset: number = 0, jobId: string) {
    logToJob(jobId, 'info', 'Počinjem strukturiranje komentara...')

    const commentsRows = await getCommentsWithoutResponses(limit, offset);
    logToJob(jobId, 'info', `Pronađeno ${commentsRows.length} komentara za procesiranje`)

    // console.log(commentsRows[0])

    let totalComments = commentsRows.length;
    let processedComments = 0;
    let failedComments = 0;

    // Procesiramo svaki komentar
    for (const comment of commentsRows) {

        if (isJobCancelled(jobId)) {
            throw new JobCancelledError(jobId);
        }

        try {
            // console.log(`Procesiram komentar ${comment.comment_id}`);
            logToJob(jobId, 'info', `Strukturiram komentar ${comment.id}`)
            if (!comment.message) {
                logToJob(jobId, 'debug', `Komentar ${comment.id}: Prazna poruka`)
                failedComments++;
                continue;
            }

            // Strukturiramo komentar pomoću LLM-a
            const statements = await structureComment(comment.message, jobId);

            if (statements.length === 0) {
                // console.log(`Komentar ${comment.id}: Nema strukturiranih izjava`);
                logToJob(jobId, 'debug', `Komentar ${comment.id}: Nema strukturiranih izjava`)
                failedComments++;
                continue;
            }

            // Pripremamo objekt za spremanje
            const responseData = {
                izjave: statements,
            };

            // Spremamo u bazu
            await prisma.odgovor.create({
                data: {
                    komentar_id: comment.id,
                    created: new Date(),
                    message: responseData,
                    score: null
                }
            });

            processedComments++;
            // console.log(`Komentar ${comment.comment_id}: ${statements.length} izjava spremljeno`);

            // Pauza između poziva da izbjegnemo rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Provjeriti moze li se pauza smanjiti

        } catch (error: any) {
            if (error instanceof CriticalApiError || error instanceof JobCancelledError) {
                throw error;  // Kritična greška se propagira dalje
            }

            failedComments++;
            logToJob(jobId, 'warn', `Greška kod komentara ${comment.id}:`)
            console.error(`Greška kod komentara ${comment.id}:`, error.message);
            continue;
        }
    }

    // Finalni izvještaj
    // console.log("\n" + "=".repeat(60));
    // console.log("FINALNI IZVJEŠTAJ");
    // console.log("=".repeat(60));
    // console.log(`Uspješno procesirano: ${processedComments}/${totalComments}`);
    // console.log(`Neuspješno: ${failedComments}/${totalComments}`);
    // console.log(`Stopa uspjeha: ${((processedComments / totalComments) * 100).toFixed(1)}%`);
    // console.log("=".repeat(60));

    logToJob(jobId, 'info', `Uspješno strukturirano: ${processedComments}/${totalComments}`)
    logToJob(jobId, 'info', `Neuspješno: ${failedComments}/${totalComments}`)
}

/**
 * Funkcija koja pokreće strukturiranje svih komentara koji nemaju odgovore, u batch-evima
 *
 * @param jobId - ID zadatka za logiranje
 * @throws Baca grešku, ako se dogodi greška tijekom poziva API, odnosno ako ne valja ključ ili smo potrošili sve novce
 */
export async function structureAll(jobId: string) {

    const batchSize = 20;
    let totalProcessed = 0;

    try {
        while (true) {

            if (isJobCancelled(jobId)) {
                throw new JobCancelledError(jobId);
            }

            const commentsRows = await getCommentsWithoutResponses(batchSize);
            if (commentsRows.length === 0) break;

            await structureNComments(batchSize, 0, jobId);

            totalProcessed += commentsRows.length;
            logToJob(jobId, 'info', `Ukupno strukturirano: ${totalProcessed}`)
        }

        logToJob(jobId, 'info', 'Strukturiranje završeno.')
    } catch (error: any) {
        if (error instanceof CriticalApiError || error instanceof JobCancelledError) {
            throw error;  // Kritična greška se propagira dalje
        }
        logToJob(jobId, 'error', `Posao prekinut: ${error.message}`)
        throw error;
    }
}

/**
 * Funkcija koja pokreće strukturiranje svih komentara koji nemaju odgovore za JEDAN skup podataka, u batch-evima
 *
 * @param skupId - UUID skupa podataka koji se analizira
 * @param jobId - ID zadatka za logiranje
 * @throws Baca grešku, ako se dogodi greška tijekom poziva API, odnosno ako ne valja ključ ili smo potrošili sve novce
 */
export async function structureForOneDataset(skupId: string, jobId: string) {

    const batchSize = 20;
    let totalProcessed = 0;

    try {
        while (true) {
            const commentsRows = await getCommentsWithoutResponsesForDataset(skupId, batchSize);
            if (commentsRows.length === 0) break;

            await structureNCommentsForOneDataset(skupId, batchSize, 0, jobId);

            totalProcessed += commentsRows.length;
            logToJob(jobId, 'info', `Ukupno strukturirano: ${totalProcessed}`)
        }

        logToJob(jobId, 'info', 'Strukturiranje završeno.')
    } catch (error: any) {
        if (error instanceof CriticalApiError || error instanceof JobCancelledError) {
            throw error;  // Kritična greška se propagira dalje
        }
        logToJob(jobId, 'error', `Posao prekinut: ${error.message}`)
        throw error;
    }
}

/**
 * Funkcija koja pokreće strukturiranje N komentara koji nemaju odgovore za JEDAN skup podataka, batch
 * 
 * @param skupId - UUID skupa podataka koji se analizira
 * @param limit - maksimalan broj komentara za dohvat
 * @param offset - offset za dohvat komentara (koristi 0)
 * @param jobId - ID zadatka za logiranje
 * @throws Baca grešku, ako se dogodi greška tijekom poziva API, odnosno ako ne valja ključ ili smo potrošili sve novce
 */
async function structureNCommentsForOneDataset(skupId: string, limit: number, offset: number = 0, jobId: string) {
    logToJob(jobId, 'info', 'Počinjem strukturiranje komentara...')

    const commentsRows = await getCommentsWithoutResponsesForDataset(skupId, limit, offset);
    logToJob(jobId, 'info', `Pronađeno ${commentsRows.length} komentara za procesiranje`)

    // console.log(commentsRows[0])

    let totalComments = commentsRows.length;
    let processedComments = 0;
    let failedComments = 0;

    // Procesiramo svaki komentar
    for (const comment of commentsRows) {

        if (isJobCancelled(jobId)) {
            throw new JobCancelledError(jobId);
        }

        try {
            // console.log(`Procesiram komentar ${comment.comment_id}`);
            logToJob(jobId, 'info', `Strukturiram komentar ${comment.id}`)
            if (!comment.message) {
                logToJob(jobId, 'debug', `Komentar ${comment.id}: Prazna poruka`)
                failedComments++;
                continue;
            }

            // Strukturiramo komentar pomoću LLM-a
            const statements = await structureComment(comment.message, jobId);

            if (statements.length === 0) {
                // console.log(`Komentar ${comment.id}: Nema strukturiranih izjava`);
                logToJob(jobId, 'debug', `Komentar ${comment.id}: Nema strukturiranih izjava`)
                failedComments++;
                continue;
            }

            // Pripremamo objekt za spremanje
            const responseData = {
                izjave: statements,
            };

            // Spremamo u bazu
            await prisma.odgovor.create({
                data: {
                    komentar_id: comment.id,
                    created: new Date(),
                    message: responseData,
                    score: null
                }
            });

            processedComments++;
            // console.log(`Komentar ${comment.comment_id}: ${statements.length} izjava spremljeno`);

            // Pauza između poziva da izbjegnemo rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Provjeriti moze li se pauza smanjiti

        } catch (error: any) {
            if (error instanceof CriticalApiError || error instanceof JobCancelledError) {
                throw error;  // Kritična greška se propagira dalje
            }

            failedComments++;
            logToJob(jobId, 'warn', `Greška kod komentara ${comment.id}:`)
            console.error(`Greška kod komentara ${comment.id}:`, error.message);
            continue;
        }
    }

    logToJob(jobId, 'info', `Uspješno strukturirano: ${processedComments}/${totalComments}`)
    logToJob(jobId, 'info', `Neuspješno: ${failedComments}/${totalComments}`)
}