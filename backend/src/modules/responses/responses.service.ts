import * as reponsesRepository from '../responses/responses.repository';
import { completeJob, logToJob, startJob, isJobCancelled } from '../helper/logger';

import { analyzeAllData, analyzeDataset } from './analyze.openai';
import { structureAll, structureForOneDataset } from './structure.openai';

import { CriticalApiError } from './error.openai';

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

//----------------------------------------------------------------------------------

/**
 * Funkcija koja pokreće kompletan proces strukturiranja i analiziranja svih podataka.
 * Tijekom rada dodaje logove u posao s danim jobId-om. Ako je posao otkazan, prekida se što prije.
 * Također prekida posao ako se dogodi kritična greška (npr. nevaljani API ključ, nemamo kredita više).
 * 
 * @param jobId - ID posla za logiranje
 * 
 */
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

        // 2 Analiziranje - radi, ali iz nekog razloga sporo??
        await analyzeAllData(jobId)

        if (isJobCancelled(jobId)) {
            logToJob(jobId, 'info', 'Job cancelled');
            completeJob(jobId, false);
            return;
        }

        logToJob(jobId, 'info', 'Završen posao')
        completeJob(jobId, true)

    } catch (error: unknown) {
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);

        if (error instanceof CriticalApiError) {
            logToJob(jobId, 'error', `Kritična greška: ${errorMessage}`);
            completeJob(jobId, false);
        } else if (errorMessage === 'Job cancelled') {
            logToJob(jobId, 'info', 'Job cancelled by user');
            completeJob(jobId, false);
        } else {
            logToJob(jobId, 'error', `Posao neuspješan: ${errorMessage}`);
            completeJob(jobId, false);
        }
    }
};

/**
 * Funkcija koja pokreće kompletan proces strukturiranja (po potrebi) i analiziranja JEDNOG skupa podataka.
 * Tijekom rada dodaje logove u posao s danim jobId-om. Ako je posao otkazan, prekida se što prije.
 * Također prekida posao ako se dogodi kritična greška (npr. nevaljani API ključ, nemamo kredita više).
 * 
 * @param skupId - UUID skupa podataka koji se analizira
 * @param jobId - ID posla za logiranje
 * 
 */
export const analyzeOneDataset = async (skupId: string, jobId: string) => {
    try {
        startJob(jobId)
        if (isJobCancelled(jobId)) {
            logToJob(jobId, 'info', 'Job cancelled');
            completeJob(jobId, false);
            return;
        }

        // Radi strukturiranje za komentare koji nemaju
        logToJob(jobId, 'info', 'Započinjem strukturiranje')
        await structureForOneDataset(skupId, jobId)

        if (isJobCancelled(jobId)) {
            logToJob(jobId, 'info', 'Job cancelled');
            completeJob(jobId, false);
            return;
        }

        // Ponovno analiziraj
        await analyzeDataset(skupId, jobId)
        if (isJobCancelled(jobId)) {
            logToJob(jobId, 'info', 'Job cancelled');
            completeJob(jobId, false);
            return;
        }
        logToJob(jobId, 'info', 'Završen posao')
        completeJob(jobId, true)
    } catch (error: unknown) {
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);

        if (error instanceof CriticalApiError) {
            logToJob(jobId, 'error', `Kritična greška: ${errorMessage}`);
            completeJob(jobId, false);
        } else if (errorMessage === 'Job cancelled') {
            logToJob(jobId, 'info', 'Job cancelled by user');
            completeJob(jobId, false);
        } else {
            logToJob(jobId, 'error', `Posao neuspješan: ${errorMessage}`);
            completeJob(jobId, false);
        }
    }
};