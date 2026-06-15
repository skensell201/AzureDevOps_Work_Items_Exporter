import React, { useState } from 'react';
import { SharedUser } from '../models/types';

interface Props {
  sharedWith: SharedUser[];
  search: (query: string) => Promise<SharedUser[]>;
  onChange: (users: SharedUser[]) => void;
  onClose: () => void;
}

export function ShareControl({ sharedWith, search, onChange, onClose }: Props): JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SharedUser[]>([]);
  const [busy, setBusy] = useState(false);

  async function doSearch(): Promise<void> {
    setBusy(true);
    try {
      setResults(await search(query));
    } finally {
      setBusy(false);
    }
  }

  function add(u: SharedUser): void {
    if (sharedWith.some((s) => s.id === u.id)) return;
    onChange([...sharedWith, u]);
  }
  function remove(u: SharedUser): void {
    onChange(sharedWith.filter((s) => s.id !== u.id));
  }

  return (
    <div className="share-control">
      <div className="share-head">
        <b>Shared with</b>
        <button onClick={onClose}>Close</button>
      </div>
      <ul className="share-list">
        {sharedWith.map((u) => (
          <li key={u.id}>
            {u.displayName} <button title="Remove" onClick={() => remove(u)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="share-search">
        <input placeholder="Search people…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button disabled={busy} onClick={() => void doSearch()}>Search</button>
      </div>
      <ul className="share-results">
        {results.map((u) => (
          <li key={u.id}>
            <button onClick={() => add(u)}>{u.displayName}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
