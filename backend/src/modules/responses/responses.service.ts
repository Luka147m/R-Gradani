import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import * as reponsesRepository from '../responses/responses.repository';
import { fetchDatasetAndResourcesById } from '../datasets/datasets.service';
import * as AnalysisTypes from '../responses/analysis.types';
import { Statement } from './analysis.types';



const openai = new OpenAI();
const model = 'gpt-5-mini';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB max file just to be safe, mozemo promjeniti kasnije

const prompts = {
    analiziranje: `Analiziraj koliko je sljedeća izjava istinita za skup podataka koji sam ti predao.
    Komentar neka bude najviše jedna rečenica. Podudarnost predstavlja postotak zapisa/redaka za koji je izjava istinita.
    Ako je podudarnost manja od 25, onda je usvojenost True inače False.`
};

export const getResponsesByCommentId = async (commentId: number) => {
    if (!commentId || commentId <= 0) {
        throw new Error('Nevaljan komentar ID');
    }
    const responses = await reponsesRepository.fetchResponsesByCommentId(commentId);
    return responses;
};

export const getResponseById = async (responseId: number) => {
    if (!responseId || responseId <= 0) {
        throw new Error('Nevaljan odgovor ID');
    }
    const response = await reponsesRepository.fetchResponseById(responseId);
    if (!response) {
        throw new Error('Odgovor nije pronađen');
    }
    return response;
};

export const analyzeResponse = async (responseId: number, datasetId: string) => {

    //console.log("Pozvana je ruta za analiziranje");

    // dohvacanje odgovora iz baze
    const response = await reponsesRepository.fetchResponseById(responseId);
    console.log(response);

    if (!response) {
        // znaci da nema ni strukturiranih komentara
        console.log("Nema strukturiranih odgovora.")
        return { success: false, message: "Analiza nije ažurirana", reason: "Nema strukturiranih odgovora." };
    }

    // dohvacanje resursa skupa podataka iz baze
    const dataset = await fetchDatasetAndResourcesById(datasetId);
    if (!dataset) {
        console.log("Nema dataseta")
        return { success: false, message: "Analiza nije ažurirana", reason: `Skup podataka s ID ${datasetId} nije pronađen` };
    }
    //console.log("dataset")
    //console.log(dataset.id);

    // napravi SkupGroup
    const skup: AnalysisTypes.SkupGroup = {
        skup_id: dataset.id ?? '',
        title: dataset.title ?? null,
        refresh_frequency: dataset.refresh_frequency ?? null,
        theme: dataset.theme ?? null,
        description: dataset.theme ?? null,
        url: dataset.url ?? null,
        license_title: dataset.license_title ?? null,
        tags: Array.isArray(dataset.tags) ? (dataset.tags as string[]) : null,
        resources: dataset.resurs ?? null,
        comments: [],
    };

    // posao vezan uz vector store
    const result = await createVectorStore(skup);

    if (isVectorStoreError(result)) {
        console.log(`Error: ${result.error}`);
        for (const comment of skup.comments) {
            await writeErrorToDb(comment, result.error);
        }
        return { success: false, message: "Analiza nije ažurirana", reason: result.error };


    }
    const { vectorStore, fileIds } = result;

    const filesResponse = await openai.vectorStores.files.list(vectorStore.id);
    if (!filesResponse.data || filesResponse.data.length === 0) {
        console.log("Vector store je prazan, nema datoteka za analizu.");
        for (const comment of skup.comments) {
            await writeErrorToDb(comment, "Nema dostupnih datoteka za analizu izjava.");
        }
        return { success: false, message: "Analiza nije ažurirana", reason: "Nema dostupnih datoteka za analizu izjava." };

    }

    // priprema za analizriranje izjava
    let message;
    try {
        message = typeof response.message === 'string'
            ? JSON.parse(response.message)
            : response.message;
    } catch (error) {
        console.log(`Nevaljan JSON u response ${responseId}:`, error);
        return { success: false, message: "Analiza nije ažurirana", reason: `Nevaljan JSON u response ${responseId}:` };
    }

    if (message.error) {
        console.log(`Response ${responseId} se ne moze analizirati`, message.error);
        return { success: false, message: "Analiza nije ažurirana", reason: message.error };

    }

    // ovdje dodati da se uzima u obzir stanje flaga
    // ...
    // ...

    if (message.izjave && Array.isArray(message.izjave)) {
        message.izjave.forEach((izjava: Statement) => {
            // flag??
            izjava.analysis = undefined;
        })
    }

    const metapodaci: string = `
        Naziv skupa: ${skup.title || "N/A"}
        Opis skupa: ${skup.description || "N/A"}
        Tema: ${skup.theme || "N/A"}
        Učestalost osvježavanja: ${skup.refresh_frequency || "N/A"}
        URL skupa: ${skup.url || "N/A"}
        Licenca: ${skup.license_title || "N/A"}
        Tagovi: ${skup.tags ? skup.tags.join(", ") : "N/A"}
        `;

    // pozivanje analize
    const analyzedStatements = await analyzeStatements(
        vectorStore.id,
        message.izjave,
        metapodaci
    );

    // racunanje score-a
    const score = calculateScore(analyzedStatements);

    // spremanje novog zapisa analize u bazu jer mozemo imat vise analiza po komentaru?

    const jsonObj = { izjave: analyzedStatements };

    const created = await prisma.odgovor.create({
        data: {
            komentar_id: response.komentar_id,
            message: jsonObj as Prisma.JsonObject,
            score: score
        }
    });

    // čišćenje resursa
    cleanupResources(vectorStore.id, fileIds);

    return { success: true, message: "Analiza ažurirana", responseId: created.id }
};

