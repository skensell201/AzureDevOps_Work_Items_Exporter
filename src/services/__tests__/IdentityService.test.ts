import { IdentityService } from '../IdentityService';
import { ApiClient } from '../ApiClient';

describe('IdentityService', () => {
  it('searches identities and maps to {id, displayName}', async () => {
    const get = jest.fn().mockResolvedValue({
      value: [{ id: 'u1', providerDisplayName: 'Ann Lee' }, { id: 'u2', displayName: 'Bob' }],
    });
    const api: ApiClient = { get, post: jest.fn() };
    const svc = new IdentityService(api);
    const users = await svc.search('a');
    expect(users).toEqual([{ id: 'u1', displayName: 'Ann Lee' }, { id: 'u2', displayName: 'Bob' }]);
    expect(get).toHaveBeenCalledWith(
      '/_apis/identities?searchFilter=General&filterValue=a&queryMembership=None&api-version=6.0'
    );
  });

  it('returns [] for a blank query without calling the API', async () => {
    const api: ApiClient = { get: jest.fn(), post: jest.fn() };
    const svc = new IdentityService(api);
    expect(await svc.search('   ')).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });
});
