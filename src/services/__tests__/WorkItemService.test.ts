import { WorkItemService } from '../WorkItemService';
import { ApiClient } from '../ApiClient';

describe('WorkItemService', () => {
  it('fetches descendants via a recursive workItemLinks WIQL scoped to root ids', async () => {
    const post = jest.fn().mockResolvedValue({
      workItemRelations: [
        { rel: null, source: null, target: { id: 1 } },
        { rel: 'System.LinkTypes.Hierarchy-Forward', source: { id: 1 }, target: { id: 2 } },
      ],
    });
    const api: ApiClient = { get: jest.fn(), post };
    const svc = new WorkItemService(api);
    const tree = await svc.getDescendants('Datagile', [1]);
    expect(tree.childrenOf.get(1)).toEqual([2]);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/Datagile/_apis/wit/wiql?api-version=6.0');
    expect((body as { query: string }).query).toContain('MODE (Recursive)');
    expect((body as { query: string }).query).toContain('[Source].[System.Id] IN (1)');
  });

  it('batch-fetches fields in chunks of 200 and merges into a map', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => i + 1);
    const post = jest.fn().mockImplementation((_url: string, body: { ids: number[] }) =>
      Promise.resolve({ value: body.ids.map((id) => ({ id, fields: { 'System.Id': id } })) })
    );
    const api: ApiClient = { get: jest.fn(), post };
    const svc = new WorkItemService(api);
    const map = await svc.getFieldsBatch(ids, ['System.Id']);
    expect(map.size).toBe(250);
    expect(map.get(1)).toEqual({ 'System.Id': 1 });
    expect(post).toHaveBeenCalledTimes(2); // 200 + 50
    expect(post).toHaveBeenCalledWith('/_apis/wit/workitemsbatch?api-version=6.0', expect.objectContaining({ fields: ['System.Id'] }));
  });

  it('returns empty map for no ids without calling the API', async () => {
    const api: ApiClient = { get: jest.fn(), post: jest.fn() };
    const svc = new WorkItemService(api);
    const map = await svc.getFieldsBatch([], ['System.Id']);
    expect(map.size).toBe(0);
    expect(api.post).not.toHaveBeenCalled();
  });
});
