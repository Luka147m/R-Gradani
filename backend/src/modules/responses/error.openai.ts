/**
 * Klasa koju radimo kada se dogodi kritična greška s OpenAI API-jem - npr. neispravan API ključ, nedovoljno sredstava itd.
 */
export class CriticalApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CriticalApiError';
    }
}

/**
 * Greška koja se događa ako je posao prekinut
 */
export class JobCancelledError extends Error {
    constructor(jobId: string) {
        super(`Job ${jobId} was cancelled`);
        this.name = 'JobCancelledError';
    }
}