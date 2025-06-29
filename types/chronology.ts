export interface DocumentReference {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
}

export interface Chronology {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  caseId: string;
  userId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  entriesCount?: number;
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
  chronologyId?: string;
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

export interface ChronologyInput {
  name: string;
  description?: string;
  type?: string;
}

export interface Party {
  id: string;
  name: string;
  role: string;
  description?: string | null;
  caseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartyInput {
  name: string;
  role: string;
  description?: string;
}