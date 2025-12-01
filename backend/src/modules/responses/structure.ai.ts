// Za strukturiranje komentara koristimo gpt-5-mini
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import prisma from "../../config/prisma";

if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const openai = new OpenAI();

const prompts = {
    strukturiranje: `Tekst koji ću ti dati je komentar na određeni skup podataka na portalu otvorenih podataka. Cilj komentara je ukazati na nedostatke u tom skupu podataka te dati prijedloge za poboljšanja. Strukturiraj komentar u nekoliko izjava koje će se kasnije koristiti za analizu koliko su ti prijedlozi usvojeni u skupu podataka. Svaka izjava predstavlja jedan problem koji se pojavljuje u skupu podataka. Neka izjave budu jasne i sažete. Smiješ preformulirati postojeću rečenicu kako bi bila sažetija, pri tome rečenica ne smije izgubiti bitne informacije. Nemoj dodavati svoje prijedloge i zaključke. Nemoj dodavati nepotreba i opširna objašnjenja. Svaka izjava treba sadržavati kategoriju kojoj pripada s obzirom na sadržaj. Moguće kategorije: METAPODACI (npr. kvaliteta, popunjenost, točnost), KVALITETA I DOSLJEDNOST (npr. nepotpuni podatci, neusklađenost formata i standarda, višestruki formati), STRUKTURA PODATAKA (npr. nedostajući stupci ili nazivi stupaca, pogrešni tipovi podataka), FORMAT PODATAKA (npr. dostupni formati datoteka, kodiranje), POVEZANOST (s drugih skupovima), AŽURIRANOST, OSTALO).`,
}

const model = "gpt-5-mini";

// Tipovi
const izjavaSchema = z.object({
    id: z.number(),         // id izjave unutar komentara
    text: z.string(),       // tekst izjave
    category: z.string(),   // kategorija izjave
});

const izjaveSchema = z.object({
    statements: z.array(izjavaSchema),
});

type CommentRow = {
    id: number;
    skup_id: string | null;
    message: string | null;
    skup_podataka: { title: string | null } | null;
};

type Statement = {
    id: number;
    text: string;
    category: string;
};

type CommentItem = {
    comment_id: number;
    message: string;
    statements: Statement[];
};

type SkupGroup = {
    skup_id: string;
    subject: string;
    comments: CommentItem[];
};

type CommentsDictionary = Record<string, SkupGroup>;

