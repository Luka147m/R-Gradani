import prisma from "../../config/prisma";

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

export const fetchRecentDatasets = async (quant: number) => {
  const datasets = await prisma.skup_podataka.findMany({
    orderBy: {
      modified: "desc",
    },
    take: quant,
  });

  return datasets;
};
