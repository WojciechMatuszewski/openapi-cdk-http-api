import {
  GetNoteResult,
  ListNotesResult,
  Note,
  SaveNotePayload,
  SaveNoteResult,
  SearchNotesResult
} from './definitions';

export enum ParameterType {
  BODY = 'body',
  QUERY = 'query',
  FORM_DATA = 'formData',
  PATH = 'path',
}

export type ApiOperationIds = keyof ApiTypes;

export interface ApiTypes {
  SaveNote: {
    tag: any;
    parameters: {
      body: SaveNotePayload;
    };
    responses: {
      success: SaveNoteResult;
      error: undefined;
    };
  };
  SearchNote: {
    tag: any;
    parameters: {
      query: {
        query?: string;
        cursor?: string;
        limit?: string;
      };
    };
    responses: {
      success: SearchNotesResult;
      error: undefined;
    };
  };
  ListNotes: {
    tag: any;
    parameters: {
      query: {
        cursor?: string;
        limit?: string;
      };
    };
    responses: {
      success: ListNotesResult[];
      error: undefined;
    };
  };
  GetNote: {
    tag: any;
    parameters: {
      path: {
        id: string;
      };
    };
    responses: {
      success: GetNoteResult;
      error: undefined;
    };
  };
}
