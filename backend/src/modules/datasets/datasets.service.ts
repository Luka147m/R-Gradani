import prisma from "../../config/prisma"

export const fetchDatasets = async () => {
    const datasets = await prisma.skup_podataka.findMany();
    return datasets;
}