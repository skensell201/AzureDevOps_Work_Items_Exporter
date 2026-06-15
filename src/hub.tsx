import 'azure-devops-ui/Core/override.css';
import './hub.css';
import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, ILocationService, IExtensionDataService } from 'azure-devops-extension-api';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Column, FieldDef, NamedRef, QueryNode, Table, Template, TemplateSource, SharedUser } from './models/types';
import { RestApiClient, ApiError } from './services/ApiClient';
import { ProjectService } from './services/ProjectService';
import { BacklogService } from './services/BacklogService';
import { QueryService } from './services/QueryService';
import { WorkItemService } from './services/WorkItemService';
import { StateService } from './services/StateService';
import { FieldService } from './services/FieldService';
import { ExportOrchestrator } from './services/ExportOrchestrator';
import { IdentityService } from './services/IdentityService';
import { TemplateService, visibleTemplates, DocumentStore } from './services/TemplateService';
import { SourcePicker, Selection } from './components/SourcePicker';
import { ColumnPicker } from './components/ColumnPicker';
import { DataGrid } from './components/DataGrid';
import { ExportMenu } from './components/ExportMenu';
import { ProgressBar } from './components/ProgressBar';
import { TemplatesPanel } from './components/TemplatesPanel';
import { ShareControl } from './components/ShareControl';

interface Services {
  projects: ProjectService;
  backlog: BacklogService;
  query: QueryService;
  workItems: WorkItemService;
  fieldSvc: FieldService;
  orchestrator: ExportOrchestrator;
  identity: IdentityService;
  templatesSvc: TemplateService;
  me: SharedUser;
}

const EMPTY_SELECTION: Selection = { tab: 'backlog', project: '', team: '', level: '', query: '' };

function nameOf(refs: NamedRef[], id: string): string {
  return refs.find((r) => r.id === id)?.name ?? id;
}

/** Finds a leaf query's display name anywhere in the tree (fallback to id). */
function queryNameOf(nodes: QueryNode[], id: string): string {
  for (const n of nodes) {
    if (n.id === id) return n.name;
    const found = queryNameOf(n.children, id);
    if (found !== id) return found;
  }
  return id;
}

