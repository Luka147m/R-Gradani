import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import { fetchDatasetsData } from "./datasets.data";

export const fetchDatasets = async () => {
  const datasets = await prisma.skup_podataka.findMany();
  return datasets;
};

export const fetchDatasetById = async (id: string) => {
  const dataset = await prisma.skup_podataka.findUnique({
    where: { id },
  });
  return dataset;
};

export const fetchDatasetAndResourcesById = async (id: string) => {
  const dataset = await prisma.skup_podataka.findUnique({
    where: { id },
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

  const datasetWithResources = {
    ...dataset,
    resources: dataset?.resurs || []
  };

  return datasetWithResources;
};

export const fetchLatestFetchedDatasets = async (limit: number) => {
  return prisma.skup_podataka.findMany({
    orderBy: {
      fetched_at: "desc",
    },
    take: limit,
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

export const searchDatasets = async (params: {
  searchText?: string;
  publisherIds?: string[];
  isAnalysed?: boolean;
}) => {
  const { searchText, publisherIds, isAnalysed } = params;

  const andConditions: Prisma.skup_podatakaWhereInput[] = [];

  if (searchText) {
    andConditions.push({
      OR: [
        { title: { contains: searchText, mode: "insensitive" } },
        { description: { contains: searchText, mode: "insensitive" } },
      ],
    });
  }

  if (publisherIds && publisherIds.length > 0) {
    andConditions.push({
      publisher_id: { in: publisherIds },
    });
  }

  if (isAnalysed !== undefined) {
    andConditions.push({
      last_analysis: isAnalysed ? { not: null } : { equals: null },
    });
  }

  const datasets = await prisma.skup_podataka.findMany({
    where: {
      AND: andConditions,
    },
  });

  const now = new Date().getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  return datasets.map((dataset) => {
    const isFresh = dataset.last_analysis
      ? now - new Date(dataset.last_analysis).getTime() < ONE_DAY
      : false;

    return {
      ...dataset,
      isFresh,
    };
  });
};

export const fetchDatasetsByPublisher = async (publisherId: string) => {
  return prisma.skup_podataka.findMany({
    where: {
      publisher_id: publisherId,
    },
  });
};

export const fetchDatasetsByPublishers = async (publisherIds: string[]) => {
  return prisma.skup_podataka.findMany({
    where: {
      publisher_id: {
        in: publisherIds,
      },
    },
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

  const whereClause = conditions.join(" OR ");

  const datasets = await prisma.$queryRawUnsafe(`SELECT * FROM "skup_podataka" WHERE ${whereClause}`, ...params);

  return datasets;
};

export const fetchCommentsByDatasetId = async (datasetId: string) => {
  const comments = await prisma.komentar.findMany({
    where: { skup_id: datasetId },
  });
  return comments;
};

export const refreshDatasetData = async (datasetId: string): Promise<boolean> => {
  const { dataset, publisher, resources } = await fetchDatasetsData(datasetId);

  if (!dataset) {
    return false;
  }

  // console.log(JSON.stringify({ dataset, publisher, resources }, null, 2));

  await prisma.$transaction(async (tx) => {

    // Izdavac
    if (publisher) {
      await tx.izdavac.upsert({
        where: { id: publisher.id },
        update: {
          publisher: publisher.publisher,
          description: publisher.description
        },
        create: {
          id: publisher.id,
          publisher: publisher.publisher,
          description: publisher.description
        }
      });
    }

    // Skup podataka
    await tx.skup_podataka.upsert({
      where: { id: dataset.id },
      update: {
        title: dataset.title,
        refresh_frequency: dataset.refresh_frequency,
        theme: dataset.theme,
        description: dataset.description,
        url: dataset.url,
        state: dataset.state,
        modified: dataset.modified ? new Date(dataset.modified) : null,
        isopen: dataset.isopen,
        access_rights: dataset.access_rights,
        license_title: dataset.license_title,
        license_url: dataset.license_url,
        license_id: dataset.license_id,
        publisher_id: dataset.publisher_id,
        tags: dataset.tags,
        fetched_at: new Date()
      },
      create: {
        id: dataset.id,
        title: dataset.title,
        refresh_frequency: dataset.refresh_frequency,
        theme: dataset.theme,
        description: dataset.description,
        url: dataset.url,
        state: dataset.state,
        created: dataset.created ? new Date(dataset.created) : null,
        modified: dataset.modified ? new Date(dataset.modified) : null,
        isopen: dataset.isopen,
        access_rights: dataset.access_rights,
        license_title: dataset.license_title,
        license_url: dataset.license_url,
        license_id: dataset.license_id,
        publisher_id: dataset.publisher_id,
        tags: dataset.tags,
        fetched_at: new Date()
      }
    });

    // Resursi
    for (const r of resources) {
      await tx.resurs.upsert({
        where: { id: r.id },
        update: {
          skup_id: r.skup_id,
          available_through_api: r.available_through_api,
          name: r.name,
          description: r.description,
          created: r.created ? new Date(r.created) : null,
          last_modified: r.last_modified ? new Date(r.last_modified) : null,
          format: r.format,
          mimetype: r.mimetype,
          state: r.state,
          size: r.size,
          url: r.url
        },
        create: {
          id: r.id,
          skup_id: r.skup_id,
          available_through_api: r.available_through_api,
          name: r.name,
          description: r.description,
          created: r.created ? new Date(r.created) : null,
          last_modified: r.last_modified ? new Date(r.last_modified) : null,
          format: r.format,
          mimetype: r.mimetype,
          state: r.state,
          size: r.size,
          url: r.url
        }
      });
    }

    // Brisanje resursa koji vise ne postoje
    const resourceIds = resources.map(r => r.id);

    await tx.resurs.deleteMany({
      where: {
        skup_id: dataset.id,
        id: { notIn: resourceIds }
      }
    });
  });

  return true;
};