import { ProjectService } from '../ProjectService';
import { ApiClient } from '../ApiClient';

describe('ProjectService', () => {
  it('lists projects', async () => {
    const api: ApiClient = {
      get: jest.fn().mockResolvedValue({ value: [{ id: 'p1', name: 'Datagile' }] }),
      post: jest.fn(),
    };
    const svc = new ProjectService(api);
    expect(await svc.getProjects()).toEqual([{ id: 'p1', name: 'Datagile' }]);
    expect(api.get).toHaveBeenCalledWith('/_apis/projects?$top=1000&api-version=6.0');
  });

  it('lists teams for a project', async () => {
    const api: ApiClient = {
      get: jest.fn().mockResolvedValue({ value: [{ id: 't1', name: 'Ops Team' }] }),
      post: jest.fn(),
    };
    const svc = new ProjectService(api);
    expect(await svc.getTeams('p1')).toEqual([{ id: 't1', name: 'Ops Team' }]);
    expect(api.get).toHaveBeenCalledWith('/_apis/projects/p1/teams?api-version=6.0');
  });

  it('lists work item type names for a project', async () => {
    const api: ApiClient = {
      get: jest.fn().mockResolvedValue({ value: [{ name: 'Epic' }, { name: 'Task' }] }),
      post: jest.fn(),
    };
    const svc = new ProjectService(api);
    expect(await svc.getWorkItemTypes('Datagile')).toEqual(['Epic', 'Task']);
    expect(api.get).toHaveBeenCalledWith('/Datagile/_apis/wit/workitemtypes?api-version=6.0');
  });
});
