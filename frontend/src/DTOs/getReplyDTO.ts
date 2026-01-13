export class getReplyDTO {
  id!: number;
  flag?: boolean;
  text?: string;
  analysis?: {
    komentar: string;
    usvojenost: boolean;
    podudarnost: number;
  };
  category?: string;
}