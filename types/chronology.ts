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