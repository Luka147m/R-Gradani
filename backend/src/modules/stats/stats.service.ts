import { count } from "console";
import prisma from "../../config/prisma"

export const fetchData = async () => {

    //-------------------------------------Komentari-------------------------------------
    // Broj komentara u bazi
    const commentCount = await prisma.komentar.count();

    // Broj obradenih komentara (onih koji imaju bar jedan odgovor)
    const brojObradenihKomentara = await prisma.komentar.count({
        where: {
            odgovor: {
                some: {},
            },
        },
    });

    //-------------------------------------Izdavaci-------------------------------------
    // const authorCount = await prisma.izdavac.count();

    const izdavacHisto = await prisma.izdavac.findMany({
        select: {
            publisher: true,
            _count: {
                select: {
                    skup_podataka: true,
                },
            },
        },
        orderBy: {
            skup_podataka: {
                _count: 'desc',
            },
        },
        take: 20,
    });

    // Length ovog polja je jednak broju izdavaca u bazi, svaki element ima ime i broj skupova podataka
    const formattedIzdavacHisto = izdavacHisto.map(r => ({
        publisher: r.publisher,
        count: r._count.skup_podataka,
    }));

    // console.log(formattedIzdavacHisto)

    //-------------------------------------Skupovi podataka-------------------------------------

    // Broj skupova podataka u bazi
    const skupoviCount = await prisma.skup_podataka.count();

    // Lista najpopularnijih tagova
    const topTags = await prisma.$queryRaw<
        { tag: string; count: number }[]
    >`
        SELECT tag, COUNT(*)::int AS count
          FROM skup_podataka,
            jsonb_array_elements_text(tags) AS tag
          GROUP BY tag
          ORDER BY count DESC
          LIMIT 20
    `;

    // Lista najpopularnijih tema
    const topTheme = await prisma.skup_podataka.groupBy({
        by: ['theme'],
        _count: {
            theme: true,
        },
        where: {
            theme: {
                not: null,
            },
        },
        orderBy: {
            _count: {
                theme: 'desc',
            },
        },
        take: 20,
    });

    const flattenedTopTheme = topTheme.map(t => ({
        theme: t.theme!,
        count: t._count.theme,
    }));

    const topSkupPodataka = await prisma.skup_podataka.findMany({
        select: {
            id: true,
            title: true,
            _count: {
                select: {
                    komentar: true,
                },
            },
        },
        orderBy: {
            komentar: {
                _count: 'desc',
            },
        },
        take: 20,
    });

    // Lista najpopularnijih skupova podataka
    const flattenedTopSkup = topSkupPodataka.map(d => ({
        id: d.id,
        title: d.title,
        komentarCount: d._count.komentar,
    }));

    // --------------------------------------Odgovori-------------------------------------
    const odgovorCount = await prisma.odgovor.count();

    // Neuspjesno obradeni komentari (oni koji imaju odgovor sa score -1)
    const failedCount = await prisma.odgovor.count({
        where: {
            score: -1,
        },
    });

    // Histogram scoreva svih odgovora (za obradjene komentare, zaokruzen na int)
    const rawHistogram = await prisma.$queryRaw<
        { rounded_score: number; count: number }[]
    >`
        SELECT ROUND(score::numeric, 0) AS rounded_score, COUNT(*) AS count
          FROM odgovor
          WHERE score != -1
          GROUP BY rounded_score
          ORDER BY rounded_score;
    `;

    const scoreHistogram = rawHistogram.map(r => ({
        score: Number(r.rounded_score),
        count: Number(r.count),
    }));

    // Prosjecan i medijan score
    const stats = await prisma.$queryRaw<
        { avg_score: string; median_score: string }[]
    >`
        SELECT
          ROUND(AVG(score)::numeric, 2) AS avg_score,
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score)::numeric, 2) AS median_score
        FROM odgovor
        WHERE score != -1;
    `;

    const result = {
        avg: Number(stats[0].avg_score),
        median: Number(stats[0].median_score),
    };


    // Broj izjava i koliko ih je usvojeno
    const izjaveCounts = await prisma.$queryRaw<{
        total: number;
        usvojeni: number;
    }[]>`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE (izj->'analysis'->>'usvojenost')::boolean = true) AS usvojeni
        FROM (
          SELECT message
          FROM odgovor
          WHERE NOT (message ? 'error')
            AND message ? 'izjave'
        ) AS valid_odgovor,
        LATERAL jsonb_array_elements(valid_odgovor.message->'izjave') AS izj;
    `;

    const firstRow = izjaveCounts[0] ?? { total: 0n, usvojeni: 0n };

    const izjave = {
        total: Number(firstRow.total),
        usvojeni: Number(firstRow.usvojeni),
    };

    // console.log(izjave);

    // Lista tipova izjava
    const categoryReport = await prisma.$queryRaw<{
        category: string;
        count: bigint;
        usvojeni: bigint;
    }[]>`
        SELECT 
            izj->>'category' AS category,
            COUNT(*) AS count,
            COUNT(*) FILTER (WHERE (izj->'analysis'->>'usvojenost')::boolean = true) AS usvojeni
        FROM odgovor,
        LATERAL jsonb_array_elements(message->'izjave') AS izj
        WHERE NOT (message ? 'error')
          AND message ? 'izjave'
        GROUP BY category
        ORDER BY count DESC;
    `;


    const report = categoryReport.map(r => ({
        category: r.category,
        count: Number(r.count),
        usvojeni: Number(r.usvojeni),
    }));

    return {
        komentar: {
            total: commentCount,
            obradenih: brojObradenihKomentara
        },
        izdavaci: formattedIzdavacHisto,
        skupovi_podataka: {
            total: skupoviCount,
            topTags,
            topTheme: flattenedTopTheme,
            topSkupPodataka: flattenedTopSkup,
        },
        odgovori: {
            count: odgovorCount,
            failed: failedCount,
            scoreHistogram,
            scoreStats: result,
            izjave,
            categoryReport: report,
        }
    }
};
