import prisma from "../../config/prisma"
import { fetchLatestFetchedDatasets } from "../datasets/datasets.service";
import { fetchPublishers } from "../publishers/publishers.service";

export const fetchData = async () => {
    const [tags, publishers, latestDatasets] = await Promise.all([
        getDistinctTags(),
        fetchPublishers(),
        fetchLatestFetchedDatasets(10)
    ]);

    return {
        tags,
        publishers,
        latestDatasets,
        // po potrebi dodaj: stats...
    };
};

export const getDistinctTags = async () => {
    const rows = await prisma.$queryRaw<{ tag: string }[]>`
        SELECT DISTINCT jsonb_array_elements_text(tags) AS tag
        FROM "skup_podataka"
        WHERE tags IS NOT NULL
        ORDER BY tag
    `;

    return rows.map(r => r.tag);
};
