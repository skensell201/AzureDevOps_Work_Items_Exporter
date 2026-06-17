import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, ILocationService, IProjectPageService } from 'azure-devops-extension-api';
import { RestApiClient } from '../services/ApiClient';
import { BacklogService } from '../services/BacklogService';
import { WorkItemService } from '../services/WorkItemService';
import { buildBacklogExport } from './backlogExport';
import { parseBacklogRoute } from './route';

function triggerDownload(filename: string, data: string | Blob, mime: string): void {
  const blob = typeof data === 'string' ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function run(format: 'csv' | 'excel'): Promise<void> {
  const route = parseBacklogRoute(window.location.pathname);
  if (!route) {
    window.alert('Open a team Backlogs page first, then use Download from the right-click menu.');
    return;
  }
  const loc = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
  const baseUrl = (await loc.getServiceLocation()).replace(/\/$/, '');
  const token = await SDK.getAccessToken();
  const projectSvc = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
  const project = await projectSvc.getProject();
  if (!project) {
    window.alert('Could not determine the current project.');
    return;
  }

  const api = new RestApiClient(baseUrl, token);
  const deps = { backlog: new BacklogService(api), workItems: new WorkItemService(api) };
  try {
    const payload = await buildBacklogExport(deps, {
      project: project.name,
      team: route.team,
      level: route.level,
      format,
    });
    triggerDownload(payload.filename, payload.data, payload.mime);
  } catch (e) {
    window.alert(`Backlog export failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

SDK.init({ loaded: false });
SDK.ready().then(() => {
  SDK.register('backlog-export-csv', { execute: () => run('csv') });
  SDK.register('backlog-export-excel', { execute: () => run('excel') });
  SDK.notifyLoadSucceeded();
});
