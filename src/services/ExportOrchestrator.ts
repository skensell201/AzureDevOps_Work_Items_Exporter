import { Column, Table, TreeTable } from '../models/types';
import { BacklogService } from './BacklogService';
import { QueryService } from './QueryService';
import { WorkItemService } from './WorkItemService';
import { StateService } from './StateService';
import { computeRollups, SumSpec, rollupKey } from './RollupService';
import { buildRow } from './TableBuilder';
import { buildTree } from './TreeBuilder';
import { parseRelations } from './parseRelations';

const ESSENTIAL = ['System.Id', 'System.Title', 'System.State', 'System.WorkItemType', 'System.Parent'];

/** Field references that must be fetched to satisfy the requested columns. */
export function neededFields(columns: Column[]): string[] {
  const set = new Set<string>(ESSENTIAL);
  for (const c of columns) {
    if (c.kind === 'field') set.add(c.referenceName);
    if (c.kind === 'rollupSum') set.add(c.field);
  }
  return [...set];
}

function sumSpecsOf(columns: Column[]): SumSpec[] {
  const seen = new Set<string>();
  const specs: SumSpec[] = [];
  for (const c of columns) {
    if (c.kind !== 'rollupSum') continue;
    const key = rollupKey(c.field, c.ofType);
    if (seen.has(key)) continue;
    seen.add(key);
    specs.push({ field: c.field, ofType: c.ofType });
  }
  return specs;
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

/** Derives parent/child maps from System.Parent, only linking when both ends are in the set. */
function parentChild(ids: number[], fields: Map<number, Record<string, unknown>>) {
  const idSet = new Set(ids);
  const parentOf = new Map<number, number | null>();
  const childrenOf = new Map<number, number[]>();
  for (const id of ids) {
    const p = fields.get(id)?.['System.Parent'];
    const parent = typeof p === 'number' && idSet.has(p) ? p : null;
    parentOf.set(id, parent);
    if (parent != null) {
      const kids = childrenOf.get(parent) ?? [];
      kids.push(id);
      childrenOf.set(parent, kids);
    }
  }
  return { parentOf, childrenOf };
}

export interface Services {
  backlog: BacklogService;
  query: QueryService;
  workItems: WorkItemService;
  states: StateService;
}

export interface BuildResult {
  tree: TreeTable;
  levelTable: Table; // flat level-only rows (for "Level only" export + count)
  warnings: string[];
}

export class ExportOrchestrator {
  constructor(private s: Services) {}

  async buildBacklogTable(
    project: string,
    team: string,
    backlogId: string,
    columns: Column[],
    itemType?: string
  ): Promise<BuildResult> {
    const levelIds0 = await this.s.backlog.getBacklogWorkItemIds(project, team, backlogId);
    const typeFields = await this.s.workItems.getFieldsBatch(project, levelIds0, ['System.WorkItemType']);
    const levelIds = itemType
      ? levelIds0.filter((id) => typeFields.get(id)?.['System.WorkItemType'] === itemType)
      : levelIds0;
    const down = await this.s.workItems.getDescendants(project, levelIds);
    const ancestors = await this.s.workItems.getAncestors(project, levelIds);
    const orderedIds = [...new Set([...ancestors, ...levelIds, ...down.ids])];
    return this.assemble(project, orderedIds, levelIds, columns);
  }

  async buildQueryTable(project: string, queryId: string, columns: Column[]): Promise<BuildResult> {
    const result = await this.s.query.runQuery(project, queryId);
    if (result.workItemRelations) {
      const tree = parseRelations(result.workItemRelations);
      const levelIds = tree.roots.length ? tree.roots : tree.ids;
      return this.assemble(project, tree.ids, levelIds, columns);
    }
    const rowIds = (result.workItems ?? []).map((w) => w.id);
    const down = await this.s.workItems.getDescendants(project, rowIds);
    const orderedIds = [...new Set([...rowIds, ...down.ids])];
    return this.assemble(project, orderedIds, rowIds, columns);
  }

  /** Fetches fields, builds parent/child + rollups, and assembles the tree + level table. */
  private async assemble(
    project: string,
    orderedIds: number[],
    levelIds: number[],
    columns: Column[]
  ): Promise<BuildResult> {
    const fields = await this.s.workItems.getFieldsBatch(project, orderedIds, neededFields(columns));
    const { parentOf, childrenOf } = parentChild(orderedIds, fields);
    const closedStates = needsClosed(columns)
      ? await this.s.states.getCompletedStates(project, distinctTypes(fields))
      : undefined;
    const rollups = computeRollups({
      ids: orderedIds,
      parentOf,
      childrenOf,
      fields,
      sums: sumSpecsOf(columns),
      closedStates,
    });
    const tree = buildTree({ orderedIds, levelIds, parentOf, columns, fields, rollups });
    const levelTable: Table = {
      columns,
      headers: columns.map((c) => c.header),
      rows: levelIds.map((id) => buildRow(columns, id, fields, rollups)),
    };
    return { tree, levelTable, warnings: [] };
  }
}
