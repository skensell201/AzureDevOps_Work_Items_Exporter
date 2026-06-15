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
    return this.store.setDocument(COLLECTION, t, SCOPE);
  }

  remove(id: string): Promise<void> {
    return this.store.deleteDocument(COLLECTION, id, SCOPE);
  }
}

/** Templates a user may see: owned by them or shared with them. */
export function visibleTemplates(all: Template[], userId: string): Template[] {
  return all.filter((t) => t.owner.id === userId || t.sharedWith.some((u) => u.id === userId));
}
