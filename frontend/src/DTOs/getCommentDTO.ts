export class getCommentDTO {
  id!: string;
  user_id?: bigint | null;
  skup_id?: string | null;
  created?: Date | null;
  subject?: string | null;
  message?: string | null;
}