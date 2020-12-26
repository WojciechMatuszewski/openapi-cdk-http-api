import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiMapping, ApiMappingItem } from './api-mapping';
import { ApiOperationIds, ApiTypes } from './api-types';
import { applyParametersToAxiosRequestConfig, joinUrl, keys } from './api-utils';
import {
  GetNoteResult,
  ListNotesResult,
  Note,
  SaveNotePayload,
  SaveNoteResult,
  SearchNotesResult
} from './definitions';

export function createApi(options: ApiOptions = {}): Api {
  options = Object.assign({}, defaultApiOptions, options);
  return keys(apiMapping)
    .reduce((api, operationId) => ({
      ...api,
      [operationId]: createApiFetchFunction(apiMapping[operationId], options),
    }), {} as Api);
}

function createApiFetchFunction<K extends ApiOperationIds>(
  mappingItem: ApiMappingItem<K>,
  apiOptions: ApiOptions
): ApiFetchFunction<K> {
  const url = joinUrl(apiOptions.baseUrl, mappingItem.url);
  return (parameters: ApiFetchParameters<K>) => {
    const axiosRequestConfig: AxiosRequestConfig = { url, method: mappingItem.method };
    applyParametersToAxiosRequestConfig(axiosRequestConfig, parameters);
    return axios(axiosRequestConfig);
  };
}

export type ApiParameters<K extends ApiOperationIds> = ApiTypes[K]['parameters'];

export type ApiResponses<K extends ApiOperationIds> = ApiTypes[K]['responses'];

export type ApiFetchParameters<K extends ApiOperationIds> = {
  [parameterType in keyof ApiParameters<K>]: ApiParameters<K>[parameterType]
};

export type ApiFetchFunction<K extends ApiOperationIds> =
  (parameters: ApiParameters<K>) => Promise<AxiosResponse<ApiResponses<K>['success']>>;

export interface ApiOptions {
  baseUrl?: string;
}

const defaultApiOptions: ApiOptions = {

};

export interface Api {
  /**
   * Save a note
   */
  SaveNote: (parameters: {
    body: SaveNotePayload;
  }) => Promise<AxiosResponse<SaveNoteResult>>;
  /**
   * Search for a note
   */
  SearchNote: (parameters: {
    query: {
      query?: string;
      cursor?: string;
      limit?: string;
    };
  }) => Promise<AxiosResponse<SearchNotesResult>>;
  /**
   * Search for a note
   */
  ListNotes: (parameters: {
    query: {
      cursor?: string;
      limit?: string;
    };
  }) => Promise<AxiosResponse<ListNotesResult[]>>;
  /**
   * Search for a note
   */
  GetNote: (parameters: {
    path: {
      id: string;
    };
  }) => Promise<AxiosResponse<GetNoteResult>>;
}
