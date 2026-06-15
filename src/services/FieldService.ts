import { ApiClient } from './ApiClient';
import { Column, FieldDef } from '../models/types';

const NUMERIC = new Set(['integer', 'double']);

export class FieldService {
  constructor(private api: ApiClient) {}

  async getFields(): Promise<FieldDef[]> {
    const res = await this.api.get<{ value: FieldDef[] }>('/_apis/wit/fields?api-version=6.0');
    return res.value;
  }

  static numericFields(fields: FieldDef[]): FieldDef[] {
    return fields.filter((f) => NUMERIC.has(f.type));
  }

  /** Default visible columns, in display order. */
  static defaultColumns(): Column[] {
    return [
      { kind: 'field', referenceName: 'System.Id', header: 'ID' },
      { kind: 'field', referenceName: 'System.WorkItemType', header: 'Work Item Type' },
      { kind: 'field', referenceName: 'System.Title', header: 'Title' },
      { kind: 'field', referenceName: 'System.State', header: 'State' },
      { kind: 'field', referenceName: 'Microsoft.VSTS.Common.ValueArea', header: 'Value Area' },
      { kind: 'field', referenceName: 'System.IterationPath', header: 'Iteration Path' },
      { kind: 'field', referenceName: 'System.Tags', header: 'Tags' },
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.OriginalEstimate', ofType: 'Task', header: 'Sum of Task Original Estimate' },
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.CompletedWork', ofType: 'Task', header: 'Sum of Task Completed Work' },
    ];
  }
}
