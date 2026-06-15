import React, { useState } from 'react';
import { NamedRef, QueryNode } from '../models/types';

interface Props {
  projects: NamedRef[];
  teams: NamedRef[];
  levels: NamedRef[];
  queryTree: QueryNode[];
  onProjectChange: (projectId: string) => void;
  onTeamChange: (projectId: string, teamId: string) => void;
  onLoadBacklog: (project: string, team: string, backlogId: string) => void;
  onLoadQuery: (project: string, queryId: string) => void;
}

/** Flattens the query tree into selectable leaf queries with indented labels. */
function leafQueries(nodes: QueryNode[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of nodes) {
    if (n.isFolder) out.push(...leafQueries(n.children, depth + 1));
    else out.push({ id: n.id, label: `${'  '.repeat(depth)}${n.name}` });
  }
  return out;
}

export function SourcePicker(props: Props): JSX.Element {
  const [tab, setTab] = useState<'backlog' | 'query'>('backlog');
  const [project, setProject] = useState('');
  const [team, setTeam] = useState('');
  const [level, setLevel] = useState('');
  const [query, setQuery] = useState('');

  function changeProject(value: string): void {
    setProject(value);
    props.onProjectChange(value);
  }
  function changeTeam(value: string): void {
    setTeam(value);
    props.onTeamChange(project, value);
  }

  return (
    <div className="source-picker">
      <div className="tabs">
        <button className={tab === 'backlog' ? 'active' : ''} onClick={() => setTab('backlog')}>
          Backlog
        </button>
        <button className={tab === 'query' ? 'active' : ''} onClick={() => setTab('query')}>
          Query
        </button>
      </div>

      <label htmlFor="project">Project</label>
      <select id="project" value={project} onChange={(e) => changeProject(e.target.value)}>
        <option value="">Select project…</option>
        {props.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {tab === 'backlog' ? (
        <>
          <label htmlFor="team">Team</label>
          <select id="team" value={team} onChange={(e) => changeTeam(e.target.value)}>
            <option value="">Select team…</option>
            {props.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <label htmlFor="level">Backlog level</label>
          <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Select level…</option>
            {props.levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button disabled={!project || !team || !level} onClick={() => props.onLoadBacklog(project, team, level)}>
            Load backlog
          </button>
        </>
      ) : (
        <>
          <label htmlFor="query">Query</label>
          <select id="query" value={query} onChange={(e) => setQuery(e.target.value)}>
            <option value="">Select query…</option>
            {leafQueries(props.queryTree).map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
          <button disabled={!project || !query} onClick={() => props.onLoadQuery(project, query)}>
            Load query
          </button>
        </>
      )}
    </div>
  );
}
