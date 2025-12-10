import dotenv from 'dotenv';
import OpenAI from "openai";
import fs from "fs";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Client } from 'pg';
import pkg from '@dqbd/tiktoken';
import tiktoken from '@dqbd/tiktoken';
import { ca, fi } from 'zod/v4/locales';
const { encode } = pkg;

dotenv.config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

const openai = new OpenAI();
const model = 'gpt-5-mini';

const analizaSchema = z.object({
    komentar: z.string(),
    usvojenost: z.boolean(), // je li komentar usvojen ili ne
    podudarnost: z.number(), // postotak podudarnosti 
});

const prompts = {
   analiziranje: `Analiziraj koliko je sljedeća izjava istinita za skup podataka koji sam ti predao. Komentar postotakneka bude najviše jedna rečenica. Podudarnost predstavlja  zapisa/redaka za koji je izjava istinita.`
};

function logToFile(text) {
  fs.appendFileSync('execution_analyze.txt', text + '\n');
}
function logToFileResult(text) {
  fs.appendFileSync('result_analyzing.json', JSON.stringify(text, null, 2));
}

async function createFile(filePath, format) {
    const supportedFormats = ["csv", "doc", "docx", "html", "json", "pdf", "pptx", "txt", "xlsx", "xml", "xlsm", "xslx", "xls", "kml", "geojson"];  

    // provjera valjanosti urla
    if (!filePath.startsWith("http://") && !filePath.startsWith("https://")) {
        console.log("Unsupported file path, must be a URL.");
        return null;
    }

    // provjera formata
    if (!format) {
        console.log("Format not specified.");
        return null;
    }

    const lowerFormat = format.replace(/^\./, "").toLowerCase();
    let fileNameFixed = `data.${lowerFormat}`;

    // ako format nije jedan od podrzanih - skip
    if (!supportedFormats.includes(lowerFormat)) {
        console.log(`Format '${lowerFormat}' nije podržan, preskačem.`);
        return null;
    }

    if (["xslx", "xls", "xlsm"].includes(lowerFormat)) {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, ".xlsx");      
    } else if (lowerFormat === "kml") {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, ".xml");         
    } else if (lowerFormat === "geojson") {
        fileNameFixed = fileNameFixed.replace(/\.[^.]+$/, ".json");
    }
    let res;
    try {
        res = await fetch(filePath);
        if (!res.ok) {
            console.log(`Cannot access file at URL: ${res.status} ${res.statusText}`);
            return null;
        }
    } catch (err) {
        console.log(`Error fetching file from URL: ${err.message}`);
        return null;
    }
    const buffer = await res.arrayBuffer();

    const file = new File([buffer], fileNameFixed);
    try {
        const result = await openai.files.create({
        file: file,
        purpose: "assistants",
        });
        return result.id;
    } catch (uploadErr) {
        console.log(`Error uploading file: ${uploadErr.message}`);
        return null;
    }
};

