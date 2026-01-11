import { DataSet } from "./dataset";

export class Resource {
  id!: string;
  skup_id?: string | null;
  available_through_api?: boolean | null;
  name?: string | null;
  description?: string | null;
  created?: Date | null;
  last_modified?: Date | null;
  format?: string | null;
  mimetype?: string | null;
  state?: string | null;
  size?: number | null;
  url?: string | null;

  skup_podataka?: DataSet | null;
}