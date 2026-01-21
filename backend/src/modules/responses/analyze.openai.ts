/**
 * @file analyze.openai.ts
 *
 * Ova datoteka sadrži logiku za:
 *  Analizu izjava koristeći OpenAI API
 *  Izračunavanje score na temelju rezultata analize
 *  Izgradnju metapodataka za skupove podataka
 *  Obradu svih skupova podataka i njihovih izjava u batch načinu rada
 * 
 */
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import * as AnalysisTypes from './analysis.types';
import { logToJob, isJobCancelled } from '../helper/logger';
import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import { getStructuredComments, getStructuredCommentsForDataset } from './responses.repository';
import { createVectorStore, cleanupResources } from './vectorStore.openai';
import { CriticalApiError, JobCancelledError } from './error.openai';

const openai = new OpenAI();
const model = 'gpt-5-mini';

const ANALYSIS_PROMPT = `Analiziraj koliko je sljedeća izjava istinita za skup podataka koji sam ti predao.
Komentar neka bude najviše jedna rečenica. Podudarnost predstavlja postotak zapisa/redaka za koji je izjava istinita.
Ako je podudarnost manja od 25, onda je usvojenost True inače False.`;

/**
 * Funkcija koja analizira izjave koristeći OpenAI API, obavlja poziv API-ja za svaku izjavu
 * i vraća ažurirani niz izjava s rezultatima analize.
 *
 * @param vectorStoreId - ID vector storea
 * @param statements - niz izjava koje treba analizirati
 * @param metapodaci - metapodaci skupa podataka u obliku stringa
 * @param jobId - ID posla za logiranje
 * @returns Ažurirani niz izjava s rezultatima analize
 * @throws Baca grešku, ako se dogodi greška tijekom poziva API, odnosno ako ne valja ključ ili smo potrošili sve novce
 */
