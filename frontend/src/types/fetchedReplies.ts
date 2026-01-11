import { Reply } from './reply'

export class FetchedReplies {
    id?: number;
    komentar_id?: string;
    created?: Date;
    message?: {
      izjave?: Reply[]
    };
    score?: number;
}