async function analyzeStatements(
    vectorStoreId: string,
    statements: Statement[],
    metapodaci: string
): Promise<Statement[]> {
    const vectorIDs = [vectorStoreId];

    for (const statement of statements) {
        console.log("Analiziram izjavu ID:", statement.id);

        const response = await openai.responses.create({
            model: model,
            instructions: prompts.analiziranje,
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: "Izjava: " + statement.text,
                        },

                        {
                            type: "input_text",
                            text: "Metapodaci: " + metapodaci,
                        },
                    ],
                }],
            tools: [
                {
                    type: "file_search",
                    vector_store_ids: vectorIDs,
                },
            ],
            text: { format: zodTextFormat(AnalysisTypes.analizaSchema, "event"), },
        });

        statement.analysis = JSON.parse(response.output_text || "{}") as AnalysisTypes.AnalizaResult;
    }
    const logText = `Analiza izjava završena.`;
    console.log(logText);
    return statements;
}

async function cleanupResources(vectorStoreId: string, fileIds: string[]): Promise<void> {
    await openai.vectorStores.delete(vectorStoreId);
    console.log(`Vector store ${vectorStoreId} obrisan.`);

    for (const fileId of fileIds) {
        try {
            await openai.files.delete(fileId);
            console.log(`File ${fileId} obrisan iz OpenAI storage-a.`);
        } catch (error) {
            if (error instanceof Error && 'status' in error && (error as any).status === 404) {
                console.log(`File ${fileId} već ne postoji, preskačem.`);
            } else {
                console.error(`Greška pri brisanju file-a ${fileId}:`, error);
            }
        }
    }

}

