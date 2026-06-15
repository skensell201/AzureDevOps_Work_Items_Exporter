import { ApiClient } from './ApiClient';
import { Column, FieldDef } from '../models/types';

const NUMERIC = new Set(['integer', 'double']);

const DEFAULT_FIELDS: { ref: string; header: string }[] = [
  { ref: 'System.Id', header: 'ID' },
  { ref: 'System.WorkItemType', header: 'Work Item Type' },
  { ref: 'System.Title', header: 'Title' },
  { ref: 'System.State', header: 'State' },
  { ref: 'System.AssignedTo', header: 'Assigned To' },
  { ref: 'Microsoft.VSTS.Scheduling.StoryPoints', header: 'Story Points' },
  { ref: 'System.IterationPath', header: 'Iteration Path' },
];

export class FieldService {
  constructor(private api: ApiClient) {}

  async getFields(): Promise<FieldDef[]> {
    const res = await this.api.get<{ value: FieldDef[] }>('/_apis/wit/fields?api-version=6.0');
    return res.value;
  }

  static numericFields(fields: FieldDef[]): FieldDef[] {
    return fields.filter((f) => NUMERIC.has(f.type));
  }

  /** Default visible columns: common stored fields only. Rollup sums are opt-in. */
  static defaultColumns(): Column[] {
    return DEFAULT_FIELDS.map((f) => ({ kind: 'field', referenceName: f.ref, header: f.header }));
  }
}