async function createVectorStore(datasetId) {
    const result = await client.query(`SELECT url, format FROM resurs WHERE skup_id = $1`, [datasetId]);
    const urls = result.rows; 

    let fileIds = [];
    for (const elem of urls) {
        const fileId =  await createFile(elem.url, elem.format);
        if (fileId) fileIds.push(fileId);    
    }
    if (fileIds.length == 0) return null;

    console.log(fileIds);
    const vectorStore = await openai.vectorStores.create({
           name: datasetId,
        }); 

    console.log(vectorStore.id);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    for (const fileId of fileIds) {
        try {
            const result = await openai.vectorStores.files.create(vectorStore.id, { file_id: fileId });
            console.log("Datoteka dodana u vector store:", result.id);
        } catch (error) {
            console.error("Greška pri dodavanju datoteke:", error);
        }
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

    return vectorStore;
}

async function analyzeStatements(vectorStoreId, statements) { 
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
                content:  [
                    {
                        type: "input_text",
                        text: "Izjava: " + statement.text},
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

        const output = JSON.parse(response.output_text);
        statement.analysis = output;
        const inputTokens = response.usage?.input_tokens ?? 'N/A';
        const outPutTokens = response.usage?.output_tokens ?? 'N/A';
        const tokens = response.usage?.total_tokens ?? 'N/A';
        totalInputTokens += inputTokens;
        totalOutputTokens += outPutTokens;        
    }
    const end = Date.now();
    const logText = `Analiza izjava završena. Ukupno ulaznih tokena: ${totalInputTokens}, ukupno izlaznih tokena: ${totalOutputTokens}, ukupno tokena: ${totalInputTokens + totalOutputTokens}. Vrijeme izvođenja: ${(end - start)/1000} sekundi.`;
    logToFile(logText);
    console.log(logText);
    return statements;

}

function calculateScore(statments) {
    const ukupno = statments.reduce( (acc, obj) => acc + (obj.analysis.podudarnost  || 0), 0);
    const prosjek = ukupno / statments.length;
    return prosjek;
};

async function main() {
    const totalStart = Date.now();

    await client.connect()
        .then(() => { console.log('Spojeno na PostgreSQL bazu!'); })
        .catch((err) => { console.error('Greška pri spajanju:', err); });

    try {         
            
        const result = await client.query(`SELECT DISTINCT k.skup_id, k.subject 
                FROM komentar k
                INNER JOIN odgovor o ON k.id = o.komentar_id
                WHERE o.message IS NOT NULL LIMIT 1 OFFSET 2`);
        const datasetsIDS = result.rows;
        console.log("Dohvaćeni skupovi podataka iz baze: ", datasetsIDS);
    
        for (const dataset of datasetsIDS) {
            console.log("Analiziram skup podataka ID:", dataset.skup_id);
            
            const vectorStore = await createVectorStore(dataset.skup_id);
            if (vectorStore === null) {
                console.log("Nema datoteka za taj skup podataka koje se mogu koristiti za analizu.");
                continue;
            }  
            const filesResponse = await openai.vectorStores.files.list(vectorStore.id);

            if (!filesResponse.data || filesResponse.data.length === 0) {
                console.log("Vector store je prazan, nema datoteka za analizu.");
                continue;
            }         
      
            const response1 = await client.query(
                `SELECT id FROM komentar 
                WHERE skup_id = $1`, [dataset.skup_id]);
            const commentsIds = response1.rows;

            for (const comment of commentsIds) {
                console.log(`Analiziraj izjave za komentar ${comment.id}`)
                const response2 = await client.query(
                    `SELECT id, message FROM odgovor 
                    WHERE komentar_id = $1`, [comment.id]);
                
                if (response2.rowCount === 0) continue;

                const id = response2.rows[0].id;
                console.log(id);
                const statements = response2.rows[0].message.izjave;
                console.log(statements);

                const updatedStatements = statements.map(stat => ({
                    ...stat,
                    analysis: {}
                }));
                console.log(updatedStatements);

                const analyzedStatements = await analyzeStatements(vectorStore.id, updatedStatements)

                const updated = analyzedStatements.map(s => ({
                    ...s,
                    flag: false
                }));

                const jsonObj = { izjave: updated };
                console.log(jsonObj);

                const score = calculateScore(updated);

                
                const resp = await client.query(
                    `UPDATE odgovor 
                    SET message = $1, score = $2
                    WHERE id = $3`, 
                    [JSON.stringify(jsonObj), score, id]);
            } 

            const files = await openai.vectorStores.files.list(vectorStore.id);
            for await (const file of files) {
                const file1 = await openai.files.delete(file.id);
                console.log(file1);
            }
            await openai.vectorStores.delete(vectorStore.id);

        }
        const totalEnd = Date.now();
        const totalLogText = `Ukupno vrijeme izvođenja: ${(totalEnd - totalStart)} ms`;
        logToFile(totalLogText);


    } catch (error) {
        console.error("Greška tijekom analize izjava:", error);
    } finally {
        await client.end();
    }
}

main();