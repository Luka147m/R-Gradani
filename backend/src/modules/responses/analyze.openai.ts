import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import * as AnalysisTypes from './analysis.types';
import { logToJob } from '../helper/logger';
import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import { getStructuredComments } from './responses.repository';
import { createVectorStore, cleanupResources } from './vectorStore.openai';
import { update } from 'tar';

const openai = new OpenAI();
const model = 'gpt-5-mini';

const ANALYSIS_PROMPT = `Analiziraj koliko je sljedeća izjava istinita za skup podataka koji sam ti predao.
Komentar neka bude najviše jedna rečenica. Podudarnost predstavlja postotak zapisa/redaka za koji je izjava istinita.
Ako je podudarnost manja od 25, onda je usvojenost True inače False.`;

export async function analyzeStatements(
    vectorStoreId: string,
    statements: AnalysisTypes.Statement[],
    metapodaci: string,
    jobId: string
): Promise<AnalysisTypes.Statement[]> {
    const vectorIDs = [vectorStoreId];

    for (const statement of statements) {
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

            statement.analysis = JSON.parse(
                response.output_text || '{}',
            ) as AnalysisTypes.AnalizaResult;

        } catch (err: any) {
            if (err.status === 401) {
                logToJob(jobId, 'error', 'Invalid API key - cannot continue');
                throw new Error("Invalid API key - cannot continue");
            } else if (err.status === 402) {
                logToJob(jobId, 'error', 'Insufficient funds - cannot continue');
                throw new Error("Insufficient funds - cannot continue");
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

export function calculateScore(statements: AnalysisTypes.Statement[]): number {
    const ukupno = statements.reduce(
        (acc, obj) => acc + (obj.analysis?.podudarnost || 0),
        0,
    );
    const prosjek = ukupno / statements.length;
    return prosjek;
}

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

export async function analyzeAllData(jobId: string): Promise<void> {
    logToJob(jobId, 'info', 'Započinjem analiziranje izjava')
    const totalStart = Date.now();
    const batchSize = 20;
    let offset = 0;
    let batch: AnalysisTypes.StructuredCommentDict = {};
    let totalComments = 0;

    try {
        do {
            batch = await getStructuredComments(batchSize, offset);
            batch = await enrichSkupInfo(batch);

            totalComments = Object.values(batch).reduce((acc, skup) => acc + skup.comments.length, 0);
            // console.log(`Dohvaćeno ${totalComments} komentara`);

            if (totalComments === 0) {
                break;
            }
            for (const skupId of Object.keys(batch)) {
                await analyzeSkup(batch[skupId], jobId);
            }

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

// Analiziraj jedan skup
async function analyzeSkup(skup: AnalysisTypes.SkupGroup, jobId: string): Promise<void> {
    logToJob(jobId, 'info', `Analiziram skup podataka ID: ${skup.skup_id}`)
    let skupId = skup.skup_id

    try {
        const result = await createVectorStore(skup, jobId);
        if (isVectorStoreError(result)) {
            logToJob(jobId, 'error', `Error: ${result.error}`)
            for (const comment of skup.comments) {
                await writeErrorToDb(comment, result.error, true);
                await updateSkupLastAnalysis(skupId)
            }
            return;
        }

        const { vectorStore, fileIds } = result;

        const filesResponse = await openai.vectorStores.files.list(vectorStore.id);
        if (!filesResponse.data || filesResponse.data.length === 0) {
            logToJob(jobId, 'info', 'Vector store je prazan, nema datoteka za analizu.')
            for (const comment of skup.comments) {
                await writeErrorToDb(comment, "Nema dostupnih datoteka za analizu izjava.", true);
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
                    vectorStore.id,
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


                await prisma.odgovor.update({
                    where: { id: comment.odgovorId },
                    data: {
                        message: jsonObj as Prisma.JsonObject,
                        score: score
                    }
                });

                await updateSkupLastAnalysis(skupId)

                logToJob(jobId, 'info', `Odgovor ${comment.odgovorId} ažuriran sa score: ${score}`);

            } catch (error: any) {
                if (error.message?.includes("cannot continue")) {
                    logToJob(jobId, 'error', `Kritična greška: ${error.message}`)
                    throw error;
                }

                logToJob(jobId, 'error', `Greška kod analize komentara ${comment.odgovorId}: ${error.message}`);
                await writeErrorToDb(comment, `Greška tijekom analize: ${error.message}`, true);
                await updateSkupLastAnalysis(skupId)
                continue;
            }
        }

        await cleanupResources(vectorStore.id, fileIds, jobId);

    } catch (error: any) {
        if (error.message?.includes("cannot continue")) {
            throw error;  // Kritična greška
        }
        logToJob(jobId, 'error', `Greška kod skupa ${skup.skup_id}: ${error.message}`);
        // Nastavi s sljedećim skupom
    }
}

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

async function writeErrorToDb(
    comment: AnalysisTypes.StructuredCommentRow,
    errorMessage: string,
    update: boolean = true
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

    if (update) {
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

function isVectorStoreError(
    result: AnalysisTypes.VectorStoreResponse,
): result is AnalysisTypes.VectorStoreError {
    return 'error' in result;
}