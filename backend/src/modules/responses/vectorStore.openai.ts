/**
 * @file vectorStore.openai.ts
 *
 * Ova datoteka sadrži logiku za:
 *  Stvaranje vector store-a na OpenAI-ju
 *  Dodavanje datoteka u vector store
 *  Čekanje da vector store bude spreman za korištenje
 *  Brisanje vector store-a i povezanih datoteka s OpenAI-ja
 */
import OpenAI from 'openai';
import * as AnalysisTypes from '../responses/analysis.types';
import { logToJob } from '../helper/logger';
import { createFile } from './fileUpload.openai';
import { CriticalApiError } from './error.openai';

const openai = new OpenAI();
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Ova funkcija stvara vector store na openai-ju, dodaje datoteke (createFile i upload), 
 * kada završi vraća informacije o vector store-u ili ako je bila greška vraća VectorStoreError
 *
 * @param skup - tipa skupGroup, sadrži podatke o skupu, resursima i komentarima 
 * @param jobId - UUID posla za logiranje i eventualno prekidanje
 * @returns VectorStoreResponse s informacijama o vector store-u (VectorStoreResult) ili grešci VectorStoreError 
 * @throws Baca grešku, ako se dogodi greška tijekom poziva API, odnosno ako ne valja ključ ili smo potrošili sve novce
 */
export async function createVectorStore(
    skup: AnalysisTypes.SkupGroup,
    jobId: string
): Promise<AnalysisTypes.VectorStoreResponse> {
    try {
        const resources = skup.resources?.filter((res) => res.url && res.format) || [];

        if (resources.length === 0) {
            return {
                error: 'Skup podataka nema resurse za analizu.',
                reason: 'no_resources',
            };
        }

        const datasetId = skup.skup_id;
        const fileIds: string[] = [];
        const uploadResults: AnalysisTypes.FileUploadResult[] = [];

        for (const resource of resources) {
            if (!resource.url || !resource.format) {
                uploadResults.push({ fileId: null, reason: 'no_format' });
                continue;
            }


            // Poziv funkcije koja dohvaća datoteke i uploada ih na OpenAI
            // fileUpload.openai.ts
            // Ovdje može throw err ako API ključ ne valja ili nema sredstava
            const result = await createFile(
                resource.url,
                resource.format,
                resource.size
            );
            uploadResults.push(result);

            if (result.fileId) {
                fileIds.push(result.fileId);
            }
        }

        if (fileIds.length === 0) {
            return handleNoValidFiles(uploadResults);
        }

        const vectorStore = await openai.vectorStores.create({
            name: datasetId,
        });

        // logging
        logToJob(jobId, 'debug', `Vector store ID: ${vectorStore.id}`);

        // Ovdje može throw err ako API ključ ne valja ili nema sredstava
        await addFilesToVectorStore(vectorStore.id, fileIds, jobId);
        await new Promise((res) => setTimeout(res, 10_000));

        const isReady = await waitForVectorStoreReady(vectorStore.id, 300_000, jobId);

        if (!isReady) {
            await cleanupResources(vectorStore.id, fileIds, jobId);
            return {
                error: 'Datoteke nisu uspješno procesirane u vector store-u.',
                reason: 'processing_failed',
            };
        }

        return { vectorStore, fileIds };

    }
    catch (err: any) {
        if (err instanceof CriticalApiError) {
            logToJob(jobId, 'error', `Kritična greška: ${err.message}`);
            throw err;
        }

        logToJob(jobId, 'error', `Greška pri kreiranju vector store-a: ${err.message}`);
        return {
            error: `Greška pri kreiranju vector store-a: ${err.message}`,
            reason: 'processing_failed',
        };
    }
}

/**
 * Ova funkcija se poziva tijekom kreiranja vector store-a kako bi se dodale datoteke u vector store
 *
 * @param vectorStoreId - ID vector store-a
 * @param fileIds - niz ID-eva datoteka koje treba dodati u vector store
 * @param jobId - UUID posla za logiranje i eventualno prekidanje
 * @returns Ne vraća ništa, samo izvršava dodavanje datoteka
 * @throws Baca grešku ako dođe do kritične greške poput nevaljanog API ključa ili nedovoljnih sredstava
 */
async function addFilesToVectorStore(
    vectorStoreId: string,
    fileIds: string[],
    jobId: string
): Promise<void> {
    for (const fileId of fileIds) {
        try {
            const result = await openai.vectorStores.files.create(vectorStoreId, {
                file_id: fileId,
            });
            // logging
            logToJob(jobId, 'debug', `Datoteka dodana u vector store: ${result.id}`);

        } catch (err: any) {
            if (err.status === 401) {
                throw new CriticalApiError("Invalid API key");
            } else if (err.status === 402) {
                throw new CriticalApiError("Insufficient funds");
            }

            if (err.status === 429) {
                logToJob(jobId, 'warn', "Rate limit exceeded, skipping this file");
                continue;
            }
            else {
                logToJob(jobId, 'warn', `Greška pri dodavanju datoteke: ${err.message}`);
                console.error("Unknown error:", err.message);
                continue;
            }
        }
    }
}

