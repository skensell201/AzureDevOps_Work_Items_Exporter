import { QueryService } from '../QueryService';
import { ApiClient } from '../ApiClient';

describe('QueryService', () => {
  it('flattens the query tree into folders and leaf queries', async () => {
    const api: ApiClient = {
      get: jest.fn().mockResolvedValue({
        value: [
          {
            id: 'f1',
            name: 'Shared Queries',
            path: 'Shared Queries',
            isFolder: true,
            children: [{ id: 'q1', name: 'Open Bugs', path: 'Shared Queries/Open Bugs', isFolder: false }],
          },
        ],
      }),
      post: jest.fn(),
    };
    const svc = new QueryService(api);
    const tree = await svc.getQueryTree('Datagile');
    expect(tree[0].isFolder).toBe(true);
    expect(tree[0].children[0].name).toBe('Open Bugs');
    expect(api.get).toHaveBeenCalledWith('/Datagile/_apis/wit/queries?$depth=2&api-version=6.0');
  });

  it('runs a query by id and returns the WIQL result', async () => {
    const api: ApiClient = {
      get: jest.fn().mockResolvedValue({ queryType: 'flat', workItems: [{ id: 5 }] }),
      post: jest.fn(),
    };
    const svc = new QueryService(api);
    const res = await svc.runQuery('Datagile', 'q1');
    expect(res.workItems).toEqual([{ id: 5 }]);
    expect(api.get).toHaveBeenCalledWith('/Datagile/_apis/wit/wiql/q1?api-version=6.0');
  });
});
