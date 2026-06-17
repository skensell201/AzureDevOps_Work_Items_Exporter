import { buildBacklogExport, ExportDeps } from '../backlogExport';
import { NamedRef } from '../../models/types';

function deps(): ExportDeps {
  return {
    backlog: {
      getBacklogLevels: async (_p: string, _t: string): Promise<NamedRef[]> => [
        { id: 'Microsoft.EpicCategory', name: 'Epics' },
        { id: 'Microsoft.RequirementCategory', name: 'Stories' },
      ],
      getBacklogWorkItemIds: async (_p: string, _t: string, id: string): Promise<number[]> => {
        expect(id).toBe('Microsoft.RequirementCategory');
        return [10, 20];
      },
    },
    workItems: {
      getFieldsBatch: async (_p: string, ids: number[], _f: string[]) =>
        new Map(ids.map((i) => [i, { 'System.Id': i, 'System.Title': `T${i}` }])),
    },
  };
}

describe('buildBacklogExport', () => {
  it('resolves the level (case-insensitively) and produces a CSV payload', async () => {
    const out = await buildBacklogExport(deps(), {
      project: 'GIS BIOM',
      team: 'GIS BIOM LogManagement',
      level: 'stories',
      format: 'csv',
    });
    expect(out.mime).toBe('text/csv;charset=utf-8');
    expect(out.filename).toBe('GIS BIOM LogManagement - Stories.csv');
    expect(typeof out.data).toBe('string');
    expect(out.data as string).toContain('ID,Work Item Type,Title');
    expect(out.data as string).toContain('T10');
    expect(out.data as string).toContain('T20');
  });

  it('produces an xlsx Blob payload for the excel format', async () => {
    const out = await buildBacklogExport(deps(), {
      project: 'GIS BIOM',
      team: 'GIS BIOM LogManagement',
      level: 'Stories',
      format: 'excel',
    });
    expect(out.filename).toBe('GIS BIOM LogManagement - Stories.xlsx');
    expect(out.mime).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(out.data).toBeInstanceOf(Blob);
  });

  it('throws a clear error when the level name is unknown', async () => {
    await expect(
      buildBacklogExport(deps(), { project: 'P', team: 'Tm', level: 'Nope', format: 'csv' })
    ).rejects.toThrow(/Backlog level "Nope" not found.*Available: Epics, Stories/);
  });
});
