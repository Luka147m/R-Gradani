import OpenAI from 'openai';
import * as AnalysisTypes from '../responses/analysis.types';

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

export async function createFile(
    filePath: string,
    format: string | null,
    fileSize: number | null
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

    return await uploadFileToOpenAI(buffer, fileName);
}

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

async function uploadFileToOpenAI(
    buffer: ArrayBuffer,
    fileName: string
): Promise<AnalysisTypes.FileUploadResult> {
    try {
        const file = new File([buffer], fileName);
        const result = await openai.files.create({
            file: file,
            purpose: 'assistants',
        });
        return { fileId: result.id };
    } catch (uploadErr) {
        return { fileId: null, reason: 'upload_error' };
    }
}