/**
 * Klasa koju radimo kada se dogodi kritična greška s OpenAI API-jem - npr. neispravan API ključ, nedovoljno sredstava itd.
 */
export class CriticalApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CriticalApiError';
    }
}