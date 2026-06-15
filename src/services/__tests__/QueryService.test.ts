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

  it('recursively expands folders deeper than the depth-2 API limit', async () => {
    const get = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/_apis/wit/queries?')) {
        // Top-level tree: a folder that HAS children but whose children weren't returned.
        return Promise.resolve({
          value: [
            { id: 'shared', name: 'Shared Queries', path: 'Shared Queries', isFolder: true, hasChildren: true, children: [] },
          ],
        });
      }
      // Expansion by folder id returns the deep query.
      return Promise.resolve({
        id: 'shared',
        name: 'Shared Queries',
        path: 'Shared Queries',
        isFolder: true,
        hasChildren: true,
        children: [{ id: 'deep', name: 'Deep Query', path: 'Shared Queries/Deep Query', isFolder: false }],
      });
    });
    const api = { get, post: jest.fn() };
    const svc = new QueryService(api);
    const tree = await svc.getQueryTree('Datagile');
    expect(tree[0].children.map((c) => c.name)).toEqual(['Deep Query']);
    expect(get).toHaveBeenCalledWith('/Datagile/_apis/wit/queries/shared?$depth=2&api-version=6.0');
  });
});
