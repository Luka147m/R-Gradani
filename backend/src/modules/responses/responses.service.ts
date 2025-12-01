import prisma from "../../config/prisma";

export const fetchResponsesByCommentId = async (commentId: number) => {
  const responses = await prisma.odgovor.findMany({
    where: { komentar_id: commentId },
  });
  return responses;
};
