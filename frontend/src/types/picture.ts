import { Comment } from "./comment";

export class Picture {
  komentar_id!: bigint;
  content_hash!: string;
  original_name?: string | null;
  mime_type?: string | null;
  created?: Date | null;

  komentar!: Comment;
}