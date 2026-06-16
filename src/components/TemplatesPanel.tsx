import React, { useState } from 'react';

interface Props {
  count: number;
  canSave: boolean;
  onSave: (name: string, description: string) => void;
  onOpenManager: () => void;
}

export function TemplatesPanel({ count, canSave, onSave, onOpenManager }: Props): JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function save(): void {
    const n = name.trim();
    if (!n) return;
    onSave(n, description.trim());
    setName('');
    setDescription('');
  }

  return (
    <div className="templates-panel">
      <div className="template-save">
        <input placeholder="Template name…" value={name} onChange={(e) => setName(e.target.value)} />
        <button disabled={!canSave || !name.trim()} onClick={save}>
          Save template
        </button>
      </div>
      <input
        className="template-desc"
        placeholder="Description (optional)…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {!canSave && <div className="template-hint">Load a backlog or query first to save its setup.</div>}
      <button className="tm-open" onClick={onOpenManager}>
        Templates ({count})
      </button>
    </div>
  );
}
