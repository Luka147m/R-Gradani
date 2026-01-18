// Za strukturiranje komentara koristimo gpt-5-mini
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import prisma from "../../config/prisma";
import { logToJob } from "../helper/logger";

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

type CommentRow = {
    id: number;
    skup_id: string | null;
    message: string | null;
    skup_podataka: { title: string | null } | null;
};

type Statement = {
    id: number;
    text: string;
    category: string;
};

// Čistimo komentar korisnika od HTML tagova i nepotrebnih praznina
function cleanComment(comment?: string | null): string {
    if (!comment) return "";

    return comment
        .replace(/<p>\s*<\/p>/gi, "\n\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{2,}/g, "\n\n")
        .trim();
}

// Funkcija koja dohvaća n komentara koji još nemaju odgovore
async function getComments(limit: number, offset: number = 0): Promise<CommentRow[]> {

    const comments = await prisma.komentar.findMany({
        where: {
            odgovor: {
                none: {}   // nema nijednog odgovora (Ovo se može kasnije promijeniti)
            }
        },
        select: {
            id: true,
            skup_id: true,
            message: true,
            skup_podataka: {
                select: {
                    title: true,  // samo title skupa podataka
                }
            }

        },
        take: limit,
        skip: offset
    });

    // Bigint mapping
    return comments.map(c => ({
        ...c,
        id: Number(c.id)
    }));

}

// Funkcija prima string komentara, vraća niz strukturiranih izjava
async function structureComment(comment: string): Promise<Statement[]> {
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
            throw new Error("Invalid API key - cannot continue");
        } else if (err.status === 402) {
            throw new Error("Insufficient funds - cannot continue");
        } else if (err.status === 429) {
            console.error("Rate limit exceeded, try again later");
            return [];
        } else {
            console.error("Unknown error:", err.message);
            return [];
        }
    }
}

// Funkcija koja procesira n komentara bez odgovora
async function structureNComments(limit: number, offset: number = 0, jobId: string) {
    logToJob(jobId, 'info', 'Počinjem strukturiranje komentara...')

    const commentsRows = await getComments(limit, offset);
    logToJob(jobId, 'info', `Pronađeno ${commentsRows.length} komentara za procesiranje`)

    // console.log(commentsRows[0])

    let totalComments = commentsRows.length;
    let processedComments = 0;
    let failedComments = 0;

    // Procesiramo svaki komentar
    for (const comment of commentsRows) {
        try {
            // console.log(`Procesiram komentar ${comment.comment_id}`);
            if (!comment.message) {
                logToJob(jobId, 'debug', `Komentar ${comment.id}: Prazna poruka`)
                failedComments++;
                continue;
            }

            // Strukturiramo komentar pomoću LLM-a
            const statements = await structureComment(comment.message);

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
            if (error.message?.includes("cannot continue")) {
                logToJob(jobId, 'error', `Kritična greška: ${error.message}`)
                throw error;
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

// Strukturira sve komentare koji dosad nisu bili strukturirani
export async function structureAll(jobId: string) {

    const batchSize = 20;
    let totalProcessed = 0;

    try {
        while (true) {
            const commentsRows = await getComments(batchSize);
            if (commentsRows.length === 0) break;

            await structureNComments(batchSize, 0, jobId);

            totalProcessed += commentsRows.length;
            logToJob(jobId, 'info', `Ukupno strukturirano: ${totalProcessed}`)
        }

        logToJob(jobId, 'info', 'Strukturiranje završeno.')
    } catch (error: any) {
        logToJob(jobId, 'error', `Posao prekinut: ${error.message}`)
        throw error;
    }
}
