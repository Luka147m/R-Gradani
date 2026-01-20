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

/**
 * Funkcija koja dohvaća strukturirane komentare grupirane po skupovima podataka.
 * Korištena unutar analyzeALLData funkcije.
 * 
 * @param limit - maksimalan broj strukturiranih komentara za dohvat
 * @param offset - offset za dohvat strukturiranih komentara (koristi 0)
 * @returns Rječnik strukturiranih komentara grupiranih po skupovima podataka
 */
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

export type CommentRow = {
  id: number;
  skup_id: string | null;
  message: string | null;
  skup_podataka: { title: string | null } | null;
};

/**
 * 
 * Funkcija koja vraća niz komentara koji nemaju odgovore
 *
 * @param limit - maksimalan broj komentara za dohvat
 * @param offset - offset za dohvat komentara (koristi 0)
 * @returns niz komentara bez odgovora
 */
export async function getCommentsWithoutResponses(limit: number, offset: number = 0): Promise<CommentRow[]> {

  const comments = await prisma.komentar.findMany({
    where: {
      odgovor: {
        none: {}   // nema nijednog odgovora (Ovo se može kasnije promijeniti)
      }
    },
    select: {
      id: true,
      skup_id: true,
      message: true,
      skup_podataka: {
        select: {
          title: true,  // samo title skupa podataka
        }
      }

    },
    take: limit,
    skip: offset
  });

  // Bigint mapping
  return comments.map(c => ({
    ...c,
    id: Number(c.id)
  }));

}