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
    Komentar neka bude najviše jedna rečenica. Podudarnost predstavlja postotak zapisa/redaka za koji je izjava istinita.`
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

async function createFile(filePath: string, format: string | null, fileSize: number | null): Promise<string | null> {
    const supportedFormats = ["csv", "doc", "docx", "html", "json", "pdf", "pptx", "txt", "xlsx", "xml", "xlsm", "xslx", "xls", "kml", "geojson"];

    if (fileSize !== null) {
        if (fileSize > MAX_FILE_SIZE) {
            console.log(`File too large (${(fileSize / 1024 / 1024).toFixed(2)} MB), skipping. Max: ${MAX_FILE_SIZE / 1024 / 1024} MB`);
            return null;
        }
    }

    if (!filePath.startsWith("http://") && !filePath.startsWith("https://")) {
        console.log("Unsupported file path, must be a URL.");
        return null;
    }

    if (!format) {
        console.log("Format not specified.");
        return null;
    }

    const pathname = new URL(filePath).pathname;
    const filenameWithExt = pathname.split("/").pop();

    const filename = filenameWithExt?.replace(/\.[^/.]+$/, "");

    const lowerFormat = format.replace(/^\./, "").toLowerCase();
    let fileNameFixed = `${filename}.${lowerFormat}`;

    if (!supportedFormats.includes(lowerFormat)) {
        console.log(`Format '${lowerFormat}' nije podržan, preskačem.`);
        return null;
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
            return null;
        }
    } catch (err) {
        console.log(`Error fetching file from URL: ${(err as Error).message}`);
        return null;
    }

    const buffer = await res.arrayBuffer();

    const actualSize = buffer.byteLength;
    if (actualSize > MAX_FILE_SIZE) {
        console.log(`Downloaded file too large (${(actualSize / 1024 / 1024).toFixed(2)} MB), skipping.`);
        return null;
    }

    const file = new File([buffer], fileNameFixed);

    try {
        const result = await openai.files.create({
            file: file,
            purpose: "assistants",
        });
        return result.id;
    } catch (uploadErr) {
        console.log(`Error uploading file: ${(uploadErr as Error).message}`);
        return null;
    }
}

// Create vector store for a dataset
async function createVectorStore(skup: SkupGroup): Promise<OpenAI.VectorStore | null> {

    const resources = skup.resources?.filter(res => res.url && res.format) || [];
    const datasetId = skup.skup_id;
    const fileIds: string[] = [];

    for (const resource of resources) {
        if (!resource.url || !resource.format) {
            console.log("Resource missing URL or format, preskačem.");
            continue;
        }
        const fileId = await createFile(resource.url, resource.format, resource.size);
        if (fileId) fileIds.push(fileId);
    }

    if (fileIds.length === 0) return null;

    const vectorStore = await openai.vectorStores.create({
        name: datasetId,
    });
    console.log("Vector store ID:", vectorStore.id);

    await new Promise(resolve => setTimeout(resolve, 3000));

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

    await new Promise(resolve => setTimeout(resolve, 3000));
    return vectorStore;
}

// Analyze statements using OpenAI
async function analyzeStatements(
    vectorStoreId: string,
    statements: Statement[]
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
                            text: "Izjava: " + statement.text
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
    console.log(logText);

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

    const vectorStore = await createVectorStore(skup);
    if (vectorStore === null) {
        console.log("Nema datoteka za taj skup podataka koje se mogu koristiti za analizu.");
        for (const comment of skup.comments) {
            await writeErrorToDb(comment, "Nema dostupnih datoteka za analizu izjava.");
        }
        return;
    }

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

        const analyzedStatements = await analyzeStatements(vectorStore.id, updatedStatements);

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

        console.log(`Odgovor ${comment.odgovorId} ažuriran sa score: ${score}`);
    }

    // Clean up za vector store
    await openai.vectorStores.delete(vectorStore.id);
    console.log(`Vector store ${vectorStore.id} obrisan.`);
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
            console.log(`Dohvaćeno ${totalComments} komentara (offset: ${offset})`);

            if (totalComments === 0) {
                break;
            }
            for (const skupId of Object.keys(batch)) {
                await analyzeSkup(batch[skupId]);
            }

            offset += batchSize;
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

analyzeAll();