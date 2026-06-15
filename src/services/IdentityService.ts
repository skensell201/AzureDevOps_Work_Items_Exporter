import { ApiClient } from './ApiClient';
import { SharedUser } from '../models/types';

interface RawIdentity {
  id: string;
  providerDisplayName?: string;
  displayName?: string;
}

/** Searches collection identities (users/groups) for the template-sharing picker. */
export class IdentityService {
  constructor(private api: ApiClient) {}

  async search(query: string): Promise<SharedUser[]> {
    const q = query.trim();
    if (!q) return [];
    const res = await this.api.get<{ value: RawIdentity[] }>(
      `/_apis/identities?searchFilter=General&filterValue=${encodeURIComponent(q)}&queryMembership=None&api-version=6.0`
    );
    return res.value.map((i) => ({ id: i.id, displayName: i.providerDisplayName ?? i.displayName ?? i.id }));
  }
}
