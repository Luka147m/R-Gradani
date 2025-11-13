import prisma from "../../config/prisma";

export const fetchCommentsByDatasetId = async (datasetId: string) => {
  const comments = await prisma.komentar.findMany({
    where: { skup_id: datasetId },
  });
  return comments;
};
