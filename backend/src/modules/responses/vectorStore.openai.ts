import OpenAI from 'openai';
import * as AnalysisTypes from '../responses/analysis.types';
import { logToJob } from '../helper/logger';
import { createFile } from './fileUpload.openai';

const openai = new OpenAI();
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function createVectorStore(
    skup: AnalysisTypes.SkupGroup,
    jobId: string
): Promise<AnalysisTypes.VectorStoreResponse> {
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

    logToJob(jobId, 'debug', `Vector store ID: ${vectorStore.id}`);

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
            logToJob(jobId, 'debug', `Datoteka dodana u vector store: ${result.id}`);
        } catch (error) {
            logToJob(jobId, 'warn', `Greška pri dodavanju datoteke: ${error}`);
        }
    }
}

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