/**
 * Ova funkcija čeka dok vector store ne bude spreman za korištenje
 *
 * @param vectorStoreId - ID vector store-a
 * @param maxWaitMs - maksimalno vrijeme čekanja u milisekundama
 * @param jobId - UUID posla za logiranje i eventualno prekidanje
 * @returns Vraća true ako je spreman za korištenje, inače false
 */
async function waitForVectorStoreReady(
    vectorStoreId: string,
    maxWaitMs: number = 300000,
    jobId: string,
): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = 15000;

    while (Date.now() - startTime < maxWaitMs) {
        const filesResponse = await openai.vectorStores.files.list(vectorStoreId);

        if (filesResponse.data.length === 0) {
            logToJob(jobId, 'debug', 'No files found in vector store.');
            return false;
        }

        const completedFiles = filesResponse.data.filter(
            (file) => file.status === 'completed',
        );
        const failedFiles = filesResponse.data.filter(
            (file) => file.status === 'failed' || file.status === 'cancelled',
        );
        const processingFiles = filesResponse.data.filter(
            (file) =>
                file.status !== 'completed' &&
                file.status !== 'failed' &&
                file.status !== 'cancelled',
        );

        logToJob(
            jobId,
            'info',
            `Files status - Completed: ${completedFiles.length}, Failed: ${failedFiles.length}, Processing: ${processingFiles.length}`,
        );

        if (failedFiles.length === filesResponse.data.length) {
            logToJob(jobId, 'error', 'All files failed to process.');
            return false;
        }

        if (completedFiles.length > 0 && processingFiles.length === 0) {
            logToJob(
                jobId,
                'info',
                `${completedFiles.length} file(s) processed successfully, ${failedFiles.length} failed`,
            );
            return true;
        }

        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        logToJob(
            jobId,
            'info',
            `Waiting for vector store to be ready... (${elapsedSeconds}s elapsed)`,
        );

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    logToJob(jobId, 'error', 'Timeout waiting for vector store to be ready');
    return false;
}

/**
 * Ova funkcija briše vector store i povezane datoteke sa openai-ja,
 * poziva se kada se završi analiza ili ako dođe do greške
 *
 * @param vectorStoreId - ID vector store-a
 * @param fileIds - niz ID-eva datoteka koje treba obrisati
 * @param jobId - UUID posla za logiranje i eventualno prekidanje
 * @returns Ne vraća ništa, samo izvršava brisanje resursa
 */
export async function cleanupResources(
    vectorStoreId: string,
    fileIds: string[],
    jobId: string
): Promise<void> {
    await openai.vectorStores.delete(vectorStoreId);
    logToJob(jobId, 'info', `Vector store ${vectorStoreId} obrisan.`);

    for (const fileId of fileIds) {
        try {
            await openai.files.delete(fileId);
            logToJob(jobId, 'debug', `File ${fileId} obrisan iz OpenAI storage-a.`);
        } catch (error) {
            if (
                error instanceof Error &&
                'status' in error &&
                (error as any).status === 404
            ) {
                logToJob(jobId, 'info', `File ${fileId} već ne postoji, preskačem.`);
            } else {
                logToJob(jobId, 'warn', `Greška pri brisanju file-a ${fileId}: ${error}`);
            }
        }
    }
}

/**
 * Isječak koda iz createVectorStore funkcije koji obrađuje slučaj kada nijedna datoteka nije uspješno učitana,
 * pridodaje greški odgovarajući razlog
 *
 * @param uploadResults - niz rezultata učitavanja datoteka s informacijama o neuspjelim pokušajima
 * @returns VectorStoreError s opisom greške i razlogom
 */
function handleNoValidFiles(uploadResults: AnalysisTypes.FileUploadResult[]): AnalysisTypes.VectorStoreError {
    const tooLargeCount = uploadResults.filter((r) => r.reason === 'too_large').length;
    const unsupportedFormatCount = uploadResults.filter((r) => r.reason === 'unsupported_format').length;

    if (tooLargeCount === uploadResults.length) {
        return {
            error: `Sve datoteke premašuju maksimalnu veličinu od ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
            reason: 'all_files_too_large',
        };
    } else if (unsupportedFormatCount === uploadResults.length) {
        return {
            error: 'Sve datoteke imaju nepodržane formate.',
            reason: 'no_valid_formats',
        };
    } else {
        return {
            error: 'Nijedna datoteka nije uspješno učitana. Provjerite dostupnost i format datoteka.',
            reason: 'all_files_failed',
        };
    }
}