// Čistimo komentar korisnika od HTML tagova i nepotrebnih praznina
function cleanComment(comment?: string | null): string {
    if (!comment) return "";

    return comment
        .replace(/<p>\s*<\/p>/gi, "\n\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{2,}/g, "\n\n")
        .trim();
}


async function getComments() {
    const comments = await prisma.komentar.findMany({
        where: {
            odgovor: {
                none: {}   // nema nijednog odgovora (Ovo se može kasnije promijeniti)
            }
        },
        select: {
            id: true,
            skup_id: true,
            message: true,
            skup_podataka: {
                select: {
                    title: true,  // samo title skupa podataka
                }
            }
        }
    });

    // Dictionary po skupu podatka, sadrži komentare za svaki skup
    const groupedComments: CommentsDictionary = {};

    comments.forEach(row => {
        const skupId = row.skup_id;
        if (!skupId) return; // preskoči komentare bez skup_id

        if (!groupedComments[skupId]) {
            groupedComments[skupId] = {
                skup_id: skupId,
                subject: row.skup_podataka?.title || "",
                comments: [],
            };
        }

        groupedComments[skupId].comments.push({
            comment_id: Number(row.id),
            message: cleanComment(row.message),
            statements: [], // kasnije se popunjava s LLMom
        });
    });


    return groupedComments
}

// Primjer izlaza za prvi ključ iz groupedComments
`deb66b30-e8d8-4ecf-9b17-0ff0ca40e9a1 {
  skup_id: 'deb66b30-e8d8-4ecf-9b17-0ff0ca40e9a1',
  subject: 'Evidencija sportskih igrališta',
  comments: [
    {
      comment_id: 2598,
      message: 'Naziv skupa: "Evidencija sportskih igrališta"\n' +
        'URL skupa:https://data.gov.hr/ckan/dataset/evidencija-sportskih-igralista\n' +
        'Tema skupa je obrazovanje, kultura i sport, frekvencija osvježavanja je godišnja, no podaci su zadnje ažurirani 27. veljače 2023., te je otvorenost skupa prema Tim Berners-Lee skali razine 2.\n' +
        'Podaci su o sportskim igralištima u gradu Ivanec te su dostupni samo u formatu XLS.\n' +
        'Problem je što postoji mnogo redaka koji imaju podatke, no nemaju nikakav redni broj pripadnosti. Npr. Na priloženoj slici za određene katastre nema nikakvih podataka o lokaciji, podlozi, površini. Nije jasno jesu li to podaci vezani uz prijašnje navedenu lokaciju ili su pogrešno upisani.\n' +
        '\n' +
        'Također, kao unaprjeđenje, umjesto 3 stupca ("vlasništvo - Grad Ivanec","vlasništvo - javno dobro","vlasništvo - privatno i sl."), predlažem 2 stupca. Stupac "vlasništvo" u kojem bi bio naveden vlasnik, bio to grad Ivanec, privatni vlasnik ili netko treći, te stupac "vrsta vlasništva" u kojem bi bila navedena vrsta vlasništva, npr. privatno, javno... Time bi podaci bili pregledniji i u priloženoj slici bi se izbjegla praznina jer trenutačno nema podataka u stupcu "vlasništvo - javno dobro".',
      statements: []
    }
  ]
}`

async function structureComment(comment: string): Promise<Statement[]> {
    try {
        const response = await openai.responses.create({
            model,
            instructions: prompts.strukturiranje,
            input: [{ role: "user", content: comment }],
            text: { format: zodTextFormat(izjaveSchema, "event") },
        });

        const parsed = izjaveSchema.parse(response.output_text);
        return parsed.statements;
    } catch (err: any) {
        if (err.status === 401) {
            console.error("Invalid API key");
        } else if (err.status === 402) {
            console.error("Insufficient funds / billing issue");
        } else if (err.status === 429) {
            console.error("Rate limit exceeded, try again later");
        } else {
            console.error("Unknown error:", err.message);
        }
        return [];
    }
}

async function structureAllComments() {
    console.log("Počinjem strukturiranje komentara...");

    const groupedComments = await getComments();
    const skupIds = Object.keys(groupedComments);

    console.log(`Pronađeno ${skupIds.length} skupova podataka s komentarima`);

    let totalComments = 0;
    let processedComments = 0;
    let failedComments = 0;

    skupIds.forEach(skupId => {
        totalComments += groupedComments[skupId].comments.length;
    });

    console.log(`Ukupno ${totalComments} komentara za procesiranje\n`);

    // Procesiramo svaki skup podataka
    for (const skupId of skupIds) {
        const group = groupedComments[skupId];
        // console.log(`\n Skup: ${group.subject} (${group.skup_id})`);
        // console.log(`   Komentara: ${group.comments.length}`);

        // Procesiramo svaki komentar u skupu
        for (const comment of group.comments) {
            try {
                // console.log(`Procesiram komentar ${comment.comment_id}`);

                // Strukturiramo komentar pomoću LLM-a
                const statements = await structureComment(comment.message);

                if (statements.length === 0) {
                    console.log(`Komentar ${comment.comment_id}: Nema strukturiranih izjava`);
                    failedComments++;
                    continue;
                }

                // Pripremamo objekt za spremanje
                const responseData = {
                    izjave: statements,
                };

                // Spremamo u bazu
                await prisma.odgovor.create({
                    data: {
                        komentar_id: BigInt(comment.comment_id),
                        created: new Date(),
                        message: responseData,
                        score: null
                    }
                });

                processedComments++;
                // console.log(`Komentar ${comment.comment_id}: ${statements.length} izjava spremljeno`);

                // Pauza između poziva da izbjegnemo rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error: any) {
                failedComments++;
                console.error(`Greška kod komentara ${comment.comment_id}:`, error.message);
                continue;
            }
        }
    }

    // Finalni izvještaj
    console.log("\n" + "=".repeat(60));
    console.log("FINALNI IZVJEŠTAJ");
    console.log("=".repeat(60));
    console.log(`Uspješno procesirano: ${processedComments}/${totalComments}`);
    console.log(`Neuspješno: ${failedComments}/${totalComments}`);
    console.log(`Stopa uspjeha: ${((processedComments / totalComments) * 100).toFixed(1)}%`);
    console.log("=".repeat(60));
}

async function test() {
    const message = 'Naziv skupa: "Evidencija sportskih igrališta"\n' +
        'URL skupa:https://data.gov.hr/ckan/dataset/evidencija-sportskih-igralista\n' +
        'Tema skupa je obrazovanje, kultura i sport, frekvencija osvježavanja je godišnja, no podaci su zadnje ažurirani 27. veljače 2023., te je otvorenost skupa prema Tim Berners-Lee skali razine 2.\n' +
        'Podaci su o sportskim igralištima u gradu Ivanec te su dostupni samo u formatu XLS.\n' +
        'Problem je što postoji mnogo redaka koji imaju podatke, no nemaju nikakav redni broj pripadnosti. Npr. Na priloženoj slici za određene katastre nema nikakvih podataka o lokaciji, podlozi, površini. Nije jasno jesu li to podaci vezani uz prijašnje navedenu lokaciju ili su pogrešno upisani.\n' +
        '\n' +
        'Također, kao unaprjeđenje, umjesto 3 stupca ("vlasništvo - Grad Ivanec","vlasništvo - javno dobro","vlasništvo - privatno i sl."), predlažem 2 stupca. Stupac "vlasništvo" u kojem bi bio naveden vlasnik, bio to grad Ivanec, privatni vlasnik ili netko treći, te stupac "vrsta vlasništva" u kojem bi bila navedena vrsta vlasništva, npr. privatno, javno... Time bi podaci bili pregledniji i u priloženoj slici bi se izbjegla praznina jer trenutačno nema podataka u stupcu "vlasništvo - javno dobro".'

    const statements = await structureComment(message);


    if (statements.length === 0) {
        console.log(`Komentar: Nema strukturiranih izjava`);
    }

    // Pripremamo objekt za spremanje
    const responseData = {
        izjave: statements,
    };

    console.log(responseData);

}

test()
