import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI();

const model = 'gpt-5-mini';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB max file just to be safe, mozemo promjeniti kasnije

const prompts = {
    analiziranje: `Analiziraj koliko je sljedeća izjava istinita za skup podataka koji sam ti predao.
    Komentar neka bude najviše jedna rečenica. Podudarnost predstavlja postotak zapisa/redaka za koji je izjava istinita.
    Ako je podudarnost manja od 25, onda je usvojenost True inače False.`
};

const analizaSchema = z.object({
    komentar: z.string(),
    usvojenost: z.boolean(), // je li komentar usvojen ili ne
    podudarnost: z.number(), // postotak podudarnosti 
});

type AnalizaResult = z.infer<typeof analizaSchema>;

type Statement = {
    id: number;
    text: string;
    category?: string;
    analysis?: AnalizaResult;
    flag?: boolean;
};

type MessageStructure = {
    izjave: Statement[];
};

type StructuredCommentRow = {
    odgovorId: number;
    message: Prisma.JsonValue | null;
    skupId: string | null;
};

type Resource = {
    id: string;
    url: string | null;
    name: string | null;
    format: string | null;
    mimetype: string | null;
    size: number | null;
};

type SkupGroup = {
    skup_id: string;
    title: string | null;
    refresh_frequency: string | null;
    theme: string | null;
    description: string | null;
    url: string | null;
    license_title: string | null;
    tags: string[] | null;
    resources: Resource[] | null;
    comments: StructuredCommentRow[];
};

type StructuredCommentDict = Record<string, SkupGroup>;

type VectorStoreResult = {
    vectorStore: OpenAI.VectorStore;
    fileIds: string[];
};

type VectorStoreError = {
    error: string;
    reason: 'no_resources' | 'all_files_too_large' | 'all_files_failed' | 'processing_failed' | 'no_valid_formats';
};

type VectorStoreResponse = VectorStoreResult | VectorStoreError;

function isVectorStoreError(result: VectorStoreResponse): result is VectorStoreError {
    return 'error' in result;
}

type FileUploadResult = {
    fileId: string | null;
    reason?: 'too_large' | 'invalid_url' | 'no_format' | 'unsupported_format' | 'fetch_error' | 'upload_error';
};

// Funkcija koja dohvaća n komentara koji još nemaju odgovore
async function getStructuredComments(limit: number, offset: number = 0): Promise<StructuredCommentDict> {

    const rawRows = await prisma.odgovor.findMany({
        where: {
            score: null,   // Oni koji su null još nisu obrađeni
        },
        select: {
            id: true,
            message: true,
            komentar: {
                select: {
                    skup_podataka: {
                        select: {
                            id: true // Id skupa kad budemo dohvatili metapodatke skupova i informacije o fileovima
                        }
                    }
                }
            }
        },
        take: limit,
        skip: offset
    });

    // Flatten
    const structured: StructuredCommentRow[] = rawRows.map(row => ({
        odgovorId: row.id,
        message: row.message,
        skupId: row.komentar?.skup_podataka?.id ?? null
    }));

    const groups: StructuredCommentDict = {};

    for (const item of structured) {
        if (!item.skupId) continue;

        if (!groups[item.skupId]) {
            groups[item.skupId] = {
                skup_id: item.skupId,
                title: null,
                refresh_frequency: null,
                theme: null,
                description: null,
                url: null,
                license_title: null,
                tags: null,
                resources: [],
                comments: []
            };
        }

        groups[item.skupId].comments.push(item);
    }

    return groups;

}

/**
 * {
 "skup123": {
    skup_id: "skup123",
    title: null,
    refresh_frequency: null,
    theme: null,
    description: null,
    url: null,
    license_title: null,
    tags: null,
    resources: [],
    comments: [
        { odgovorId: 1, message: {...}, skupId: "skup123" },
        { odgovorId: 5, message: {...}, skupId: "skup123" }
    ]
}
}
*/

async function enrichSkupInfo(dict: StructuredCommentDict): Promise<StructuredCommentDict> {
    const skupIds = Object.keys(dict);

    if (skupIds.length === 0) return dict;

    // Dohvati sve skupove podatka u jednom queryju
    const skupovi = await prisma.skup_podataka.findMany({
        where: {
            id: { in: skupIds }
        },
        select: {
            id: true,
            title: true,
            refresh_frequency: true,
            theme: true,
            description: true,
            url: true,
            license_title: true,
            tags: true,
            resurs: {
                select: {
                    id: true,
                    name: true,
                    format: true,
                    mimetype: true,
                    size: true,
                    url: true
                }
            }
        }
    });

    for (const skup of skupovi) {
        const entry = dict[skup.id];
        if (!entry) continue;

        entry.title = skup.title;
        entry.refresh_frequency = skup.refresh_frequency;
        entry.theme = skup.theme;
        entry.description = skup.description;
        entry.url = skup.url;
        entry.license_title = skup.license_title;
        entry.tags = Array.isArray(skup.tags) ? (skup.tags as string[]) : null;
        entry.resources = skup.resurs;
    }

    return dict;
}

function calculateScore(statements: Statement[]): number {
    const ukupno = statements.reduce((acc, obj) => acc + (obj.analysis?.podudarnost || 0), 0);
    const prosjek = ukupno / statements.length;
    return prosjek;
}