export async function analyzeStatements(
    vectorStoreId: string,
    statements: AnalysisTypes.Statement[],
    metapodaci: string,
    jobId: string
): Promise<AnalysisTypes.Statement[]> {
    const vectorIDs = [vectorStoreId];

    for (const statement of statements) {
        if (isJobCancelled(jobId)) {
            throw new JobCancelledError(jobId);
        }
        logToJob(jobId, 'debug', `Analiziram izjavu ID: ${statement.id}`);

        try {
            const response = await openai.responses.create({
                model: model,
                instructions: ANALYSIS_PROMPT,
                input: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'input_text',
                                text: 'Izjava: ' + statement.text,
                            },
                            {
                                type: 'input_text',
                                text: 'Metapodaci: ' + metapodaci,
                            },
                        ],
                    },
                ],
                tools: [
                    {
                        type: 'file_search',
                        vector_store_ids: vectorIDs,
                    },
                ],
                text: { format: zodTextFormat(AnalysisTypes.analizaSchema, 'event') },
            });

            try {
                const parsed = response.output_text
                    ? JSON.parse(response.output_text)
                    : {};
                statement.analysis = parsed as AnalysisTypes.AnalizaResult;
            } catch (parseError) {
                logToJob(jobId, 'warn', `Failed to parse analysis for statement ${statement.id}`);
                statement.analysis = undefined;
                continue;
            }

        } catch (err: any) {
            if (err.status === 401) {
                logToJob(jobId, 'error', 'Invalid API key - cannot continue');
                throw new CriticalApiError("Invalid API key");
            } else if (err.status === 402) {
                logToJob(jobId, 'error', 'Insufficient funds - cannot continue');
                throw new CriticalApiError("Insufficient funds");
            } else if (err.status === 429) {
                logToJob(jobId, 'warn', 'Rate limit exceeded for statement, retrying...');
                statement.analysis = undefined;
                continue;
            } else {
                logToJob(jobId, 'error', `Unknown error analyzing statement ${statement.id}: ${err.message}`);
                statement.analysis = undefined;
                continue;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return statements;
}

/**
 * Pomoćna funkcija za izračunavanje ukupnog score na temelju podudarnosti iz analiza izjava.
 *
 * @param statements - niz izjava s rezultatima analize
 * @returns Ukupni score kao broj
 */
export function calculateScore(statements: AnalysisTypes.Statement[]): number {
    const ukupno = statements.reduce(
        (acc, obj) => acc + (obj.analysis?.podudarnost || 0),
        0,
    );
    const prosjek = ukupno / statements.length;
    return prosjek;
}

/**
 *  Pomoćna funkcija koja gradi metapodatke skupa podataka u obliku stringa.
 * 
 * @param skup - podaci o skupu podataka u obliku AnalysisTypes.SkupGroup
 * @returns Metapodaci skupa podataka u obliku stringa
 */
export function buildMetadata(skup: AnalysisTypes.SkupGroup): string {
    return `
        Naziv skupa: ${skup.title || 'N/A'}
        Opis skupa: ${skup.description || 'N/A'}
        Tema: ${skup.theme || 'N/A'}
        Učestalost osvježavanja: ${skup.refresh_frequency || 'N/A'}
        URL skupa: ${skup.url || 'N/A'}
        Licenca: ${skup.license_title || 'N/A'}
        Tagovi: ${skup.tags ? skup.tags.join(', ') : 'N/A'}
    `;
}

/**
 * Funkcija koja pokreće analizu svih skupova podataka u batch načinu rada.
 * 
 * @param jobId - ID posla za logiranje
 * @throws Baca grešku ako se dogodi kritična greška tijekom analize
 */
export async function analyzeAllData(jobId: string): Promise<void> {
    logToJob(jobId, 'info', 'Započinjem analiziranje izjava')
    const totalStart = Date.now();
    const batchSize = 20;
    let offset = 0;
    let batch: AnalysisTypes.StructuredCommentDict = {};
    let totalComments = 0;

    try {
        do {

            if (isJobCancelled(jobId)) {
                throw new JobCancelledError(jobId);
            }

            batch = await getStructuredComments(batchSize, offset);
            batch = await enrichSkupInfo(batch);

            totalComments = Object.values(batch).reduce((acc, skup) => acc + skup.comments.length, 0);
            // console.log(`Dohvaćeno ${totalComments} komentara`);

            if (totalComments === 0) {
                break;
            }
            for (const skupId of Object.keys(batch)) {
                await analyzeSkup(batch[skupId], jobId, false);
            }

            // Nije potreban offset jer se uvijek dohvaćaju novi komentari koji nisu analizirani koji imaju score null
            // offset += batchSize; 
        } while (totalComments > 0);

        const totalEnd = Date.now();
        const totalLogText = `Ukupno vrijeme izvođenja: ${(totalEnd - totalStart) / 1000} sekundi`;
        // console.log(totalLogText);
        logToJob(jobId, 'info', totalLogText)

    } catch (error) {
        console.error("Greška tijekom analize izjava:", error);
        logToJob(jobId, 'info', 'Greška tijekom analize izjava')
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Funkcija koja obogaćuje informacije o skupovima podataka dohvaćanjem dodatnih podataka iz baze podataka.
 * 
 * @param dict - Rječnik strukturiranih komentara grupiranih po skupovima podataka
 * @returns Obogaćeni rječnik s dodatnim informacijama o skupovima podataka
 */
async function enrichSkupInfo(dict: AnalysisTypes.StructuredCommentDict): Promise<AnalysisTypes.StructuredCommentDict> {
    const skupIds = Object.keys(dict);

    if (skupIds.length === 0) return dict;

    // Dohvati sve skupove podatka u jednom queryju
    const skupovi = await prisma.skup_podataka.findMany({
        where: {
            id: { in: skupIds }
        },
        select: {
            id: true,
            title: true,
            refresh_frequency: true,
            theme: true,
            description: true,
            url: true,
            license_title: true,
            tags: true,
            resurs: {
                select: {
                    id: true,
                    name: true,
                    format: true,
                    mimetype: true,
                    size: true,
                    url: true
                }
            }
        }
    });

    for (const skup of skupovi) {
        const entry = dict[skup.id];
        if (!entry) continue;

        entry.title = skup.title;
        entry.refresh_frequency = skup.refresh_frequency;
        entry.theme = skup.theme;
        entry.description = skup.description;
        entry.url = skup.url;
        entry.license_title = skup.license_title;
        entry.tags = Array.isArray(skup.tags) ? (skup.tags as string[]) : null;
        entry.resources = skup.resurs;
    }

    return dict;
}

/**
 * Funkcija koja pokreće analizu za jedan skup podataka.
 *
 * @param skup - podaci o skupu podataka u obliku AnalysisTypes.SkupGroup
 * @param jobId - ID posla za logiranje
 * @throws Baca grešku, ako se dogodi kritična greška tijekom analize - API ključ nije valjan ili su potrošena sva sredstva
 */
async function analyzeSkup(skup: AnalysisTypes.SkupGroup, jobId: string, createNewEntry: boolean): Promise<void> {
    if (isJobCancelled(jobId)) {
        throw new JobCancelledError(jobId);
    }

    logToJob(jobId, 'info', `Analiziram skup podataka ID: ${skup.skup_id}`)
    let skupId = skup.skup_id
    let vectorStoreId: string | null = null;
    let fileIds: string[] = [];

    try {
        const result = await createVectorStore(skup, jobId);
        if (isVectorStoreError(result)) {
            logToJob(jobId, 'error', `Error: ${result.error}`)
            for (const comment of skup.comments) {
                await writeErrorToDb(comment, result.error, createNewEntry);
                await updateSkupLastAnalysis(skupId)

            }
            return;
        }

        vectorStoreId = result.vectorStore.id;
        fileIds = result.fileIds;

        const filesResponse = await openai.vectorStores.files.list(vectorStoreId);
        if (!filesResponse.data || filesResponse.data.length === 0) {
            logToJob(jobId, 'info', 'Vector store je prazan, nema datoteka za analizu.')
            for (const comment of skup.comments) {
                await writeErrorToDb(comment, "Nema dostupnih datoteka za analizu izjava.", createNewEntry);
                await updateSkupLastAnalysis(skupId)
            }
            return;
        }

        for (const comment of skup.comments) {
            if (!comment.message || typeof comment.message !== 'object') continue;

            const messageObj = comment.message as AnalysisTypes.MessageStructure;
            if (!messageObj.izjave || !Array.isArray(messageObj.izjave)) continue;

            logToJob(jobId, 'debug', `Analiziraj izjave za odgovor ${comment.odgovorId}`)

            const statements = messageObj.izjave;
            const updatedStatements: AnalysisTypes.Statement[] = statements.map(stat => ({
                ...stat,
                analysis: undefined
            }));


            const metapodaci = buildMetadata(skup);

            try {
                const analyzedStatements = await analyzeStatements(
                    vectorStoreId,
                    updatedStatements,
                    metapodaci,
                    jobId
                );

                const finalStatements = analyzedStatements.map(s => ({
                    ...s,
                    flag: false
                }));

                const jsonObj = { izjave: finalStatements };
                const score = calculateScore(finalStatements);

                if (createNewEntry) {
                    await prisma.odgovor.create({
                        data: {
                            komentar_id: comment.komentarId,
                            created: new Date(),
                            message: jsonObj as Prisma.JsonObject,
                            score: score
                        }
                    })
                } else {
                    await prisma.odgovor.update({
                        where: { id: comment.odgovorId },
                        data: {
                            message: jsonObj as Prisma.JsonObject,
                            score: score
                        }
                    })
                }

                await updateSkupLastAnalysis(skupId)

                logToJob(jobId, 'info', `Odgovor ${comment.odgovorId} ažuriran sa score: ${score}`);

            } catch (error: any) {
                if (error instanceof CriticalApiError) {
                    throw error;  // Kritična greška se propagira dalje
                }

                logToJob(jobId, 'error', `Greška kod analize komentara ${comment.odgovorId}: ${error.message}`);
                await writeErrorToDb(comment, `Greška tijekom analize: ${error.message}`, createNewEntry);
                await updateSkupLastAnalysis(skupId)
                continue;
            }
        }

        await cleanupResources(vectorStoreId, fileIds, jobId);

    } catch (error: any) {
        if (error instanceof CriticalApiError || error instanceof JobCancelledError) {
            throw error;  // Kritična greška se propagira dalje
        }
        logToJob(jobId, 'error', `Greška kod skupa ${skup.skup_id}: ${error.message}`);
    }
    finally {
        if (vectorStoreId && fileIds.length > 0) {
            try {
                await cleanupResources(vectorStoreId, fileIds, jobId);
            } catch (cleanupError) {
                logToJob(jobId, 'warn', `Cleanup failed: ${cleanupError}`);
            }
        }
    }
}

/**
 * Funkcija koja ažurira polje last_analysis za određeni skup podataka.
 * 
 * @param skupId - UUID skupa
 */
async function updateSkupLastAnalysis(skupId: string): Promise<void> {
    try {
        await prisma.skup_podataka.update({
            where: { id: skupId },
            data: {
                last_analysis: new Date(),
            },
        });
    } catch (error) {
        console.error(`Greška pri ažuriranju last_analysis za skup ${skupId}:`, error);
    }
}

/**
 * Funkcija koja zapisuje grešku u bazu podataka za određeni odgovor.
 * 
 * @param comment - StructuredCommentRow koji sadrži ID odgovora i poruku
 * @param errorMessage - poruka greške koja će biti zapisana
 * @param update - ako je true, ažurira postojeći odgovor; ako je false, stvara novi odgovor
 */
async function writeErrorToDb(
    comment: AnalysisTypes.StructuredCommentRow,
    errorMessage: string,
    createNewEntry: boolean = false
): Promise<void> {
    const { odgovorId, message } = comment;

    const existingObj: Record<string, any> =
        message && typeof message === 'object' && !Array.isArray(message)
            ? (message as Record<string, any>)
            : {};

    const newMessage: Prisma.JsonObject = {
        error: errorMessage,
        ...existingObj,
    };

    if (!createNewEntry) {
        await prisma.odgovor.update({
            where: { id: odgovorId },
            data: {
                message: newMessage,
                score: -1,
            },
        });
    } else {
        await prisma.odgovor.create({
            data: {
                created: new Date(),
                message: newMessage,
                score: -1,
            },
        });
    }

}

/**
 * Funkcija koja provjerava je li rezultat izrade vector storea greška.
 * 
 * @param result - rezultat izrade vector storea
 * @returns - true ako je rezultat greška, inače false
 */
function isVectorStoreError(
    result: AnalysisTypes.VectorStoreResponse,
): result is AnalysisTypes.VectorStoreError {
    return 'error' in result;
}

/**
 * Funkcija koja pokreće analizu za dani skup podataka
 * 
 * @param skupId - UUID skupa podataka koji se analizira
 * @param jobId - ID posla za logiranje
 * @throws Baca grešku ako se dogodi kritična greška tijekom analize
 */
export async function analyzeDataset(skupId: string, jobId: string): Promise<void> {
    logToJob(jobId, 'info', 'Započinjem analiziranje izjava')
    const totalStart = Date.now();
    const batchSize = 20;
    let offset = 0;
    let batch: AnalysisTypes.StructuredCommentDict = {};
    let totalComments = 0;

    try {
        do {

            if (isJobCancelled(jobId)) {
                throw new JobCancelledError(jobId);
            }

            batch = await getStructuredCommentsForDataset(skupId, batchSize, offset);
            batch = await enrichSkupInfo(batch);

            totalComments = Object.values(batch).reduce((acc, skup) => acc + skup.comments.length, 0);
            // console.log(`Dohvaćeno ${totalComments} komentara`);

            if (totalComments === 0) {
                break;
            }
            for (const skupId of Object.keys(batch)) {
                await analyzeSkup(batch[skupId], jobId, true);
            }

            // Bitno offset
            offset += batchSize;
        } while (totalComments > 0);

        const totalEnd = Date.now();
        const totalLogText = `Ukupno vrijeme izvođenja: ${(totalEnd - totalStart) / 1000} sekundi`;
        // console.log(totalLogText);
        logToJob(jobId, 'info', totalLogText)

    } catch (error) {
        if (!(error instanceof JobCancelledError)) {
            console.error("Greška tijekom analize izjava:", error);
        }
        logToJob(jobId, 'info', 'Greška tijekom analize izjava')
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}