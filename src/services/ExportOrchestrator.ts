import { Column, Table, TreeRelations } from '../models/types';
import { BacklogService } from './BacklogService';
import { QueryService } from './QueryService';
import { WorkItemService } from './WorkItemService';
import { StateService } from './StateService';
import { computeRollups } from './RollupService';
import { buildTable } from './TableBuilder';
import { parseRelations } from './parseRelations';

const ESSENTIAL = ['System.Id', 'System.Title', 'System.State', 'System.WorkItemType'];

/** Field references that must be fetched to satisfy the requested columns. */
export function neededFields(columns: Column[]): string[] {
  const set = new Set<string>(ESSENTIAL);
  for (const c of columns) {
    if (c.kind === 'field') set.add(c.referenceName);
    if (c.kind === 'rollupSum') set.add(c.field);
  }
  return [...set];
}

function sumFieldsOf(columns: Column[]): string[] {
  return [...new Set(columns.filter((c) => c.kind === 'rollupSum').map((c) => (c as { field: string }).field))];
}

function needsClosed(columns: Column[]): boolean {
  return columns.some((c) => c.kind === 'childCount' && c.variant === 'closed');
}

function distinctTypes(fields: Map<number, Record<string, unknown>>): string[] {
  const types = new Set<string>();
  for (const f of fields.values()) {
    const t = f['System.WorkItemType'];
    if (typeof t === 'string') types.add(t);
  }
  return [...types];
}

export interface Services {
  backlog: BacklogService;
  query: QueryService;
  workItems: WorkItemService;
  states: StateService;
}

export interface BuildResult {
  table: Table;
  warnings: string[];
}

export class ExportOrchestrator {
  constructor(private s: Services) {}

  async buildBacklogTable(project: string, team: string, backlogId: string, columns: Column[]): Promise<BuildResult> {
    const rowIds = await this.s.backlog.getBacklogWorkItemIds(project, team, backlogId);
    const tree = await this.s.workItems.getDescendants(project, rowIds);
    return this.finish(project, rowIds, tree, columns);
  }

  async buildQueryTable(project: string, queryId: string, columns: Column[]): Promise<BuildResult> {
    const result = await this.s.query.runQuery(project, queryId);
    if (result.workItemRelations) {
      const tree = parseRelations(result.workItemRelations);
      const rowIds = tree.roots.length ? tree.roots : tree.ids;
      return this.finish(project, rowIds, tree, columns);
    }
    const rowIds = (result.workItems ?? []).map((w) => w.id);
    const tree = await this.s.workItems.getDescendants(project, rowIds);
    return this.finish(project, rowIds, tree, columns);
  }

  private async finish(project: string, rowIds: number[], tree: TreeRelations, columns: Column[]): Promise<BuildResult> {
    const allIds = [...new Set([...rowIds, ...tree.ids])];
    const fields = await this.s.workItems.getFieldsBatch(allIds, neededFields(columns));
    const closedStates = needsClosed(columns)
      ? await this.s.states.getCompletedStates(project, distinctTypes(fields))
      : undefined;
    const rollups = computeRollups({
      ids: allIds,
      parentOf: tree.parentOf,
      childrenOf: tree.childrenOf,
      fields,
      sumFields: sumFieldsOf(columns),
      closedStates,
    });
    return { table: buildTable({ rowIds, columns, fields, rollups }), warnings: [] };
  }
}
