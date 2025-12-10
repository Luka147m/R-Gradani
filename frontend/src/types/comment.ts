import { DataSet } from "./dataset";
import { Reply } from "./reply";
import { Picture } from "./picture";


export class Comment {
  id!: bigint;
  user_id?: bigint | null;
  skup_id?: string | null;
  created?: Date | null;
  subject?: string | null;
  message?: string | null;

  skup_podataka?: DataSet | null;
  odgovor?: Reply[];
  slika?: Picture[];
}