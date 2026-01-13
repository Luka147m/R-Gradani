import type { getReplyDTO } from './getReplyDTO.ts';

export class getCommentRepliesDTO {
    id?: number;
    komentar_id?: string;
    created?: Date;
    message?: {
      izjave?: getReplyDTO[]
    };
    score?: number;
}