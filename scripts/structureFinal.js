import { Client } from 'pg';
import dotenv from 'dotenv';
import OpenAI from "openai";
import { id } from 'zod/v4/locales';
import { z } from "zod";
import fs from "fs";
import { zodTextFormat } from "openai/helpers/zod";

dotenv.config();

const openai = new OpenAI();

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

const prompts = {
  strukturiranje: `Tekst koji ću ti dati je komentar na određeni skup podataka na portalu otvorenih podataka. Cilj komentara je ukazati na nedostatke u tom skupu podataka te dati prijedloge za poboljšanja. Strukturiraj komentar u nekoliko izjava koje će se kasnije koristiti za analizu koliko su ti prijedlozi usvojeni u skupu podataka. Svaka izjava predstavlja jedan problem koji se pojavljuje u skupu podataka. Neka izjave budu jasne I sažete. Smiješ preformulirati postojeću rečenicu kako bi bila sažetija, pri tome rečenica ne smije izgubiti bitne informacije. Nemoj dodavati svoje prijedloge i zaključke. Nemoj dodavati nepotreba I opširna objašnjenja. Svaka izjava treba sadržavati kategoriju kojoj pripada s obzirom na sadržaj. Moguće kategorije: METAPODACI (npr. kvaliteta, popunjenost, točnost), KVALITETA I DOSLJEDNOST (npr. nepotpuni podatci, neusklađenost formata i standarda, višestruki formati), STRUKTURA PODATAKA (npr. nedostajući stupci ili nazivi stupaca, pogrešni tipovi podataka), FORMAT PODATAKA (npr. dostupni formati datoteka, kodiranje), POVEZANOST (s drugih skupovima), AŽURIRANOST, OSTALO).`,
}

const izjavaSchema = z.object({
    id: z.number(),    // id izjave unutar komentara
    text: z.string(),    // tekst izjave
    category: z.string(),   // kategorija izjave
});

const izjaveSchema = z.object({
    statements: z.array(izjavaSchema),
});

function cleanComment(komentar) {
  return komentar
    .replace(/<p>\s*<\/p>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}

async function readComment(count, start=0) {

  const res = await client.query(
    `SELECT * FROM komentar 
    ORDER BY skup_id
    LIMIT $1 OFFSET $2`, 
    [count, start]);
    
  const rows = res.rows;

  const jsonObject = {};

  rows.forEach(row => { 
    const skupId = row.skup_id; 
    const commentId = row.id; 

    if (!jsonObject[skupId]) {
      jsonObject[skupId] = {
        skup_id: skupId,
        subject: row.subject || '',
        comments: []
      };
    }
    jsonObject[skupId].comments.push({
      comment_id: commentId,
      message: cleanComment(row.message || ''),
      statements: [
      //   {
      //   id: 1,
      //   text: '',
      //   category: '',
      //   analysis: {
      //     comment: '',
      //     match: 0,
      //     subject: ''
      //   },
      // }
    ]
    });

  });
   return Object.values(jsonObject);
}

let totalInputTokens = 0;
let totalOutputTokens = 0;

async function structureComment(comment, model) {
  const start = Date.now();
  console.log(`Strukturiranje komentara za model: ${model}`);
  const txt = `Strukturiranje komentara za model: ${model}`;
  logToFile(txt);
  logToFileResult(txt);

  const response = await openai.responses.create({
    model: model,
    instructions: prompts.strukturiranje,
    input: [
      { role: "user", content: comment }      
    ],
    text: {format: zodTextFormat(izjaveSchema, "event"),},
  });

  console.log(response);
  const end = Date.now(); 
  const inputTokens = response.usage?.input_tokens ?? 'N/A';
  const outPutTokens = response.usage?.output_tokens ?? 'N/A';
  const tokens = response.usage?.total_tokens ?? 'N/A';

  totalInputTokens += inputTokens;
  totalOutputTokens += outPutTokens;

  const logText = `Vrijeme izvodenja za strukturiranje: vrijeme ${(end - start)} ms.
  Potrošeni tokeni za strukutiranje:  ulazni: ${inputTokens}, izlazni: ${outPutTokens}, ukupno: ${tokens}.`;
  logToFile(logText);
  const parsed = izjaveSchema.parse(JSON.parse(response.output_text));
  return parsed;
}

function logToFile(text) { 
  fs.appendFileSync('output_f10.txt', text + '\n');
}

function logToFileResult(text) { 
  fs.appendFileSync('outputResult_f10.json', JSON.stringify(text, null, 2) + '\n');
}

async function main() {
  const totalStart = Date.now();

  await client.connect()
        .then(() => { console.log('Spojeno na PostgreSQL bazu!'); })
        .catch((err) => { console.error('Greška pri spajanju:', err); });

  
  
  const count = 10;
  const start = 1;
  const comments = await readComment(count, start);
  
  for (const skup of comments) {
    for (const comment of skup.comments) {
      logToFile(`Obrada komentara ID: ${comment.comment_id} za skup podataka ID: ${skup.skup_id}`);
      const result = await structureComment(comment.message, 'gpt-5-mini');
      console.log(result);

      if (result && result.statements) {
         comment.statements = result.statements;
         
      } else {
        comment.statements = comment.statements || [];
      }

      const obj = {
        izjave: comment.statements
      };
      const created = new Date();
      created.setMilliseconds(0);
  
      const res = await client.query(
      `INSERT INTO odgovor (komentar_id, created, message, score) VALUES($1, $2, $3, $4)`, 
      [comment.comment_id, created, JSON.stringify(obj), null]);
      console.log(res);

    }
    console.log(comments);
  }   
    
  await client.end();

  const totalEnd = Date.now();
  const totalLogText = `Ukupno vrijeme izvođenja: ${(totalEnd - totalStart)} ms`;
  logToFile(totalLogText);

  const commentsLog = `Ukupno tokena za strukturiranje: ulazni: ${totalInputTokens}, izlazni: ${totalOutputTokens}, ukupno: ${totalInputTokens + totalOutputTokens}.`;  
  logToFile(commentsLog);
  logToFileResult(comments);
  logToFile("--------------------------KRAJ-------------------------");
}

main();