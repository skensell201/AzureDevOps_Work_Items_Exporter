# Work Items Export

A VSIX extension for **Azure DevOps Server 2022 (on-premises)** that downloads a team
backlog level or a saved query to **CSV** or **Excel**, with a configurable column set.

## Features

- Source: a team **backlog level** (Epics / Features / Stories) or an existing **saved query** (My/Shared).
- Pick any process field as a column (including custom fields), with search.
- Computed/online columns, not stored on the work item:
  - **Sum of `<field>`** rolled up over the descendant subtree, optionally **scoped to a work item type** (e.g. "Sum of Task Original Estimate", matching the native rollup columns). Rollup sums are opt-in — add the ones you need.
  - **Count of children** (all / closed).
  - **Parent**, **hierarchy path**, and **level**.
- Preview the table (first 500 rows); the file contains all rows.
- Export to CSV (UTF-8 BOM, formula-injection hardened) or Excel (.xlsx).
- **Templates**: save a source (backlog or query) + column set as a reusable template, then load it later in one click. The saved-query list is **refreshable** and expands deep folders.
- **Sharing**: share a template you own with other collection users; recipients see it in their own list (templates are owned-or-shared filtered per user).

> **Scopes (v1.1):** `vso.work`, `vso.project`, and `vso.identity` (the last for the
> template-sharing user search). Template storage uses the in-page Extension Data
> Service, which needs no extra manifest scope. Re-authorizing the extension is
> required after upgrading from v1.0. Note: `vso.extension_data` must NOT be declared
> — Azure DevOps Server rejects mixing it (a "modern" scope) with the uri-based
> `vso.*` scopes ("Cannot mix uri based and modern scopes").

## Install

Build the VSIX and upload it to your local collection gallery (`{server}/_gallery/manage`):

```bash
npm install
npm run package   # -> out/local.workitems-export-<version>.vsix
```

## Troubleshooting

- **"Failed to initialize … Error issuing session token: HostAuthorizationNotFound"** —
  this happens on Azure DevOps Server when the extension is *updated in place*: the host
  OAuth authorization isn't refreshed, so `getAccessToken()` fails. **Fix: fully uninstall
  the extension and install the new `.vsix` fresh** (don't update over the old one). A
  clean install re-creates the host authorization.
- **Old UI after a new build** — each build emits a content-hashed bundle, so a version
  bump + clean install always serves the latest code; no manual cache clearing needed.

## Known limitations (v1)

- Preview is capped at 500 rows (the downloaded file is not).
- Rollups follow hierarchy (Child) links only.
- "Closed child count" uses the process's real `Completed`-category states (locale-aware); if those states can't be read it falls back to a fixed English set (Closed / Done / Completed).
- Template sharing is "soft" privacy: visibility is filtered client-side from a collection-scoped store.
- Sharing targets individual users; sharing with a group does not expand to its members — add each person individually.
