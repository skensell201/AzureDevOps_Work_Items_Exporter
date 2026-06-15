import React, { useState } from 'react';
import { Template } from '../models/types';

interface Props {
  templates: Template[];
  currentUserId: string;
  canSave: boolean;
  onSave: (name: string) => void;
  onLoad: (t: Template) => void;
  onDelete: (t: Template) => void;
  onShare: (t: Template) => void;
}

export function TemplatesPanel(props: Props): JSX.Element {
  const [name, setName] = useState('');

  function save(): void {
    const n = name.trim();
    if (!n) return;
    props.onSave(n);
    setName('');
  }

  return (
    <div className="templates-panel">
      <div className="template-save">
        <input placeholder="Template name…" value={name} onChange={(e) => setName(e.target.value)} />
        <button disabled={!props.canSave || !name.trim()} onClick={save}>
          Save template
        </button>
      </div>
      {!props.canSave && <div className="template-hint">Load a backlog or query first to save its setup.</div>}
      <ul className="template-list">
        {props.templates.map((t) => {
          const owned = t.owner.id === props.currentUserId;
          return (
            <li key={t.id}>
              <span className="template-name" title={t.source.label}>
                {t.name}
              </span>
              <span className="template-meta">{t.source.kind === 'backlog' ? 'Backlog' : 'Query'} · {t.source.label}</span>
              <span className="template-actions">
                <button onClick={() => props.onLoad(t)}>Load</button>
                {owned && <button onClick={() => props.onShare(t)}>Share</button>}
                {owned && <button onClick={() => props.onDelete(t)}>Delete</button>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
