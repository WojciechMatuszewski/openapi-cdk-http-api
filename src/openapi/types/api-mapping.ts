import { Method } from 'axios';
import { ApiOperationIds, ApiTypes } from './api-types';

export interface ApiMappingItem<key extends ApiOperationIds> {
  url: string;
  method: Method;
  tags: Array<ApiTypes[key]['tag']>;
}

export type ApiMapping = {
  [key in keyof ApiTypes]: ApiMappingItem<key>
};

export const apiMapping: ApiMapping = {
  SaveNote: {
    url: '/save',
    method: 'post',
    tags: [

    ]
  },
  SearchNote: {
    url: '/search',
    method: 'get',
    tags: [

    ]
  },
  ListNotes: {
    url: '/list',
    method: 'get',
    tags: [

    ]
  },
  GetNote: {
    url: '/get/{id}',
    method: 'get',
    tags: [

    ]
  }
};
