import * as reponsesRepository from '../responses/responses.repository';
import { completeJob, logToJob, startJob, isJobCancelled } from '../helper/logger';

import { analyzeAllData, analyzeDataset } from './analyze.openai';
import { structureAll, structureForOneDataset } from './structure.openai';

import { CriticalApiError, JobCancelledError } from './error.openai';

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
        startJob(jobId);

        // Strukturiranje komentara
        logToJob(jobId, 'info', 'Započinjem strukturiranje');
        await structureAll(jobId);

        // Analiziranje strukturiranih komentara
        logToJob(jobId, 'info', 'Započinjem analiziranje');
        await analyzeAllData(jobId);

        logToJob(jobId, 'info', 'Završen posao');
        completeJob(jobId, true);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (error instanceof CriticalApiError) {
            logToJob(jobId, 'error', `Kritična greška: ${errorMessage}`);
            completeJob(jobId, false, errorMessage);
        } else if (error instanceof JobCancelledError || errorMessage === 'Job cancelled') {
            logToJob(jobId, 'info', 'Posao otkazan od strane korisnika');
            completeJob(jobId, false);
        } else {
            logToJob(jobId, 'error', `Posao neuspješan: ${errorMessage}`);
            completeJob(jobId, false, errorMessage);
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
        startJob(jobId);

        // Strukturiranje komentara koji nemaju odgovore
        logToJob(jobId, 'info', 'Započinjem strukturiranje');
        await structureForOneDataset(skupId, jobId);

        // Analiza strukturiranih komentara
        logToJob(jobId, 'info', 'Započinjem analiziranje');
        await analyzeDataset(skupId, jobId);

        logToJob(jobId, 'info', 'Završen posao');
        completeJob(jobId, true);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (error instanceof CriticalApiError) {
            logToJob(jobId, 'error', `Kritična greška: ${errorMessage}`);
            completeJob(jobId, false, errorMessage);
        } else if (error instanceof JobCancelledError || errorMessage === 'Job cancelled') {
            logToJob(jobId, 'info', 'Posao otkazan od strane korisnika');
            completeJob(jobId, false);
        } else {
            logToJob(jobId, 'error', `Posao neuspješan: ${errorMessage}`);
            completeJob(jobId, false, errorMessage);
        }
    }
};