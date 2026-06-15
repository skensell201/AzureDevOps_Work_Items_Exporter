import { ApiClient } from './ApiClient';
import { NamedRef } from '../models/types';

export class ProjectService {
  constructor(private api: ApiClient) {}

  async getProjects(): Promise<NamedRef[]> {
    const res = await this.api.get<{ value: NamedRef[] }>('/_apis/projects?$top=1000&api-version=6.0');
    return res.value;
  }

  async getTeams(projectId: string): Promise<NamedRef[]> {
    const res = await this.api.get<{ value: NamedRef[] }>(
      `/_apis/projects/${encodeURIComponent(projectId)}/teams?api-version=6.0`
    );
    return res.value;
  }

  /** Work item type names in the project's process (for type-scoped rollup sums). */
  async getWorkItemTypes(project: string): Promise<string[]> {
    const res = await this.api.get<{ value: { name: string }[] }>(
      `/${encodeURIComponent(project)}/_apis/wit/workitemtypes?api-version=6.0`
    );
    return res.value.map((t) => t.name);
  }
}
