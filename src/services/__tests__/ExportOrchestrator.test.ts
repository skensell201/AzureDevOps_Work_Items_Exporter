import { ExportOrchestrator, neededFields } from '../ExportOrchestrator';
import { Column } from '../../models/types';

describe('neededFields', () => {
  it('always includes essential fields plus selected fields and rollup source fields', () => {
    const columns: Column[] = [
      { kind: 'field', referenceName: 'System.AssignedTo', header: 'Assigned To' },
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.Effort', header: 'Sum of Effort' },
    ];
    const fields = neededFields(columns);
    expect(fields).toEqual(
      expect.arrayContaining([
        'System.Id',
        'System.Title',
        'System.State',
        'System.WorkItemType',
        'System.Parent',
        'System.AssignedTo',
        'Microsoft.VSTS.Scheduling.Effort',
      ])
    );
    expect(new Set(fields).size).toBe(fields.length);
  });
});

function fakeStates(set = new Set<string>()) {
  return { getCompletedStates: jest.fn().mockResolvedValue(set) };
}

/** A getFieldsBatch mock that slices a master field map by requested ids. */
function fieldsBatchFrom(master: Map<number, Record<string, unknown>>) {
  return jest.fn().mockImplementation((_p: string, ids: number[]) => {
    const out = new Map<number, Record<string, unknown>>();
    for (const id of ids) if (master.has(id)) out.set(id, master.get(id)!);
    return Promise.resolve(out);
  });
}

describe('ExportOrchestrator.buildBacklogTable', () => {
  it('builds a tree from the authoritative level set, nests descendants and surfaces ancestors as roots', async () => {
    // Level item = Story(2); ancestor = Epic(1); descendant = Task(3).
    const master = new Map<number, Record<string, unknown>>([
      [1, { 'System.Id': 1, 'System.Title': 'Epic', 'System.State': 'New', 'System.WorkItemType': 'Epic' }],
      [2, { 'System.Id': 2, 'System.Title': 'Story', 'System.State': 'New', 'System.WorkItemType': 'User Story', 'System.Parent': 1 }],
      [3, { 'System.Id': 3, 'System.Title': 'Task', 'System.State': 'Closed', 'System.WorkItemType': 'Task', 'System.Parent': 2, 'Microsoft.VSTS.Scheduling.Effort': 4 }],
    ]);
    const backlog = { getBacklogWorkItemIds: jest.fn().mockResolvedValue([2]) };
    const workItems = {
      getFieldsBatch: fieldsBatchFrom(master),
      getDescendants: jest.fn().mockResolvedValue({ ids: [2, 3], parentOf: new Map(), childrenOf: new Map(), roots: [2] }),
      getAncestors: jest.fn().mockResolvedValue([1]),
    };
    const orch = new ExportOrchestrator({ backlog, workItems, states: fakeStates() } as never);
    const columns: Column[] = [
      { kind: 'field', referenceName: 'System.Title', header: 'Title' },
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.Effort', header: 'Sum of Effort' },
    ];
    const { tree, levelTable } = await orch.buildBacklogTable('Contoso', 'Ops', 'Microsoft.RequirementCategory', columns);

    // Tree: Epic(1) is an ancestor root, Story(2) is its child, Task(3) under Story.
    expect(tree.nodes.size).toBe(3);
    expect(tree.roots).toEqual([1]);
    expect(tree.nodes.get(1)!.childIds).toEqual([2]);
    expect(tree.nodes.get(2)!.childIds).toEqual([3]);
    expect(tree.nodes.get(2)!.isLevel).toBe(true);
    expect(tree.nodes.get(1)!.isLevel).toBe(false);
    // Subtree effort sum on the Epic row = 4.
    expect(tree.nodes.get(1)!.cells).toEqual(['Epic', 4]);

    // levelTable = level rows only (Story), one row.
    expect(levelTable.headers).toEqual(['Title', 'Sum of Effort']);
    expect(levelTable.rows).toHaveLength(1);
    expect(levelTable.rows[0]).toEqual(['Story', 4]);
  });

  it('type-filters the authoritative level set, dropping non-matching ids', async () => {
    // Backlog returns a User Story(1) and a Requirement(2); itemType keeps only the Story.
    const master = new Map<number, Record<string, unknown>>([
      [1, { 'System.Id': 1, 'System.Title': 'Story', 'System.WorkItemType': 'User Story' }],
      [2, { 'System.Id': 2, 'System.Title': 'Req', 'System.WorkItemType': 'Requirement' }],
    ]);
    const backlog = { getBacklogWorkItemIds: jest.fn().mockResolvedValue([1, 2]) };
    const workItems = {
      getFieldsBatch: fieldsBatchFrom(master),
      getDescendants: jest.fn().mockResolvedValue({ ids: [1], parentOf: new Map(), childrenOf: new Map(), roots: [1] }),
      getAncestors: jest.fn().mockResolvedValue([]),
    };
    const orch = new ExportOrchestrator({ backlog, workItems, states: fakeStates() } as never);
    const columns: Column[] = [{ kind: 'field', referenceName: 'System.Title', header: 'Title' }];
    const { tree, levelTable } = await orch.buildBacklogTable('Contoso', 'Ops', 'X', columns, 'User Story');

    // Only the Story survives the type filter; descendants/ancestors are fetched for the filtered set.
    expect(workItems.getDescendants).toHaveBeenCalledWith('Contoso', [1]);
    expect(workItems.getAncestors).toHaveBeenCalledWith('Contoso', [1]);
    expect([...tree.nodes.keys()]).toEqual([1]);
    expect(levelTable.rows.map((r) => r[0])).toEqual(['Story']);
  });

  it('fetches completed states only when a closed child-count column is requested', async () => {
    const master = new Map<number, Record<string, unknown>>([
      [1, { 'System.WorkItemType': 'Epic', 'System.State': 'New' }],
      [2, { 'System.WorkItemType': 'Task', 'System.State': 'Завершено', 'System.Parent': 1 }],
    ]);
    const backlog = { getBacklogWorkItemIds: jest.fn().mockResolvedValue([1]) };
    const workItems = {
      getFieldsBatch: fieldsBatchFrom(master),
      getDescendants: jest.fn().mockResolvedValue({ ids: [1, 2], parentOf: new Map(), childrenOf: new Map(), roots: [1] }),
      getAncestors: jest.fn().mockResolvedValue([]),
    };
    const states = fakeStates(new Set(['Завершено']));
    const orch = new ExportOrchestrator({ backlog, workItems, states } as never);
    const columns: Column[] = [{ kind: 'childCount', variant: 'closed', header: 'Closed children' }];
    const { tree } = await orch.buildBacklogTable('Contoso', 'Ops', 'X', columns);
    expect(states.getCompletedStates).toHaveBeenCalledWith('Contoso', expect.arrayContaining(['Epic', 'Task']));
    expect(tree.nodes.get(1)!.cells).toEqual([1]); // the localized-closed descendant is counted
  });

  it('does not fetch completed states when no closed column is requested', async () => {
    const master = new Map<number, Record<string, unknown>>([
      [1, { 'System.Title': 'X', 'System.WorkItemType': 'Epic' }],
    ]);
    const backlog = { getBacklogWorkItemIds: jest.fn().mockResolvedValue([1]) };
    const workItems = {
      getFieldsBatch: fieldsBatchFrom(master),
      getDescendants: jest.fn().mockResolvedValue({ ids: [1], parentOf: new Map(), childrenOf: new Map(), roots: [1] }),
      getAncestors: jest.fn().mockResolvedValue([]),
    };
    const states = fakeStates();
    const orch = new ExportOrchestrator({ backlog, workItems, states } as never);
    await orch.buildBacklogTable('P', 'T', 'B', [{ kind: 'field', referenceName: 'System.Title', header: 'Title' }]);
    expect(states.getCompletedStates).not.toHaveBeenCalled();
  });
});

