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

export const createComment = async (data: { subject: string; text: string; skupId: string; }) => {
  const newComment = await prisma.komentar.create({
    data: {
      user_id: BigInt(1), // 1 Admin
      skup_id: data.skupId,
      created: new Date(),
      subject: data.subject,
      message: data.text,
      import_source: "user",
    },
  });
  return newComment;
};