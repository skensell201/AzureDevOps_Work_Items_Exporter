import 'azure-devops-ui/Core/override.css';
import './hub.css';
import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, ILocationService } from 'azure-devops-extension-api';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Column, FieldDef, NamedRef, QueryNode, Table } from './models/types';
import { RestApiClient, ApiError } from './services/ApiClient';
import { ProjectService } from './services/ProjectService';
import { BacklogService } from './services/BacklogService';
import { QueryService } from './services/QueryService';
import { WorkItemService } from './services/WorkItemService';
import { StateService } from './services/StateService';
import { FieldService } from './services/FieldService';
import { ExportOrchestrator } from './services/ExportOrchestrator';
import { SourcePicker } from './components/SourcePicker';
import { ColumnPicker } from './components/ColumnPicker';
import { DataGrid } from './components/DataGrid';
import { ExportMenu } from './components/ExportMenu';
import { ProgressBar } from './components/ProgressBar';

interface Services {
  projects: ProjectService;
  backlog: BacklogService;
  query: QueryService;
  workItems: WorkItemService;
  fieldSvc: FieldService;
  orchestrator: ExportOrchestrator;
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

  useEffect(() => {
    void (async () => {
      try {
        setProjects(await services.projects.getProjects());
        setFields(await services.fieldSvc.getFields());
      } catch (e) {
        setError(describeError(e));
      }
    })();
  }, [services]);

  async function onProjectChange(projectId: string): Promise<void> {
    if (!projectId) return;
    try {
      setTeams(await services.projects.getTeams(projectId));
      setQueryTree(await services.query.getQueryTree(projectId));
    } catch (e) {
      setError(describeError(e));
    }
  }

  async function onTeamChange(projectId: string, teamId: string): Promise<void> {
    if (!projectId || !teamId) return;
    try {
      setLevels(await services.backlog.getBacklogLevels(projectId, teamId));
    } catch (e) {
      setError(describeError(e));
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
    const fn = (): Promise<void> =>
      run(`backlog-${backlogId}`, () => services.orchestrator.buildBacklogTable(project, team, backlogId, columns));
    setLastLoad(() => fn);
    void fn();
  }

  function loadQuery(project: string, queryId: string): void {
    const fn = (): Promise<void> =>
      run(`query-${queryId}`, () => services.orchestrator.buildQueryTable(project, queryId, columns));
    setLastLoad(() => fn);
    void fn();
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
            onProjectChange={(p) => void onProjectChange(p)}
            onTeamChange={(p, t) => void onTeamChange(p, t)}
            onLoadBacklog={loadBacklog}
            onLoadQuery={loadQuery}
          />
          <ColumnPicker fields={fields} value={columns} onChange={setColumns} />
          {lastLoad && (
            <button onClick={() => void lastLoad()} disabled={progress !== null}>
              Apply columns / reload
            </button>
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
  ReactDOM.render(
    <App services={{ projects, backlog, query, workItems, fieldSvc, orchestrator }} />,
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