async function createVectorStore(skup: AnalysisTypes.SkupGroup): Promise<AnalysisTypes.VectorStoreResponse> {
    console.log("Pozvan createVectorStore");

    const resources = skup.resources?.filter(res => res.url && res.format) || [];

    if (resources.length === 0) {
        return {
            error: "Skup podataka nema resurse za analizu.",
            reason: 'no_resources'
        };
    }

    const datasetId = skup.skup_id;
    const fileIds: string[] = [];
    const uploadResults: AnalysisTypes.FileUploadResult[] = [];

    for (const resource of resources) {
        if (!resource.url || !resource.format) {
            console.log("Resource missing URL or format, preskačem.");
            uploadResults.push({ fileId: null, reason: 'no_format' });
            continue;
        }

        const result = await createFile(resource.url, resource.format, resource.size);
        uploadResults.push(result);

        if (result.fileId) {
            fileIds.push(result.fileId);
        }
    }

    if (fileIds.length === 0) {
        const tooLargeCount = uploadResults.filter(r => r.reason === 'too_large').length;
        const unsupportedFormatCount = uploadResults.filter(r => r.reason === 'unsupported_format').length;

        if (tooLargeCount === uploadResults.length) {
            return {
                error: `Sve datoteke premašuju maksimalnu veličinu od ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
                reason: 'all_files_too_large'
            };
        } else if (unsupportedFormatCount === uploadResults.length) {
            return {
                error: "Sve datoteke imaju nepodržane formate.",
                reason: 'no_valid_formats'
            };
        } else {
            return {
                error: "Nijedna datoteka nije uspješno učitana. Provjerite dostupnost i format datoteka.",
                reason: 'all_files_failed'
            };
        }
    }

    const vectorStore = await openai.vectorStores.create({
        name: datasetId,
    });
    console.log("Vector store ID:", vectorStore.id);


    for (const fileId of fileIds) {
        try {
            const result = await openai.vectorStores.files.create(vectorStore.id, {
                file_id: fileId
            });
            console.log("Datoteka dodana u vector store:", result.id);
        } catch (error) {
            console.error("Greška pri dodavanju datoteke:", error);
        }
    }

    // Pričekaj malo prije provjere statusa jer vector store treba malo vremena
    await new Promise(res => setTimeout(res, 10_000));

    const isReady = await waitForVectorStoreReady(vectorStore.id);
    if (!isReady) {
        console.error("Vector store not ready, cleaning up...");

        try {
            await openai.vectorStores.delete(vectorStore.id);
            console.log(`Vector store ${vectorStore.id} obrisan.`);
        } catch (error) {
            console.error(`Greška pri brisanju vector store-a ${vectorStore.id}:`, error);
        }

        for (const fileId of fileIds) {
            try {
                await openai.files.delete(fileId);
                console.log(`File ${fileId} obrisan iz OpenAI storage-a.`);
            } catch (error) {
                if (error instanceof Error && 'status' in error && (error as any).status === 404) {
                    console.log(`File ${fileId} već ne postoji, preskačem.`);
                } else {
                    console.error(`Greška pri brisanju file-a ${fileId}:`, error);
                }
            }
        }

        return {
            error: "Datoteke nisu uspješno procesirane u vector store-u.",
            reason: 'processing_failed'
        };
    }
    return { vectorStore, fileIds }
}

async function createFile(filePath: string, format: string | null, fileSize: number | null): Promise<AnalysisTypes.FileUploadResult> {
    console.log("Pozvan createFile");

    const supportedFormats = ["csv", "doc", "docx", "html", "json", "pdf", "pptx", "txt", "xlsx", "xml", "xlsm", "xslx", "xls", "kml", "geojson"];

    if (fileSize !== null) {
        if (fileSize > MAX_FILE_SIZE) {
            console.log(`File too large (${(fileSize / 1024 / 1024).toFixed(2)} MB), skipping. Max: ${MAX_FILE_SIZE / 1024 / 1024} MB`);
            return { fileId: null, reason: 'too_large' };
        }
    }

    if (!filePath.startsWith("http://") && !filePath.startsWith("https://")) {
        console.log("Unsupported file path, must be a URL.");
        return { fileId: null, reason: 'invalid_url' };
    }

    if (!format) {
        console.log("Format not specified.");
        return { fileId: null, reason: 'no_format' };
    }

    const pathname = new URL(filePath).pathname;
    const filenameWithExt = pathname.split("/").pop();

    const filename = filenameWithExt?.replace(/\.[^/.]+$/, "");

    const lowerFormat = format.replace(/^\./, "").toLowerCase();
    let fileNameFixed = `${filename}.${lowerFormat}`;

    if (!supportedFormats.includes(lowerFormat)) {
        console.log(`Format '${lowerFormat}' nije podržan, preskačem.`);
        return { fileId: null, reason: 'unsupported_format' };
    }

    // Fix incorrectly written formats
    if (["xslx", "xls", "xlsm"].includes(lowerFormat)) {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, ".xlsx");
    } else if (lowerFormat === "kml") {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, ".xml");
    } else if (lowerFormat === "geojson") {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, ".json");
    }
    let res: Response;
    try {
        res = await fetch(filePath);
        if (!res.ok) {
            console.log(`Cannot access file at URL: ${res.status} ${res.statusText}`);
            return { fileId: null, reason: 'fetch_error' };
        }
    } catch (err) {
        console.log(`Error fetching file from URL: ${(err as Error).message}`);
        return { fileId: null, reason: 'fetch_error' };
    }

    const buffer = await res.arrayBuffer();

    const actualSize = buffer.byteLength;
    if (actualSize > MAX_FILE_SIZE) {
        console.log(`Downloaded file too large (${(actualSize / 1024 / 1024).toFixed(2)} MB), skipping.`);
        return { fileId: null, reason: 'too_large' };
    }

    const file = new File([buffer], fileNameFixed);

    try {
        const result = await openai.files.create({
            file: file,
            purpose: "assistants",
        });
        return { fileId: result.id };
    } catch (uploadErr) {
        console.log(`Error uploading file: ${(uploadErr as Error).message}`);
        return { fileId: null, reason: 'upload_error' };
    }
}

async function waitForVectorStoreReady(vectorStoreId: string, maxWaitMs: number = 300000): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = 15000;

    while (Date.now() - startTime < maxWaitMs) {
        const filesResponse = await openai.vectorStores.files.list(vectorStoreId);

        if (filesResponse.data.length === 0) {
            console.error("No files found in vector store");
            return false;
        }

        const completedFiles = filesResponse.data.filter(file => file.status === 'completed');
        const failedFiles = filesResponse.data.filter(file => file.status === 'failed' || file.status === 'cancelled');
        const processingFiles = filesResponse.data.filter(file =>
            file.status !== 'completed' && file.status !== 'failed' && file.status !== 'cancelled'
        );

        console.log(`Files status - Completed: ${completedFiles.length}, Failed: ${failedFiles.length}, Processing: ${processingFiles.length}`);

        // SVI fileovi su failed
        if (failedFiles.length === filesResponse.data.length) {
            console.error("All files failed to process");
            return false;
        }

        // Barem jedan uspio
        if (completedFiles.length > 0 && processingFiles.length === 0) {
            console.log(`${completedFiles.length} file(s) processed successfully, ${failedFiles.length} failed`);
            return true;
        }

        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        console.log(`Waiting for vector store to be ready... (${elapsedSeconds}s elapsed)`);

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    console.error("Timeout waiting for vector store to be ready");
    return false;
}

function calculateScore(statements: AnalysisTypes.Statement[]): number {
    const ukupno = statements.reduce((acc, obj) => acc + (obj.analysis?.podudarnost || 0), 0);
    const prosjek = ukupno / statements.length;
    return prosjek;
}

async function writeErrorToDb(comment: AnalysisTypes.StructuredCommentRow, errorMessage: string): Promise<void> {
    const { odgovorId, message } = comment;

    const existingObj: Record<string, any> =
        message && typeof message === "object" && !Array.isArray(message)
            ? (message as Record<string, any>)
            : {};

    const newMessage: Prisma.JsonObject = {
        error: errorMessage,
        ...existingObj
    };

    await prisma.odgovor.create({
        data: {
            created: new Date(),
            message: newMessage,
            score: -1
        }
    });
}

function isVectorStoreError(result: AnalysisTypes.VectorStoreResponse): result is AnalysisTypes.VectorStoreError {
    return 'error' in result;
}