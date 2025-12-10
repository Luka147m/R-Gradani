import tiktoken from '@dqbd/tiktoken';
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from "fs";

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

function cleanComment(komentar) {
  return komentar
    // Zamijeni prazne <p></p> ili <p> </p> s jednim praznim redom
    .replace(/<p>\s*<\/p>/gi, '\n\n')
    // Zamijeni ostatak zatvarajućih </p> oznaka s jednim novim redom
    .replace(/<\/p>/gi, '\n')
    // Ukloni ostale HTML oznake (npr. <h3>, <strong>) ** mozda ipak dodati razmak ovdje
    .replace(/<[^>]+>/g, '')
    // Opcionalno očisti višestruke prazne retke na maksimalno dva
    .replace(/\n{2,}/g, '\n\n')
    // Trimming na početku i kraju
    .trim();
}

async function main () {
    await client.connect()
        .then(() => { console.log('Spojeno na PostgreSQL bazu!'); })
        .catch((err) => { console.error('Greška pri spajanju:', err); });

    const query = 'SELECT id, message FROM komentar';
    const res = await client.query(query);
    const rows = res.rows;

    const tableData = [];
    let totalTokens = 0;

    rows.forEach(row => { 
        const cleanedMessage = cleanComment(row.message || '');
        const enc = tiktoken.encoding_for_model('gpt-5-mini'); 
        const tokens = enc.encode(cleanedMessage);
        //console.log(`Komentar ID: ${row.id}, Skup ID: ${row.skup_id}, Broj tokena: ${tokens.length}`);
        
        const rowData = {
            id_komentara: row.id,
            broj_tokena: tokens.length
        };
        tableData.push(rowData);
        totalTokens += tokens.length;
        enc.free(); 
    });
    
    const prosjekTokena = Math.round(totalTokens / tableData.length);

    console.log('\n📊 === KOMENTARI I TOKENI ===');
    console.table(tableData.slice(0, 10)); // samo prvih 10 u konzoli

    console.log('\n📈 === UKUPNA STATISTIKA ===');
    const stats = [{
        'Ukupno komentara': tableData.length,
        'Ukupno tokena': totalTokens,
        'PROSJEČAN broj tokena': prosjekTokena
    }];
    console.table(stats);
    
    const csvHeader = 'ID Komentara,Broj Tokena\n';
    const csvContent = csvHeader + tableData.map(row => 
        `${row.id_komentara},${row.broj_tokena}`
    ).join('\n');

    const fullContent = csvContent + `Ukupno komentara,${tableData.length}\nUkupno tokena,${totalTokens}\nProsječan broj tokena,${prosjekTokena}\n\n`;
    
    fs.writeFileSync('tokens.csv', csvContent, 'utf8');


  // Racunanje tokena za promptove
  console.log("Broj tokena za prompt2:");
  const promtp2 = `Tekst koji ću ti dati je komentar na određeni skup podataka na portalu otvorenih podataka. Cilj komentara je ukazati na nedostatke u tom skupu podataka te dati prijedloge za poboljšanja. Strukturiraj komentar u nekoliko izjava koje će se kasnije koristiti za analizu koliko su ti prijedlozi usvojeni u skupu podataka. Svaka izjava predstavlja jedan problem koji se pojavljuje u skupu podataka. Neka izjave budu jasne I sažete. Smiješ preformulirati postojeću rečenicu kako bi bila sažetija, pri tome rečenica ne smije izgubiti bitne informacije. Nemoj dodavati svoje prijedloge i zaključke. Nemoj dodavati nepotreba I opširna objašnjenja. Svaka izjava treba sadržavati kategoriju kojoj pripada s obzirom na sadržaj. Kategorije: meta podaci (kvaliteta, popunjenost, točno), kvaliteta i dosljednost (nepotpuni podatci, neusklađenost formata i standarda, višestruki formati), format podataka (dostupni formati datoteka, kodiranje), povezanost(s drugih skupovima), ažuriranost, ostalo).`;
  const enc = tiktoken.encoding_for_model('gpt-5-mini'); 
  const tokens = enc.encode(promtp2);
  console.log("Prompt2 tokens:", tokens.length);

  
  // Broj tokena prije i nakon čišćenja
  console.log("Broj tokena prije i nakon čišćenja:");
  const comment = `<p><span><a>https://data.gov.hr/ckan/dataset/nacionalne-manjine</a></span></p><ul><li>XLS<span></span></li><ul><li>Ima posebnu stranicu na kojoj je meta data, no ta tablica ima nekoliko praznih redaka i umjesto da se na prikazu podataka na stranici pokazuju podaci pokazuje se ta tablica metapodataka, isto tako umjesto da su ti podaci upisani u tablicu informacija o podacima ti su podaci samo u XLS datoteci</li></ul></ul><p></p><ul><li>CSV</li><ul><li>Ova se datoteka krivo prikazuje na portalu zbog toga što se za odvajanje u datoteci koristi ;(točka zarez), no stranice gleda samo , kao<i>separator</i>u csv datoteci, isto se tako ne prikazuju slova hrvatske abecede<span></span></li><li>Datoteka otvorena lokalno pokazuje točno neka slova hrvatske abecede, no neka ne npr. č i ć</li><li>Tablica ima slučajni prelazak u novi redak unutar jedne email adrese tako da se ne može cjelovita pročitati<span></span></li><li>Tablica sadrži jedan prazan stupac između adresa i stupca s napomenama koji nema naziva, a zadnja dva retka su prazna<span></span></li></ul></ul><p><span>ž</span></p><p></p><p></p>`;
  const commenetCleaned = cleanComment(comment);
  console.log("Očišćeni komentar:", commenetCleaned);
  const tokensBefore = (enc.encode(comment)).length;
  const tokensAfter = (enc.encode(commenetCleaned)).length;
  console.log("Broj tokena prije čišćenja:", tokensBefore);
  console.log("Broj tokena nakon čišćenja:", tokensAfter);
  
  await client.end();
  enc.free();

};

main().catch(console.error);