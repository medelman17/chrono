export interface DocumentReference {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
}

export interface ChronologyEntry {
  id: number | string;
  date: string;
  time: string;
  parties: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  legalSignificance: string;
  relatedEntries: string;
  createdAt: string;
  updatedAt: string;
  documents?: DocumentReference[];
}

export interface ChronologyFormData {
  date: string;
  time: string;
  parties: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  legalSignificance: string;
  relatedEntries: string;
}