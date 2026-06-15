import { computeRollups } from '../RollupService';

describe('computeRollups', () => {
  // Tree: 1(Epic) -> 2(Feature) -> 3(Task,eff 5,Closed), 4(Task,eff 3,New)
  const parentOf = new Map<number, number | null>([
    [1, null],
    [2, 1],
    [3, 2],
    [4, 2],
  ]);
  const childrenOf = new Map<number, number[]>([
    [1, [2]],
    [2, [3, 4]],
  ]);
  const fields = new Map<number, Record<string, unknown>>([
    [1, { 'System.Title': 'Epic', 'System.State': 'New' }],
    [2, { 'System.Title': 'Feature', 'System.State': 'Active' }],
    [3, { 'System.Title': 'T3', 'System.State': 'Closed', 'Microsoft.VSTS.Scheduling.Effort': 5 }],
    [4, { 'System.Title': 'T4', 'System.State': 'New', 'Microsoft.VSTS.Scheduling.Effort': 3 }],
  ]);

  const r = computeRollups({
    ids: [1, 2, 3, 4],
    parentOf,
    childrenOf,
    fields,
    sumFields: ['Microsoft.VSTS.Scheduling.Effort'],
  });

  it('sums a numeric field over the whole subtree (inclusive)', () => {
    const eff = r.sum.get('Microsoft.VSTS.Scheduling.Effort')!;
    expect(eff.get(1)).toBe(8);
    expect(eff.get(2)).toBe(8);
    expect(eff.get(3)).toBe(5);
  });

  it('counts all descendants and closed descendants', () => {
    expect(r.countAll.get(1)).toBe(3); // 2,3,4
    expect(r.countAll.get(2)).toBe(2); // 3,4
    expect(r.countClosed.get(2)).toBe(1); // 3 is Closed
    expect(r.countAll.get(3)).toBe(0);
  });

  it('computes hierarchy path, level and parent title', () => {
    expect(r.path.get(3)).toBe('Epic / Feature / T3');
    expect(r.level.get(1)).toBe(0);
    expect(r.level.get(3)).toBe(2);
    expect(r.parentTitle.get(2)).toBe('Epic');
    expect(r.parentTitle.get(1)).toBe('');
  });

  it('ignores non-numeric values in sums', () => {
    const r2 = computeRollups({
      ids: [1, 2],
      parentOf: new Map([[1, null], [2, 1]]),
      childrenOf: new Map([[1, [2]]]),
      fields: new Map([
        [1, {}],
        [2, { 'Microsoft.VSTS.Scheduling.Effort': 'oops' }],
      ]),
      sumFields: ['Microsoft.VSTS.Scheduling.Effort'],
    });
    expect(r2.sum.get('Microsoft.VSTS.Scheduling.Effort')!.get(1)).toBe(0);
  });
});
