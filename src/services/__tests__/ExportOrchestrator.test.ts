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

describe('ExportOrchestrator.buildBacklogTable', () => {
  it('loads backlog ids, expands descendants, fetches fields, and builds the table', async () => {
    const backlog = { getBacklogWorkItemIds: jest.fn().mockResolvedValue([1]) };
    const workItems = {
      getDescendants: jest.fn().mockResolvedValue({
        ids: [1, 2],
        parentOf: new Map([[1, null], [2, 1]]),
        childrenOf: new Map([[1, [2]]]),
        roots: [1],
      }),
      getFieldsBatch: jest.fn().mockResolvedValue(
        new Map([
          [1, { 'System.Id': 1, 'System.Title': 'Epic', 'System.State': 'New', 'System.WorkItemType': 'Epic' }],
          [2, { 'System.Id': 2, 'System.Title': 'Task', 'System.State': 'Closed', 'System.WorkItemType': 'Task', 'Microsoft.VSTS.Scheduling.Effort': 4 }],
        ])
      ),
    };
    const orch = new ExportOrchestrator({ backlog, workItems, states: fakeStates() } as never);
    const columns: Column[] = [
      { kind: 'field', referenceName: 'System.Title', header: 'Title' },
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.Effort', header: 'Sum of Effort' },
    ];
    const { table } = await orch.buildBacklogTable('Contoso', 'Ops', 'Microsoft.RequirementCategory', columns);
    expect(table.rows).toHaveLength(1); // row set = backlog ids only
    expect(table.headers).toEqual(['Title', 'Sum of Effort']);
    expect(table.rows[0]).toEqual(['Epic', 4]); // subtree effort sum = 4
  });

  it('fetches completed states only when a closed child-count column is requested', async () => {
    const backlog = { getBacklogWorkItemIds: jest.fn().mockResolvedValue([1]) };
    const workItems = {
      getDescendants: jest.fn().mockResolvedValue({
        ids: [1, 2],
        parentOf: new Map([[1, null], [2, 1]]),
        childrenOf: new Map([[1, [2]]]),
        roots: [1],
      }),
      getFieldsBatch: jest.fn().mockResolvedValue(
        new Map([
          [1, { 'System.WorkItemType': 'Epic', 'System.State': 'New' }],
          [2, { 'System.WorkItemType': 'Task', 'System.State': 'Завершено' }],
        ])
      ),
    };
    const states = fakeStates(new Set(['Завершено']));
    const orch = new ExportOrchestrator({ backlog, workItems, states } as never);
    const columns: Column[] = [{ kind: 'childCount', variant: 'closed', header: 'Closed children' }];
    const { table } = await orch.buildBacklogTable('Contoso', 'Ops', 'X', columns);
    expect(states.getCompletedStates).toHaveBeenCalledWith('Contoso', expect.arrayContaining(['Epic', 'Task']));
    expect(table.rows[0]).toEqual([1]); // the localized-closed descendant is counted
  });

  it('does not fetch completed states when no closed column is requested', async () => {
    const backlog = { getBacklogWorkItemIds: jest.fn().mockResolvedValue([1]) };
    const workItems = {
      getDescendants: jest.fn().mockResolvedValue({ ids: [1], parentOf: new Map([[1, null]]), childrenOf: new Map(), roots: [1] }),
      getFieldsBatch: jest.fn().mockResolvedValue(new Map([[1, { 'System.Title': 'X', 'System.WorkItemType': 'Epic' }]])),
    };
    const states = fakeStates();
    const orch = new ExportOrchestrator({ backlog, workItems, states } as never);
    await orch.buildBacklogTable('P', 'T', 'B', [{ kind: 'field', referenceName: 'System.Title', header: 'Title' }]);
    expect(states.getCompletedStates).not.toHaveBeenCalled();
  });
});

describe('ExportOrchestrator.buildQueryTable', () => {
  it('runs a flat query, expands descendants, and builds rows for the query ids', async () => {
    const query = { runQuery: jest.fn().mockResolvedValue({ queryType: 'flat', workItems: [{ id: 1 }] }) };
    const workItems = {
      getDescendants: jest.fn().mockResolvedValue({
        ids: [1, 2],
        parentOf: new Map([[1, null], [2, 1]]),
        childrenOf: new Map([[1, [2]]]),
        roots: [1],
      }),
      getFieldsBatch: jest.fn().mockResolvedValue(
        new Map([
          [1, { 'System.Title': 'Story', 'System.WorkItemType': 'User Story' }],
          [2, { 'System.Title': 'Task', 'System.WorkItemType': 'Task', 'Microsoft.VSTS.Scheduling.Effort': 2 }],
        ])
      ),
    };
    const orch = new ExportOrchestrator({ query, workItems, states: fakeStates() } as never);
    const columns: Column[] = [
      { kind: 'field', referenceName: 'System.Title', header: 'Title' },
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.Effort', header: 'Sum of Effort' },
    ];
    const { table } = await orch.buildQueryTable('Contoso', 'q1', columns);
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0]).toEqual(['Story', 2]);
    expect(query.runQuery).toHaveBeenCalledWith('Contoso', 'q1');
  });

  it('uses the query relations directly for a tree query (no extra descendant fetch)', async () => {
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
      getDescendants: jest.fn(),
      getFieldsBatch: jest.fn().mockResolvedValue(
        new Map([
          [1, { 'System.Title': 'Epic', 'System.WorkItemType': 'Epic' }],
          [2, { 'System.Title': 'Story', 'System.WorkItemType': 'User Story' }],
        ])
      ),
    };
    const orch = new ExportOrchestrator({ query, workItems, states: fakeStates() } as never);
    const { table } = await orch.buildQueryTable('Contoso', 'q2', [{ kind: 'field', referenceName: 'System.Title', header: 'Title' }]);
    expect(workItems.getDescendants).not.toHaveBeenCalled(); // tree query already has hierarchy
    expect(table.rows.map((r) => r[0])).toEqual(['Epic']); // rows = roots of the tree
  });
});
