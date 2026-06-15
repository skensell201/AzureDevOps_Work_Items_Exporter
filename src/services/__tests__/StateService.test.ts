import { StateService } from '../StateService';
import { ApiClient } from '../ApiClient';

describe('StateService', () => {
  it('collects Completed-category state names across distinct types', async () => {
    const get = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/Bug/'))
        return Promise.resolve({ value: [{ name: 'Closed', category: 'Completed' }, { name: 'Active', category: 'InProgress' }] });
      return Promise.resolve({ value: [{ name: 'Done', category: 'Completed' }] });
    });
    const api: ApiClient = { get, post: jest.fn() };
    const svc = new StateService(api);
    const closed = await svc.getCompletedStates('Proj', ['Bug', 'User Story', 'Bug']);
    expect([...closed].sort()).toEqual(['Closed', 'Done']);
    expect(get).toHaveBeenCalledTimes(2); // de-duped types
    expect(get).toHaveBeenCalledWith('/Proj/_apis/wit/workitemtypes/User%20Story/states?api-version=6.0');
  });

  it('returns empty set for no types without calling the API', async () => {
    const api: ApiClient = { get: jest.fn(), post: jest.fn() };
    const svc = new StateService(api);
    expect((await svc.getCompletedStates('Proj', [])).size).toBe(0);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('tolerates per-type failures (treats failed type as having no states)', async () => {
    const api: ApiClient = { get: jest.fn().mockRejectedValue(new Error('403')), post: jest.fn() };
    const svc = new StateService(api);
    const closed = await svc.getCompletedStates('Proj', ['Bug']);
    expect(closed.size).toBe(0);
  });
});