async function createFile(filePath: string, format: string | null, fileSize: number | null): Promise<FileUploadResult> {
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

// Pricekaj da se napravi vector store
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

// Create vector store for a dataset
async function createVectorStore(skup: SkupGroup): Promise<VectorStoreResponse> {

    const resources = skup.resources?.filter(res => res.url && res.format) || [];

    if (resources.length === 0) {
        return {
            error: "Skup podataka nema resurse za analizu.",
            reason: 'no_resources'
        };
    }

    const datasetId = skup.skup_id;
    const fileIds: string[] = [];
    const uploadResults: FileUploadResult[] = [];

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

// Analyze statements using OpenAI
async function analyzeStatements(
    vectorStoreId: string,
    statements: Statement[],
    metapodaci: string
): Promise<Statement[]> {
    const start = Date.now();
    const vectorIDs = [vectorStoreId];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

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
            text: { format: zodTextFormat(analizaSchema, "event"), },
        });

        statement.analysis = JSON.parse(response.output_text || "{}") as AnalizaResult;
    }
    const end = Date.now();
    const logText = `Analiza izjava završena. Ukupno ulaznih tokena: ${totalInputTokens}, ukupno izlaznih tokena: ${totalOutputTokens}, ukupno tokena: ${totalInputTokens + totalOutputTokens}. Vrijeme izvođenja: ${(end - start) / 1000} sekundi.`;
    // console.log(logText);

    return statements;
}

async function writeErrorToDb(comment: StructuredCommentRow, errorMessage: string): Promise<void> {
    const { odgovorId, message } = comment;

    const existingObj: Record<string, any> =
        message && typeof message === "object" && !Array.isArray(message)
            ? (message as Record<string, any>)
            : {};

    const newMessage: Prisma.JsonObject = {
        error: errorMessage,
        ...existingObj
    };

    await prisma.odgovor.update({
        where: { id: odgovorId },
        data: {
            message: newMessage,
            score: -1
        }
    });
}

// Analiziraj jedan skup
async function analyzeSkup(skup: SkupGroup): Promise<void> {
    console.log("Analiziram skup podataka ID:", skup.skup_id);

    const result = await createVectorStore(skup);
    if (isVectorStoreError(result)) {
        console.log(`Error: ${result.error}`);
        for (const comment of skup.comments) {
            await writeErrorToDb(comment, result.error);
        }
        return;
    }

    const { vectorStore, fileIds } = result;

    const filesResponse = await openai.vectorStores.files.list(vectorStore.id);
    if (!filesResponse.data || filesResponse.data.length === 0) {
        console.log("Vector store je prazan, nema datoteka za analizu.");
        for (const comment of skup.comments) {
            await writeErrorToDb(comment, "Nema dostupnih datoteka za analizu izjava.");
        }
        return;
    }

    for (const comment of skup.comments) {
        if (!comment.message || typeof comment.message !== 'object') continue;

        const messageObj = comment.message as MessageStructure;
        if (!messageObj.izjave || !Array.isArray(messageObj.izjave)) continue;

        console.log(`Analiziraj izjave za odgovor ${comment.odgovorId}`);

        const statements = messageObj.izjave;
        const updatedStatements: Statement[] = statements.map(stat => ({
            ...stat,
            analysis: undefined
        }));

        const metapodaci: string = `
        Naziv skupa: ${skup.title || "N/A"}
        Opis skupa: ${skup.description || "N/A"}
        Tema: ${skup.theme || "N/A"}
        Učestalost osvježavanja: ${skup.refresh_frequency || "N/A"}
        URL skupa: ${skup.url || "N/A"}
        Licenca: ${skup.license_title || "N/A"}
        Tagovi: ${skup.tags ? skup.tags.join(", ") : "N/A"}
        `;

        const analyzedStatements = await analyzeStatements(vectorStore.id, updatedStatements, metapodaci);

        const finalStatements = analyzedStatements.map(s => ({
            ...s,
            flag: false
        }));

        const jsonObj = { izjave: finalStatements };
        const score = calculateScore(finalStatements);

        await prisma.odgovor.update({
            where: { id: comment.odgovorId },
            data: {
                message: jsonObj as Prisma.JsonObject,
                score: score
            }
        });

        // console.log(`Odgovor ${comment.odgovorId} ažuriran sa score: ${score}`);
    }

    await openai.vectorStores.delete(vectorStore.id);
    console.log(`Vector store ${vectorStore.id} obrisan.`);

    // Obrisi fileove
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

async function analyzeAll(): Promise<void> {
    const totalStart = Date.now();
    const batchSize = 20;
    let offset = 0;
    let batch: StructuredCommentDict = {};
    let totalComments = 0;

    try {
        do {
            batch = await getStructuredComments(batchSize, offset);
            batch = await enrichSkupInfo(batch);

            totalComments = Object.values(batch).reduce((acc, skup) => acc + skup.comments.length, 0);
            console.log(`Dohvaćeno ${totalComments} komentara`);

            if (totalComments === 0) {
                break;
            }
            for (const skupId of Object.keys(batch)) {
                await analyzeSkup(batch[skupId]);
            }
            // break; // za testiranje samo prve grupe

            // offset += batchSize;
        } while (totalComments > 0);

        const totalEnd = Date.now();
        const totalLogText = `Ukupno vrijeme izvođenja: ${(totalEnd - totalStart) / 1000} sekundi`;
        console.log(totalLogText);

    } catch (error) {
        console.error("Greška tijekom analize izjava:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// analyzeAll();