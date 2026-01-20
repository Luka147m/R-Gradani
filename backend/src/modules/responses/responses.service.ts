import * as reponsesRepository from '../responses/responses.repository';
import { completeJob, logToJob, startJob, isJobCancelled } from '../helper/logger';

import { analyzeAllData } from './analyze.openai';
import { structureAll } from './structure.openai';

// ----------------------------------------------------------------------------------

export const getResponsesByCommentId = async (commentId: number) => {
    if (!commentId || commentId <= 0) {
        throw new Error('Nevaljan komentar ID');
    }
    const responses = await reponsesRepository.fetchResponsesByCommentId(commentId)
    return responses;
};

export const getResponseById = async (responseId: number) => {
    if (!responseId || responseId <= 0) {
        throw new Error('Nevaljan odgovor ID');
    }
    const response = await reponsesRepository.fetchResponseById(responseId)
    if (!response) {
        throw new Error('Odgovor nije pronađen')
    }
    return response;
};

// // Analiza za jedan skup
// export const analyzeResponse = async (
//     responseId: number,
//     datasetId: string,
//     jobId: string,
// ) => {

//     startJob(jobId)
//     const response = await reponsesRepository.fetchResponseById(responseId);

//     if (!response) {
//         logToJob(jobId, 'info', 'Analiza nije ažurirana nema strukturiranih odgovora.')
//         completeJob(jobId, false)
//         return;
//     }

//     const dataset = await fetchDatasetAndResourcesById(datasetId);
//     if (!dataset) {
//         logToJob(jobId, 'info', `Skup podataka s ID ${datasetId} nije pronađen`)
//         completeJob(jobId, false)
//         return;
//     }

//     const skup: AnalysisTypes.SkupGroup = {
//         skup_id: dataset.id ?? '',
//         title: dataset.title ?? null,
//         refresh_frequency: dataset.refresh_frequency ?? null,
//         theme: dataset.theme ?? null,
//         description: dataset.theme ?? null,
//         url: dataset.url ?? null,
//         license_title: dataset.license_title ?? null,
//         tags: Array.isArray(dataset.tags) ? (dataset.tags as string[]) : null,
//         resources: dataset.resurs ?? null,
//         comments: [],
//     };

//     const result = await createVectorStore(skup, jobId);

//     if (isVectorStoreError(result)) {
//         for (const comment of skup.comments) {
//             await writeErrorToDb(comment, result.error)
//         }
//         completeJob(jobId, false, `Analiza nije ažurirana ${result.error}`)
//         return;
//     }

//     const { vectorStore, fileIds } = result;

//     const filesResponse = await openai.vectorStores.files.list(vectorStore.id);
//     if (!filesResponse.data || filesResponse.data.length === 0) {
//         logToJob(jobId, 'info', 'Vector store je prazan, nema datoteka za analizu.')
//         for (const comment of skup.comments) {
//             await writeErrorToDb(comment, 'Nema dostupnih datoteka za analizu izjava.')
//         }
//         logToJob(jobId, 'info', 'Analiza nije ažurirana nema dostupnih datoteka za analizu izjava.')
//         completeJob(jobId, false)
//         return;
//     }

//     let message;
//     try {
//         message = typeof response.message === 'string'
//             ? JSON.parse(response.message)
//             : response.message;
//     } catch (error) {
//         logToJob(jobId, 'info', `Analiza nije ažurirana nevaljan JSON u response ${responseId}`)
//         completeJob(jobId, false)

//         return;
//     }

//     if (message.error) {
//         logToJob(jobId, 'info', `Analiza nije ažurirana ${message.error}`)
//         completeJob(jobId, false)

//         return;
//     }

//     if (message.izjave && Array.isArray(message.izjave)) {
//         message.izjave.forEach((izjava: Statement) => {
//             izjava.analysis = undefined;
//         });
//     }

//     const metapodaci = buildMetadata(skup);
//     const analyzedStatements = await analyzeStatements(
//         vectorStore.id,
//         message.izjave,
//         metapodaci,
//         jobId
//     );

//     const score = calculateScore(analyzedStatements);

//     const jsonObj = { izjave: analyzedStatements };

//     await prisma.odgovor.create({
//         data: {
//             komentar_id: response.komentar_id,
//             message: jsonObj as Prisma.JsonObject,
//             score: score,
//         },
//     });

//     cleanupResources(vectorStore.id, fileIds, jobId);

//     logToJob(jobId, 'info', 'Analiza ažurirana');
//     completeJob(jobId, true)

//     return;
// };

// Analiza za sve
export const analyzeAll = async (jobId: string) => {
    try {
        startJob(jobId)


        if (isJobCancelled(jobId)) {
            logToJob(jobId, 'info', 'Job cancelled');
            completeJob(jobId, false);
            return;
        }

        // 1 Strukturiranje - radi
        logToJob(jobId, 'info', 'Započinjem strukturiranje')
        await structureAll(jobId)

        if (isJobCancelled(jobId)) {
            logToJob(jobId, 'info', 'Job cancelled');
            completeJob(jobId, false);
            return;
        }

        // 2 Analiziranje
        await analyzeAllData(jobId)

        if (isJobCancelled(jobId)) {
            logToJob(jobId, 'info', 'Job cancelled');
            completeJob(jobId, false);
            return;
        }

        logToJob(jobId, 'info', 'Završen posao')
        completeJob(jobId, true)
    } catch (error: any) {
        if (error.message === 'Job cancelled') {
            logToJob(jobId, 'info', 'Job cancelled by user');
            completeJob(jobId, false);
        } else {
            logToJob(jobId, 'error', `Posao neuspješan: ${error.message}`);
            completeJob(jobId, false);
        }
    }
};

