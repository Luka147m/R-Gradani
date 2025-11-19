import prisma from "../../config/prisma";
import { izdavac } from "@prisma/client";

export const fetchRecentPublishers = async (
  quant: number,
  byAttribute: string
) => {
  const publishers =
    await prisma.$queryRaw<izdavac>`SELECT izdavac.* FROM (
SELECT DISTINCT ON (publisher_id) *
  FROM skup_podataka JOIN izdavac
  	ON skup_podataka.publisher_id = izdavac.id
  ORDER BY publisher_id ASC, ${byAttribute} DESC
) helper JOIN izdavac ON helper.publisher_id = izdavac.id
ORDER BY helper.modified DESC
LIMIT ${quant}`;

  return publishers;
};
