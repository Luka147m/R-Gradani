import { DataSet } from "./dataset";

export class Publisher {
  id!: string;
  publisher?: string | null;
  description?: string | null;
  skup_podataka?: DataSet[];
}