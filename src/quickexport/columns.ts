import { Column, Rollups } from '../models/types';

/** Field columns matching what the native backlog renders by default. */
export function quickExportColumns(): Column[] {
  return [
    { kind: 'field', referenceName: 'System.Id', header: 'ID' },
    { kind: 'field', referenceName: 'System.WorkItemType', header: 'Work Item Type' },
    { kind: 'field', referenceName: 'System.Title', header: 'Title' },
    { kind: 'field', referenceName: 'System.State', header: 'State' },
    { kind: 'field', referenceName: 'System.AssignedTo', header: 'Assigned To' },
    { kind: 'field', referenceName: 'System.AreaPath', header: 'Area Path' },
    { kind: 'field', referenceName: 'System.IterationPath', header: 'Iteration Path' },
    { kind: 'field', referenceName: 'System.Tags', header: 'Tags' },
  ];
}

/** All-empty rollups: the quick export computes no sums/counts/hierarchy. */
export function emptyRollups(): Rollups {
  return {
    sum: new Map(),
    countAll: new Map(),
    countClosed: new Map(),
    path: new Map(),
    level: new Map(),
    parentTitle: new Map(),
  };
}
