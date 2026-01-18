import prisma from "../../config/prisma";
import { StructuredCommentDict, StructuredCommentRow } from './analysis.types';


export const fetchResponsesByCommentId = async (commentId: number) => {
  const responses = await prisma.odgovor.findMany({
    where: { komentar_id: commentId },
  });
  return responses;
};

export const fetchResponseById = async (responseId: number) => {
  const response = await prisma.odgovor.findUnique({
    where: { id: responseId },
  });
  return response;
};

// Funkcija koja dohvaća n komentara koji još nemaju odgovore
export async function getStructuredComments(limit: number, offset: number = 0): Promise<StructuredCommentDict> {

  const rawRows = await prisma.odgovor.findMany({
    where: {
      score: null,   // Oni koji su null još nisu obrađeni
    },
    select: {
      id: true,
      message: true,
      komentar: {
        select: {
          skup_podataka: {
            select: {
              id: true // Id skupa kad budemo dohvatili metapodatke skupova i informacije o fileovima
            }
          }
        }
      }
    },
    take: limit,
    skip: offset
  });

  // Flatten
  const structured: StructuredCommentRow[] = rawRows.map(row => ({
    odgovorId: row.id,
    message: row.message,
    skupId: row.komentar?.skup_podataka?.id ?? null
  }));

  const groups: StructuredCommentDict = {};

  for (const item of structured) {
    if (!item.skupId) continue;

    if (!groups[item.skupId]) {
      groups[item.skupId] = {
        skup_id: item.skupId,
        title: null,
        refresh_frequency: null,
        theme: null,
        description: null,
        url: null,
        license_title: null,
        tags: null,
        resources: [],
        comments: []
      };
    }

    groups[item.skupId].comments.push(item);
  }

  return groups;
}