describe('ExportOrchestrator.buildQueryTable', () => {
  it('runs a flat query, expands descendants, and builds a tree with the query ids as level roots', async () => {
    const master = new Map<number, Record<string, unknown>>([
      [1, { 'System.Title': 'Story', 'System.WorkItemType': 'User Story' }],
      [2, { 'System.Title': 'Task', 'System.WorkItemType': 'Task', 'System.Parent': 1, 'Microsoft.VSTS.Scheduling.Effort': 2 }],
    ]);
    const query = { runQuery: jest.fn().mockResolvedValue({ queryType: 'flat', workItems: [{ id: 1 }] }) };
    const workItems = {
      getFieldsBatch: fieldsBatchFrom(master),
      getDescendants: jest.fn().mockResolvedValue({ ids: [1, 2], parentOf: new Map(), childrenOf: new Map(), roots: [1] }),
      getAncestors: jest.fn(),
    };
    const orch = new ExportOrchestrator({ query, workItems, states: fakeStates() } as never);
    const columns: Column[] = [
      { kind: 'field', referenceName: 'System.Title', header: 'Title' },
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.Effort', header: 'Sum of Effort' },
    ];
    const { tree, levelTable } = await orch.buildQueryTable('Contoso', 'q1', columns);
    expect(tree.roots).toEqual([1]);
    expect(tree.nodes.get(1)!.childIds).toEqual([2]);
    expect(tree.nodes.get(1)!.isLevel).toBe(true);
    expect(levelTable.rows).toHaveLength(1);
    expect(levelTable.rows[0]).toEqual(['Story', 2]);
    expect(query.runQuery).toHaveBeenCalledWith('Contoso', 'q1');
  });

  it('uses the query relations directly for a tree query (no extra descendant fetch)', async () => {
    const master = new Map<number, Record<string, unknown>>([
      [1, { 'System.Title': 'Epic', 'System.WorkItemType': 'Epic' }],
      [2, { 'System.Title': 'Story', 'System.WorkItemType': 'User Story', 'System.Parent': 1 }],
    ]);
    const query = {
      runQuery: jest.fn().mockResolvedValue({
        queryType: 'tree',
        workItemRelations: [
          { rel: null, source: null, target: { id: 1 } },
          { rel: 'System.LinkTypes.Hierarchy-Forward', source: { id: 1 }, target: { id: 2 } },
        ],
      }),
    };
    const workItems = {
      getFieldsBatch: fieldsBatchFrom(master),
      getDescendants: jest.fn(),
      getAncestors: jest.fn(),
    };
    const orch = new ExportOrchestrator({ query, workItems, states: fakeStates() } as never);
    const { tree } = await orch.buildQueryTable('Contoso', 'q2', [{ kind: 'field', referenceName: 'System.Title', header: 'Title' }]);
    expect(workItems.getDescendants).not.toHaveBeenCalled(); // tree query already has hierarchy
    expect(tree.roots).toEqual([1]); // root of the tree query
    expect(tree.nodes.get(1)!.childIds).toEqual([2]);
    expect(tree.nodes.get(1)!.isLevel).toBe(true);
  });
});
