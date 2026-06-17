import { quickExportColumns, emptyRollups } from '../columns';

describe('quickExportColumns', () => {
  it('is a flat list of field columns (no rollup kinds)', () => {
    const cols = quickExportColumns();
    expect(cols.length).toBeGreaterThan(0);
    expect(cols.every((c) => c.kind === 'field')).toBe(true);
    expect(cols[0]).toEqual({ kind: 'field', referenceName: 'System.Id', header: 'ID' });
  });
});

describe('emptyRollups', () => {
  it('has empty maps for every rollup channel', () => {
    const r = emptyRollups();
    expect(r.sum.size).toBe(0);
    expect(r.countAll.size).toBe(0);
    expect(r.countClosed.size).toBe(0);
    expect(r.path.size).toBe(0);
    expect(r.level.size).toBe(0);
    expect(r.parentTitle.size).toBe(0);
  });
});
