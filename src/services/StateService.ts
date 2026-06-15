import { ApiClient } from './ApiClient';
import { runBatched } from '../utils/batch';

interface StateDef {
  name: string;
  category: string;
}

/** Resolves which state names belong to the "Completed" category for the given work item types. */
export class StateService {
  constructor(private api: ApiClient) {}

  async getCompletedStates(project: string, types: string[]): Promise<Set<string>> {
    const closed = new Set<string>();
    const unique = [...new Set(types)].filter((t) => t.length > 0);
    if (unique.length === 0) return closed;
    const responses = await runBatched(unique, (type) =>
      this.api
        .get<{ value: StateDef[] }>(
          `/${encodeURIComponent(project)}/_apis/wit/workitemtypes/${encodeURIComponent(type)}/states?api-version=6.0`
        )
        .catch(() => ({ value: [] as StateDef[] }))
    );
    for (const res of responses) for (const s of res.value) if (s.category === 'Completed') closed.add(s.name);
    return closed;
  }
}
