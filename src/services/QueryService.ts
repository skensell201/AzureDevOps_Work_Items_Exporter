import { ApiClient } from './ApiClient';
import { QueryNode, WiqlResult } from '../models/types';

interface RawQuery {
  id: string;
  name: string;
  path: string;
  isFolder?: boolean;
  hasChildren?: boolean;
  children?: RawQuery[];
}

function toNode(raw: RawQuery): QueryNode {
  return {
    id: raw.id,
    name: raw.name,
    path: raw.path,
    isFolder: !!raw.isFolder,
    hasChildren: !!raw.hasChildren,
    children: (raw.children ?? []).map(toNode),
  };
}

export class QueryService {
  constructor(private api: ApiClient) {}

  async getQueryTree(project: string): Promise<QueryNode[]> {
    const res = await this.api.get<{ value: RawQuery[] }>(
      `/${encodeURIComponent(project)}/_apis/wit/queries?$depth=2&api-version=6.0`
    );
    const roots = res.value.map(toNode);
    await this.expand(project, roots);
    return roots;
  }

  /** The list API caps at $depth=2; fetch unexpanded folders by id so deep queries appear. */
  private async expand(project: string, nodes: QueryNode[]): Promise<void> {
    for (const node of nodes) {
      if (!node.isFolder) continue;
      if (node.hasChildren && node.children.length === 0) {
        const sub = await this.api.get<RawQuery>(
          `/${encodeURIComponent(project)}/_apis/wit/queries/${encodeURIComponent(node.id)}?$depth=2&api-version=6.0`
        );
        node.children = (sub.children ?? []).map(toNode);
      }
      await this.expand(project, node.children);
    }
  }

  async runQuery(project: string, queryId: string): Promise<WiqlResult> {
    return this.api.get<WiqlResult>(
      `/${encodeURIComponent(project)}/_apis/wit/wiql/${encodeURIComponent(queryId)}?api-version=6.0`
    );
  }
}
