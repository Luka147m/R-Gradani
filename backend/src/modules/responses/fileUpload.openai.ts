/**
 * @file fileUpload.openai.ts
 *
 * Ova datoteka sadrži logiku za:
 *  Dohvat datoteka s danog URL-a - odnosno dohvaća datoteka s data.gov.hr
 *  Ispravlja ime datoteke i filtrira neke ekstenzije
 *  Upload datoteka na OpenAI koristeći njihov API
 */
import OpenAI from 'openai';
import * as AnalysisTypes from '../responses/analysis.types';
import { CriticalApiError } from './error.openai';

const openai = new OpenAI();
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const SUPPORTED_FORMATS = [
    'csv',
    'doc',
    'docx',
    'html',
    'json',
    'pdf',
    'pptx',
    'txt',
    'xlsx',
    'xml',
    'xlsm',
    'xslx',
    'xls',
    'kml',
    'geojson',
];

/**
 * Funkcija prima putanja (URL) datoteke, provjerava veličinu i format, i je li ju moguće dohvatiti
 *
 * @param filePath - URL datoteke za dohvat
 * @param format - format datoteke
 * @param fileSize - veličina datoteke u bajtovima
 * @returns FileUploadResult s ID-em datoteke ako je uspješno uploadana ili razlogom neuspjeha
 * @throws Prosljeđuje greške vezano s uploadFileToOpenAI funkcijom - neispravan API ključ, nedovoljno sredstava itd.
 */
export async function createFile(
    filePath: string,
    format: string | null,
    fileSize: number | null,
): Promise<AnalysisTypes.FileUploadResult> {
    if (fileSize !== null && fileSize > MAX_FILE_SIZE) {
        return { fileId: null, reason: 'too_large' };
    }

    if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
        return { fileId: null, reason: 'invalid_url' };
    }

    if (!format) {
        return { fileId: null, reason: 'no_format' };
    }

    const lowerFormat = format.replace(/^\./, '').toLowerCase();

    if (!SUPPORTED_FORMATS.includes(lowerFormat)) {
        return { fileId: null, reason: 'unsupported_format' };
    }

    const fileName = generateFileName(filePath, lowerFormat);
    const buffer = await downloadFile(filePath);

    if (!buffer) {
        return { fileId: null, reason: 'fetch_error' };
    }

    if (buffer.byteLength > MAX_FILE_SIZE) {
        return { fileId: null, reason: 'too_large' };
    }

    try {
        return await uploadFileToOpenAI(buffer, fileName);
    } catch (err) {
        throw err; // Propagira grešku dalje
    }
}

/**
 * Pomoćna funkcija koja je pozvana iz createFile funkcije,
 * generira ispravno ime datoteke na osnovu url i popravlja format ekstenziju
 *
 * @param filePath - URL datoteke za dohvat
 * @param format - format datoteke
 * @returns String s imenom datoteke
 */
function generateFileName(filePath: string, format: string): string {
    const pathname = new URL(filePath).pathname;
    const filenameWithExt = pathname.split('/').pop();
    const filename = filenameWithExt?.replace(/\.[^/.]+$/, '');

    let fileNameFixed = `${filename}.${format}`;

    if (['xslx', 'xls', 'xlsm'].includes(format)) {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, '.xlsx');
    } else if (format === 'kml') {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, '.xml');
    } else if (format === 'geojson') {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, '.json');
    }

    return fileNameFixed;
}

/**
 * Funkcija dohvaća datoteku s danog URL-a i vraća njen sadržaj kao ArrayBuffer
 * Pozvana je iz createFile funkcije
 *
 * @param filePath - URL datoteke za dohvat
 * @returns ArrayBuffer s sadržajem datoteke ili null ako dohvatanje nije uspjelo
 */
async function downloadFile(filePath: string): Promise<ArrayBuffer | null> {
    try {
        const res = await fetch(filePath);
        if (!res.ok) {
            return null;
        }
        return await res.arrayBuffer();
    } catch (err) {
        return null;
    }
}

/**
 * Funkcija koja obavlja upload na openai
 *
 * @param buffer - sadržaj datoteke kao ArrayBuffer
 * @param fileName - ime datoteke
 * @returns FileUploadResult s ID-em datoteke ako je uspješno uploadana
 * @throws Baca grešku ako je API ključ neispravan ili nema dovoljno sredstava
 */
async function uploadFileToOpenAI(
    buffer: ArrayBuffer,
    fileName: string,
): Promise<AnalysisTypes.FileUploadResult> {
    try {
        const file = new File([buffer], fileName);
        const result = await openai.files.create({
            file: file,
            purpose: 'assistants',
        });
        return { fileId: result.id };
    } catch (err: any) {
        if (err.status === 401 || err.status === 402) {
            throw new CriticalApiError(
                err.status === 401 ? 'Invalid API key' : 'Insufficient funds'
            );
        }
        else {
            console.error('Upload error:', err.message);
            return { fileId: null, reason: 'upload_error' };
        }
    }
}
