import * as SDK from 'azure-devops-extension-sdk';

interface ActionContext {
  id?: number;
  workItemIds?: number[];
  columns?: string[];
  [k: string]: unknown;
}

async function spike(name: string, actionContext: ActionContext): Promise<void> {
  // Spike only: surface everything we might use so we can confirm it on the real server.
  const info = {
    handler: name,
    path: window.location.pathname,
    actionContext,
  };
  // eslint-disable-next-line no-alert
  window.alert(JSON.stringify(info, null, 2));
}

SDK.init({ loaded: false });
SDK.ready().then(() => {
  SDK.register('backlog-export-csv', { execute: (ctx: ActionContext) => spike('csv', ctx) });
  SDK.register('backlog-export-excel', { execute: (ctx: ActionContext) => spike('excel', ctx) });
  SDK.notifyLoadSucceeded();
});
