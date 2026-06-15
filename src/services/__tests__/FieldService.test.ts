import { FieldService } from '../FieldService';
import { ApiClient } from '../ApiClient';
import { FieldDef } from '../../models/types';

function fakeApi(fields: Partial<FieldDef>[]): ApiClient {
  return {
    get: jest.fn().mockResolvedValue({ value: fields }),
    post: jest.fn(),
  };
}

describe('FieldService', () => {
  it('fetches process fields from the fields API', async () => {
    const api = fakeApi([{ referenceName: 'System.Title', name: 'Title', type: 'string' }]);
    const svc = new FieldService(api);
    const fields = await svc.getFields();
    expect(fields[0].referenceName).toBe('System.Title');
    expect(api.get).toHaveBeenCalledWith('/_apis/wit/fields?api-version=6.0');
  });

  it('filters numeric fields (integer/double)', () => {
    const fields: FieldDef[] = [
      { referenceName: 'System.Title', name: 'Title', type: 'string' },
      { referenceName: 'Microsoft.VSTS.Scheduling.Effort', name: 'Effort', type: 'double' },
      { referenceName: 'System.Id', name: 'ID', type: 'integer' },
    ];
    expect(FieldService.numericFields(fields).map((f) => f.referenceName)).toEqual([
      'Microsoft.VSTS.Scheduling.Effort',
      'System.Id',
    ]);
  });

  it('default columns are common stored fields only (no rollup sums)', () => {
    const cols = FieldService.defaultColumns();
    expect(cols.some((c) => c.kind === 'field' && c.referenceName === 'System.Title')).toBe(true);
    expect(cols.some((c) => c.kind === 'field' && c.referenceName === 'System.State')).toBe(true);
    expect(cols.some((c) => c.kind === 'rollupSum')).toBe(false);
  });
});
