import { Template } from '../models/types';

export interface DocumentStore {
  getDocuments(collection: string, options?: unknown): Promise<Template[]>;
  setDocument(collection: string, doc: Template, options?: unknown): Promise<Template>;
  deleteDocument(collection: string, id: string, options?: unknown): Promise<void>;
}

const COLLECTION = 'templates';
const SCOPE = { scopeType: 'Default' };

/** Stores export templates in the extension's collection-scoped document store. */
export class TemplateService {
  constructor(private store: DocumentStore) {}

  async list(): Promise<Template[]> {
    try {
      return await this.store.getDocuments(COLLECTION, SCOPE);
    } catch {
      return []; // collection not created yet
    }
  }

  save(t: Template): Promise<Template> {
    // Drop the optimistic-concurrency tag so a save overwrites (last-write-wins),
    // avoiding "document version does not match" (1660003) when sharing/updating a
    // copy that is one version behind the server.
    const clean = { ...t } as Template & { __etag?: unknown };
    delete clean.__etag;
    return this.store.setDocument(COLLECTION, clean, SCOPE);
  }

  remove(id: string): Promise<void> {
    return this.store.deleteDocument(COLLECTION, id, SCOPE);
  }
}

/** Templates a user may see: owned by them or shared with them. */
export function visibleTemplates(all: Template[], userId: string): Template[] {
  return all.filter((t) => t.owner.id === userId || t.sharedWith.some((u) => u.id === userId));
}
