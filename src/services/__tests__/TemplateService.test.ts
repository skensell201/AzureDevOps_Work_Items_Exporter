import { TemplateService, visibleTemplates } from '../TemplateService';
import { Template } from '../../models/types';

function tpl(id: string, ownerId: string, sharedIds: string[] = []): Template {
  return {
    id,
    name: id,
    source: { kind: 'query', project: 'P', queryId: 'q', label: 'P / q' },
    columns: [],
    owner: { id: ownerId, displayName: ownerId },
    sharedWith: sharedIds.map((s) => ({ id: s, displayName: s })),
  };
}

describe('TemplateService', () => {
  it('lists documents from the Default-scoped templates collection', async () => {
    const getDocuments = jest.fn().mockResolvedValue([tpl('a', 'u1')]);
    const svc = new TemplateService({ getDocuments, setDocument: jest.fn(), deleteDocument: jest.fn() });
    expect(await svc.list()).toHaveLength(1);
    expect(getDocuments).toHaveBeenCalledWith('templates', { scopeType: 'Default' });
  });

  it('returns [] when the collection does not exist yet (getDocuments throws)', async () => {
    const svc = new TemplateService({
      getDocuments: jest.fn().mockRejectedValue(new Error('404')),
      setDocument: jest.fn(),
      deleteDocument: jest.fn(),
    });
    expect(await svc.list()).toEqual([]);
  });

  it('saves and deletes with the Default scope', async () => {
    const setDocument = jest.fn().mockImplementation((_c, d) => Promise.resolve(d));
    const deleteDocument = jest.fn().mockResolvedValue(undefined);
    const svc = new TemplateService({ getDocuments: jest.fn(), setDocument, deleteDocument });
    const t = tpl('a', 'u1');
    await svc.save(t);
    await svc.remove('a');
    expect(setDocument).toHaveBeenCalledWith('templates', t, { scopeType: 'Default' });
    expect(deleteDocument).toHaveBeenCalledWith('templates', 'a', { scopeType: 'Default' });
  });

  it('strips __etag before saving so writes overwrite (avoids 1660003 conflicts)', async () => {
    const setDocument = jest.fn().mockImplementation((_c, d) => Promise.resolve(d));
    const svc = new TemplateService({ getDocuments: jest.fn(), setDocument, deleteDocument: jest.fn() });
    const stale = { ...tpl('a', 'u1'), __etag: '7' } as unknown as Template;
    await svc.save(stale);
    const sentDoc = setDocument.mock.calls[0][1];
    expect('__etag' in sentDoc).toBe(false);
    expect(sentDoc.id).toBe('a');
  });
});

describe('visibleTemplates', () => {
  it('returns templates owned by or shared with the user', () => {
    const all = [tpl('a', 'me'), tpl('b', 'other'), tpl('c', 'other', ['me'])];
    expect(visibleTemplates(all, 'me').map((t) => t.id)).toEqual(['a', 'c']);
  });
});