function App({ services }: { services: Services }): JSX.Element {
  const [projects, setProjects] = useState<NamedRef[]>([]);
  const [teams, setTeams] = useState<NamedRef[]>([]);
  const [levels, setLevels] = useState<NamedRef[]>([]);
  const [queryTree, setQueryTree] = useState<QueryNode[]>([]);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [columns, setColumns] = useState<Column[]>(FieldService.defaultColumns());
  const [table, setTable] = useState<Table | null>(null);
  const [baseName, setBaseName] = useState('work-items');
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastLoad, setLastLoad] = useState<(() => Promise<void>) | null>(null);

  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [lastSource, setLastSource] = useState<TemplateSource | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sharing, setSharing] = useState<Template | null>(null);

  const canSave = lastSource !== null;
  const visible = visibleTemplates(templates, services.me.id);

  useEffect(() => {
    void (async () => {
      try {
        setProjects(await services.projects.getProjects());
        setFields(await services.fieldSvc.getFields());
        setTemplates(await services.templatesSvc.list());
      } catch (e) {
        setError(describeError(e));
      }
    })();
  }, [services]);

  async function reloadTemplates(): Promise<void> {
    setTemplates(await services.templatesSvc.list());
  }

  async function onProjectSelected(projectId: string): Promise<void> {
    if (!projectId) return;
    try {
      setTeams(await services.projects.getTeams(projectId));
      setQueryTree(await services.query.getQueryTree(projectId));
    } catch (e) {
      setError(describeError(e));
    }
  }

  async function onTeamSelected(projectId: string, teamId: string): Promise<void> {
    if (!projectId || !teamId) return;
    try {
      setLevels(await services.backlog.getBacklogLevels(projectId, teamId));
    } catch (e) {
      setError(describeError(e));
    }
  }

  async function onRefreshQueries(): Promise<void> {
    if (!selection.project) return;
    try {
      setQueryTree(await services.query.getQueryTree(selection.project));
    } catch (e) {
      setError(describeError(e));
    }
  }

  /** Controlled-selection sink; re-fetches the query tree when switching to the Query tab. */
  function handleSelectionChange(next: Selection): void {
    setSelection(next);
    if (next.tab === 'query' && next.project) {
      void onRefreshQueries();
    }
  }

  async function run(name: string, fn: () => Promise<{ table: Table; warnings: string[] }>): Promise<void> {
    setError(null);
    setWarnings([]);
    setProgress('Loading…');
    try {
      const { table: t, warnings: w } = await fn();
      setTable(t);
      setWarnings(w);
      setBaseName(name);
    } catch (e) {
      setTable(null);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setError('You do not have permission to read these work items.');
      } else {
        setError(describeError(e));
      }
    } finally {
      setProgress(null);
    }
  }

  function loadBacklog(project: string, team: string, backlogId: string): void {
    const cols = columns;
    const fn = (): Promise<void> =>
      run(`backlog-${backlogId}`, () => services.orchestrator.buildBacklogTable(project, team, backlogId, cols));
    setLastLoad(() => fn);
    setLastSource({
      kind: 'backlog',
      project,
      team,
      backlogId,
      label: `${nameOf(projects, project)} / ${nameOf(teams, team)} / ${nameOf(levels, backlogId)}`,
    });
    void fn();
  }

  function loadQuery(project: string, queryId: string): void {
    const cols = columns;
    const fn = (): Promise<void> =>
      run(`query-${queryId}`, () => services.orchestrator.buildQueryTable(project, queryId, cols));
    setLastLoad(() => fn);
    setLastSource({
      kind: 'query',
      project,
      queryId,
      label: `${nameOf(projects, project)} / ${queryNameOf(queryTree, queryId)}`,
    });
    void fn();
  }

  async function onSaveTemplate(name: string): Promise<void> {
    if (!lastSource) return;
    const t: Template = {
      id: `${services.me.id}.${Date.now()}`,
      name,
      source: lastSource,
      columns,
      owner: services.me,
      sharedWith: [],
    };
    try {
      await services.templatesSvc.save(t);
      await reloadTemplates();
    } catch (e) {
      setError(describeError(e));
    }
  }

  async function onLoadTemplate(t: Template): Promise<void> {
    const s = t.source;
    try {
      // Restore the column set first so a subsequent load uses it.
      setColumns(t.columns);
      if (s.kind === 'backlog') {
        setSelection({ tab: 'backlog', project: s.project, team: s.team ?? '', level: s.backlogId ?? '', query: '' });
        const fetchedTeams = await services.projects.getTeams(s.project);
        setTeams(fetchedTeams);
        setQueryTree(await services.query.getQueryTree(s.project));
        const fetchedLevels = s.team ? await services.backlog.getBacklogLevels(s.project, s.team) : levels;
        setLevels(fetchedLevels);
        const cols = t.columns;
        const fn = (): Promise<void> =>
          run(`backlog-${s.backlogId}`, () =>
            services.orchestrator.buildBacklogTable(s.project, s.team ?? '', s.backlogId ?? '', cols)
          );
        setLastLoad(() => fn);
        setLastSource({
          kind: 'backlog',
          project: s.project,
          team: s.team,
          backlogId: s.backlogId,
          label: `${nameOf(projects, s.project)} / ${nameOf(fetchedTeams, s.team ?? '')} / ${nameOf(fetchedLevels, s.backlogId ?? '')}`,
        });
        void fn();
      } else {
        setSelection({ tab: 'query', project: s.project, team: '', level: '', query: s.queryId ?? '' });
        setTeams(await services.projects.getTeams(s.project));
        const fetchedTree = await services.query.getQueryTree(s.project);
        setQueryTree(fetchedTree);
        const cols = t.columns;
        const fn = (): Promise<void> =>
          run(`query-${s.queryId}`, () => services.orchestrator.buildQueryTable(s.project, s.queryId ?? '', cols));
        setLastLoad(() => fn);
        setLastSource({
          kind: 'query',
          project: s.project,
          queryId: s.queryId,
          label: `${nameOf(projects, s.project)} / ${queryNameOf(fetchedTree, s.queryId ?? '')}`,
        });
        void fn();
      }
    } catch (e) {
      setError(describeError(e));
    }
  }

  async function onDeleteTemplate(t: Template): Promise<void> {
    try {
      await services.templatesSvc.remove(t.id);
      await reloadTemplates();
    } catch (e) {
      setError(describeError(e));
    }
  }

  async function onShareChange(t: Template, users: SharedUser[]): Promise<void> {
    try {
      const updated: Template = { ...t, sharedWith: users };
      await services.templatesSvc.save(updated);
      setSharing(updated);
      await reloadTemplates();
    } catch (e) {
      setError(describeError(e));
    }
  }

  return (
    <div>
      <h2>Work Items Export</h2>
      <div className="layout">
        <div className="sidebar">
          <SourcePicker
            projects={projects}
            teams={teams}
            levels={levels}
            queryTree={queryTree}
            value={selection}
            onChange={handleSelectionChange}
            onProjectSelected={(p) => void onProjectSelected(p)}
            onTeamSelected={(p, t) => void onTeamSelected(p, t)}
            onRefreshQueries={() => void onRefreshQueries()}
            onLoadBacklog={loadBacklog}
            onLoadQuery={loadQuery}
          />
          <ColumnPicker fields={fields} value={columns} onChange={setColumns} />
          {lastLoad && (
            <button onClick={() => void lastLoad()} disabled={progress !== null}>
              Apply columns / reload
            </button>
          )}
          <TemplatesPanel
            templates={visible}
            currentUserId={services.me.id}
            canSave={canSave}
            onSave={(name) => void onSaveTemplate(name)}
            onLoad={(t) => void onLoadTemplate(t)}
            onDelete={(t) => void onDeleteTemplate(t)}
            onShare={(t) => setSharing(t)}
          />
          {sharing && (
            <ShareControl
              sharedWith={sharing.sharedWith}
              search={(q) => services.identity.search(q)}
              onChange={(users) => void onShareChange(sharing, users)}
              onClose={() => setSharing(null)}
            />
          )}
        </div>
        <div className="main">
          <ProgressBar step={progress} />
          {error && <div className="error-box">{error}</div>}
          {warnings.length > 0 && (
            <div className="warnings">
              {warnings.map((w, i) => (
                <div key={i}>&#9888; {w}</div>
              ))}
            </div>
          )}
          {table && (
            <>
              <ExportMenu table={table} baseName={baseName} />
              <DataGrid table={table} maxRows={500} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

async function start(): Promise<void> {
  await SDK.init();
  await SDK.ready();
  const loc = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
  const baseUrl = (await loc.getServiceLocation()).replace(/\/$/, '');
  const token = await SDK.getAccessToken();
  const api = new RestApiClient(baseUrl, token);
  const projects = new ProjectService(api);
  const backlog = new BacklogService(api);
  const query = new QueryService(api);
  const workItems = new WorkItemService(api);
  const fieldSvc = new FieldService(api);
  const states = new StateService(api);
  const orchestrator = new ExportOrchestrator({ backlog, query, workItems, states });
  const identity = new IdentityService(api);
  const dataSvc = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
  const dataManager = await dataSvc.getExtensionDataManager(SDK.getExtensionContext().id, token);
  const templatesSvc = new TemplateService(dataManager as unknown as DocumentStore);
  const user = SDK.getUser();
  const me: SharedUser = { id: user.id, displayName: user.displayName };
  ReactDOM.render(
    <App
      services={{ projects, backlog, query, workItems, fieldSvc, orchestrator, identity, templatesSvc, me }}
    />,
    document.getElementById('root')
  );
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Work Items Export init failed:', e);
  const root = document.getElementById('root');
  if (root) {
    root.textContent = `Failed to initialize Work Items Export: ${e instanceof Error ? e.message : String(e)}`;
    root.className = 'error-box';
  }
});
