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

  it('aggregates closed counts transitively up to the root', () => {
    // Node 3 is Closed, two levels below root 1; it should be counted at the root.
    expect(r.countClosed.get(1)).toBe(1);
  });

  it('respects a custom (localized) closedStates set', () => {
    const lParentOf = new Map<number, number | null>([[1, null], [2, 1]]);
    const lChildrenOf = new Map<number, number[]>([[1, [2]]]);
    const lFields = new Map<number, Record<string, unknown>>([
      [1, { 'System.Title': 'Корень', 'System.State': 'Активно' }],
      [2, { 'System.Title': 'Ребёнок', 'System.State': 'Завершено' }],
    ]);

    const withCustom = computeRollups({
      ids: [1, 2],
      parentOf: lParentOf,
      childrenOf: lChildrenOf,
      fields: lFields,
      sumFields: [],
      closedStates: new Set(['Завершено']),
    });
    expect(withCustom.countClosed.get(1)).toBe(1);

    const withDefault = computeRollups({
      ids: [1, 2],
      parentOf: lParentOf,
      childrenOf: lChildrenOf,
      fields: lFields,
      sumFields: [],
    });
    expect(withDefault.countClosed.get(1)).toBe(0);
  });

  it('handles an orphan node whose parent is not in ids', () => {
    let res!: ReturnType<typeof computeRollups>;
    expect(() => {
      res = computeRollups({
        ids: [5],
        parentOf: new Map<number, number | null>([[5, 99]]),
        childrenOf: new Map<number, number[]>(),
        fields: new Map([[5, { 'System.Title': 'Orphan' }]]),
        sumFields: [],
      });
    }).not.toThrow();
    expect(res.level.get(5)).toBe(0);
    expect(res.path.get(5)).toBe('Orphan');
    expect(res.countAll.get(5)).toBe(0);
  });

  it('terminates on a cyclic hierarchy without hanging or throwing', () => {
    let res!: ReturnType<typeof computeRollups>;
    expect(() => {
      res = computeRollups({
        ids: [1, 2],
        parentOf: new Map<number, number | null>([[1, 2], [2, 1]]),
        childrenOf: new Map<number, number[]>([[1, [2]], [2, [1]]]),
        fields: new Map([
          [1, { 'System.Title': 'A', 'System.State': 'New' }],
          [2, { 'System.Title': 'B', 'System.State': 'New' }],
        ]),
        sumFields: [],
      });
    }).not.toThrow();
    expect(res.level.has(1)).toBe(true);
    expect(res.level.has(2)).toBe(true);
    expect(res.countAll.has(1)).toBe(true);
    expect(res.countAll.has(2)).toBe(true);
  });
});
