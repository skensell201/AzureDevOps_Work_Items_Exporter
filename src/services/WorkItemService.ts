import { ApiClient } from './ApiClient';
import { TreeRelations, WiqlResult } from '../models/types';
import { parseRelations } from './parseRelations';
import { runBatched } from '../utils/batch';

const CHUNK = 200;

export class WorkItemService {
  constructor(private api: ApiClient) {}

  /** Recursive hierarchy expansion from the given root ids (their whole subtrees). */
  async getDescendants(project: string, rootIds: number[]): Promise<TreeRelations> {
    // Guard the WIQL id list: only integers are interpolated into the query string.
    const safeIds = rootIds.filter((n) => Number.isInteger(n));
    if (safeIds.length === 0) return { ids: [], parentOf: new Map(), childrenOf: new Map(), roots: [] };
    const query =
      `SELECT [System.Id] FROM workitemLinks ` +
      `WHERE ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') ` +
      `AND ([Source].[System.Id] IN (${safeIds.join(',')})) MODE (Recursive)`;
    const res = await this.api.post<WiqlResult>(
      `/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=6.0`,
      { query }
    );
    return parseRelations(res.workItemRelations ?? []);
  }

  /** Fetches fields for the given ids in chunks of 200; merges into id -> fields.
   *  Project-scoped: the collection-level workitemsbatch route 404s on some on-prem servers. */
  async getFieldsBatch(
    project: string,
    ids: number[],
    fields: string[]
  ): Promise<Map<number, Record<string, unknown>>> {
    const result = new Map<number, Record<string, unknown>>();
    if (ids.length === 0) return result;
    const chunks: number[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
    const responses = await runBatched(chunks, (chunk) =>
      this.api.post<{ value: { id: number; fields: Record<string, unknown> }[] }>(
        `/${encodeURIComponent(project)}/_apis/wit/workitemsbatch?api-version=6.0`,
        { ids: chunk, fields }
      )
    );
    for (const res of responses) for (const wi of res.value) result.set(wi.id, wi.fields);
    return result;
  }
}
