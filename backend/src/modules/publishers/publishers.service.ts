import prisma from "../../config/prisma";

export const fetchPublishers = async () => {
  const publishers = await prisma.izdavac.findMany({
    select: { id: true, publisher: true }
  })
  return publishers;
};

export const fetchRecentlyActivePublishers = async (limit: number = 3) => {

  const latestPublisherUpdates = await prisma.skup_podataka.groupBy({
    by: ["publisher_id"],
    _max: {
      fetched_at: true,
    },
    where: {
      publisher_id: {
        not: null,
      },
    },
    orderBy: {
      _max: {
        fetched_at: "desc",
      },
    },
    take: limit,
  });

  const publisherIds = latestPublisherUpdates
    .map((p) => p.publisher_id)
    .filter((id): id is string => id !== null);

  if (publisherIds.length === 0) {
    return [];
  }

  const publishers = await prisma.izdavac.findMany({
    where: {
      id: {
        in: publisherIds,
      },
    },
  });

  return publishers;
};

export const searchForPublishers = async (searchText?: string) => {
  return prisma.izdavac.findMany({
    where: {
      publisher: {
        contains: searchText,
        mode: 'insensitive',
      },
    },
  });
};
