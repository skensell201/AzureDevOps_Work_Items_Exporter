import React, { useMemo, useState } from 'react';
import { SharedUser, Template } from '../models/types';
import { ShareControl } from './ShareControl';

interface Props {
  templates: Template[];
  currentUserId: string;
  search: (q: string) => Promise<SharedUser[]>;
  onLoad: (t: Template) => void;
  onDelete: (t: Template) => void;
  onShareChange: (t: Template, users: SharedUser[]) => void;
  onClose: () => void;
}

type TypeFilter = 'all' | 'backlog' | 'query';

export function TemplatesManager(props: Props): JSX.Element {
  const [text, setText] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [sharingId, setSharingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    return props.templates.filter((t) => {
      if (type !== 'all' && t.source.kind !== type) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.source.label.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [props.templates, text, type]);

  return (
    <div className="tm-overlay" role="dialog" aria-label="Templates">
      <div className="tm-modal">
        <div className="tm-head">
          <b>
            Templates (
            {filtered.length === props.templates.length
              ? props.templates.length
              : `${filtered.length} of ${props.templates.length}`}
            )
          </b>
          <button onClick={props.onClose}>Close</button>
        </div>
        <div className="tm-filters">
          <input placeholder="Search templates…" value={text} onChange={(e) => setText(e.target.value)} />
          <label htmlFor="tm-type">Type</label>
          <select id="tm-type" value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
            <option value="all">All</option>
            <option value="backlog">Backlog</option>
            <option value="query">Query</option>
          </select>
        </div>
        <ul className="tm-list">
          {filtered.length === 0 && <li className="tm-empty">No templates match.</li>}
          {filtered.map((t) => {
            const owned = t.owner.id === props.currentUserId;
            return (
              <li key={t.id} className="tm-row">
                <div className="tm-main">
                  <span className="tm-name">{t.name}</span>
                  <span className={`tm-badge tm-${t.source.kind}`}>
                    {t.source.kind === 'backlog' ? 'Backlog' : 'Query'}
                  </span>
                  <span className="tm-src">{t.source.label}</span>
                  <span className="tm-owner">{owned ? 'you' : t.owner.displayName}</span>
                </div>
                {t.description && <div className="tm-desc">{t.description}</div>}
                <div className="tm-actions">
                  <button onClick={() => props.onLoad(t)}>Load</button>
                  {owned && (
                    <button onClick={() => setSharingId(sharingId === t.id ? null : t.id)}>Share</button>
                  )}
                  {owned && <button onClick={() => props.onDelete(t)}>Delete</button>}
                </div>
                {owned && sharingId === t.id && (
                  <ShareControl
                    sharedWith={t.sharedWith}
                    search={props.search}
                    onChange={(users) => props.onShareChange(t, users)}
                    onClose={() => setSharingId(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
