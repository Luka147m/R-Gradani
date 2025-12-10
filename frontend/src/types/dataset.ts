import { Comment } from "./comment";
import { Resource } from "./resource";
import { Publisher } from "./publisher";

export class DataSet {
  id!: string;
  title?: string | null;
  refresh_frequency?: string | null;
  theme?: string | null;
  description?: string | null;
  url?: string | null;
  state?: string | null;
  created?: Date | null;
  modified?: Date | null;
  isopen?: boolean | null;
  access_rights?: string | null;
  license_title?: string | null;
  license_url?: string | null;
  license_id?: string | null;
  publisher_id?: string | null;
  tags?: unknown | null; // JSON field
  fetched_at!: Date;

  komentar?: Comment[];
  resurs?: Resource[];
  izdavac?: Publisher | null;
}