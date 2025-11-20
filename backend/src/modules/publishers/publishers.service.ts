import prisma from "../../config/prisma";

export const fetchPublishers = async () => {
  const publishers = await prisma.izdavac.findMany({
    select: { id: true, publisher: true }
  })
  return publishers;
};
