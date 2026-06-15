import { ApiClient } from './ApiClient';
import { QueryNode, WiqlResult } from '../models/types';

interface RawQuery {
  id: string;
  name: string;
  path: string;
  isFolder?: boolean;
  children?: RawQuery[];
}

function toNode(raw: RawQuery): QueryNode {
  return {
    id: raw.id,
    name: raw.name,
    path: raw.path,
    isFolder: !!raw.isFolder,
    children: (raw.children ?? []).map(toNode),
  };
}

export class QueryService {
  constructor(private api: ApiClient) {}

  async getQueryTree(project: string): Promise<QueryNode[]> {
    const res = await this.api.get<{ value: RawQuery[] }>(
      `/${encodeURIComponent(project)}/_apis/wit/queries?$depth=2&api-version=6.0`
    );
    return res.value.map(toNode);
  }

  async runQuery(project: string, queryId: string): Promise<WiqlResult> {
    return this.api.get<WiqlResult>(`/${encodeURIComponent(project)}/_apis/wit/wiql/${queryId}?api-version=6.0`);
  }
}
