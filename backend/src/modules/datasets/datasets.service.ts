import prisma from "../../config/prisma"

export const fetchDatasets = async () => {
    const datasets = await prisma.skup_podataka.findMany();
    return datasets;
}

export const fetchDatasetById = async (id: string) => {
    const dataset = await prisma.skup_podataka.findUnique({
        where: { id }
    });
    return dataset;
}

export const fetchLatestFetchedDatasets = async (limit: number) => {
    return prisma.skup_podataka.findMany({
        orderBy: {
            fetched_at: 'desc',
        },
        take: limit,
        select: {
            id: true,
        }
    });
};

export const fetchDatasetsByIds = async (ids: string[]) => {
    return prisma.skup_podataka.findMany({
        where: {
            id: {
                in: ids,
            },
        },
    });
};

export const fetchDatasetsByPublisher = async (publisherId: string) => {
    return prisma.skup_podataka.findMany({
        where: {
            publisher_id: publisherId
        }
    });
};

export const fetchDatasetsByPublishers = async (publisherIds: string[]) => {
    return prisma.skup_podataka.findMany({
        where: {
            publisher_id: {
                in: publisherIds
            }
        }
    });
};

export const fetchDatasetsByTagsOrPublishers = async (tags?: string[], publisherIds?: string[]) => {
    const conditions: string[] = [];
    const params: any[] = [];

    if (tags && tags.length > 0) {
        tags.forEach((tag, idx) => {
            conditions.push(`tags @> $${params.length + 1}::jsonb`);
            params.push(JSON.stringify([tag]));
        });
    }

    if (publisherIds && publisherIds.length > 0) {
        publisherIds.forEach((pubId) => {
            conditions.push(`publisher_id = $${params.length + 1}`);
            params.push(pubId);
        });
    }

    if (conditions.length === 0) return [];

    const whereClause = conditions.join(' OR ');

    const datasets = await prisma.$queryRawUnsafe(
        `SELECT * FROM "skup_podataka" WHERE ${whereClause}`,
        ...params
    );

    return datasets;
};