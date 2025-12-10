import { Comment } from "./comment";

export class Reply {
  id!: number;
  komentar_id?: bigint | null;
  created?: Date | null;
  message?: unknown | null;
  score?: number | null;

  komentar?: Comment | null;
}