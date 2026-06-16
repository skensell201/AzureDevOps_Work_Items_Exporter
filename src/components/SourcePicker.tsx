import React from 'react';
import { NamedRef, QueryNode } from '../models/types';

export interface Selection {
  tab: 'backlog' | 'query';
  project: string;
  team: string;
  level: string;
  query: string;
  itemType: string;
}

interface Props {
  projects: NamedRef[];
  teams: NamedRef[];
  levels: NamedRef[];
  queryTree: QueryNode[];
  types?: string[];
  value: Selection;
  onChange: (s: Selection) => void;
  onProjectSelected: (projectId: string) => void;
  onTeamSelected: (projectId: string, teamId: string) => void;
  onRefreshQueries: () => void;
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
  const v = props.value;

  function changeProject(project: string): void {
    props.onChange({ ...v, project, team: '', level: '', query: '', itemType: '' });
    props.onProjectSelected(project);
  }
  function changeTeam(team: string): void {
    props.onChange({ ...v, team, level: '' });
    props.onTeamSelected(v.project, team);
  }

  return (
    <div className="source-picker">
      <div className="tabs">
        <button className={v.tab === 'backlog' ? 'active' : ''} onClick={() => props.onChange({ ...v, tab: 'backlog' })}>
          Backlog
        </button>
        <button className={v.tab === 'query' ? 'active' : ''} onClick={() => props.onChange({ ...v, tab: 'query' })}>
          Query
        </button>
      </div>

      <label htmlFor="project">Project</label>
      <select id="project" value={v.project} onChange={(e) => changeProject(e.target.value)}>
        <option value="">Select project…</option>
        {props.projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {v.tab === 'backlog' ? (
        <>
          <label htmlFor="team">Team</label>
          <select id="team" value={v.team} onChange={(e) => changeTeam(e.target.value)}>
            <option value="">Select team…</option>
            {props.teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <label htmlFor="level">Backlog level</label>
          <select id="level" value={v.level} onChange={(e) => props.onChange({ ...v, level: e.target.value })}>
            <option value="">Select level…</option>
            {props.levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <label htmlFor="itemType">Work Item Type</label>
          <select id="itemType" value={v.itemType} onChange={(e) => props.onChange({ ...v, itemType: e.target.value })}>
            <option value="">All types</option>
            {(props.types ?? []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button disabled={!v.project || !v.team || !v.level} onClick={() => props.onLoadBacklog(v.project, v.team, v.level)}>
            Load backlog
          </button>
        </>
      ) : (
        <>
          <div className="query-row">
            <label htmlFor="query">Query</label>
            <select id="query" value={v.query} onChange={(e) => props.onChange({ ...v, query: e.target.value })}>
              <option value="">Select query…</option>
              {leafQueries(props.queryTree).map((q) => (
                <option key={q.id} value={q.id}>{q.label}</option>
              ))}
            </select>
            <button type="button" title="Refresh queries" onClick={() => props.onRefreshQueries()}>↻</button>
          </div>
          <button disabled={!v.project || !v.query} onClick={() => props.onLoadQuery(v.project, v.query)}>
            Load query
          </button>
        </>
      )}
    </div>
  );
}
