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