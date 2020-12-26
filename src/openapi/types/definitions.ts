export interface SaveNotePayload {
  text: string;
}

export interface SaveNoteResult {
  text: string;
  id: string;
  sentiment: string;
  createdAt: string;
}

export interface Note {
  text: string;
  id: string;
  sentiment: string;
  createdAt: string;
}

export interface SearchNotesResult {
  notes: Note[];
  cursor?: string;
}

export interface ListNotesResult {
  notes: Note[];
  cursor?: string;
}

export interface GetNoteResult {
  text: string;
  id: string;
  sentiment: string;
  createdAt: string;
}
