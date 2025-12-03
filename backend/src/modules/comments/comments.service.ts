import prisma from "../../config/prisma";

export const fetchCommentById = async (id: number) => {
  const comment = await prisma.komentar.findUnique({
    where: { id },
  });
  return comment;
};

export const fetchLatestAnalyzedComments = async () => {
  const comments = await prisma.komentar.findMany({
    where: {
      odgovor: {
        some: {
          score: {
            not: null
          }
        }
      }
    },
    orderBy: { created: "desc" },
    take: 10,
    include: {
      odgovor: true,
    }
  });
  return comments;
};