# Work Items Export

A VSIX extension for **Azure DevOps Server 2022 (on-premises)** that downloads a team
backlog level or a saved query to **CSV** or **Excel**, with a configurable column set.

## Features

- Source: a team **backlog level** (Epics / Features / Stories) or an existing **saved query** (My/Shared).
- Pick any process field as a column (including custom fields), with search.
- Computed/online columns, not stored on the work item:
  - **Sum of `<field>`** rolled up over the whole descendant subtree (default: Sum of Effort, Sum of Original Estimate).
  - **Count of children** (all / closed).
  - **Parent**, **hierarchy path**, and **level**.
- Preview the table (first 500 rows); the file contains all rows.
- Export to CSV (UTF-8 BOM, formula-injection hardened) or Excel (.xlsx).
- **Templates**: save a source (backlog or query) + column set as a reusable template, then load it later in one click. The saved-query list is **refreshable** and expands deep folders.
- **Sharing**: share a template you own with other collection users; recipients see it in their own list (templates are owned-or-shared filtered per user).

> **Scopes (v1.1):** Templates and sharing require the additional scopes
> `vso.extension_data` (to store templates in the extension's collection-scoped
> document store) and `vso.identity` (to search users for sharing), alongside the
> existing `vso.work` and `vso.project`. Re-authorizing the extension is required
> after upgrading from v1.0.

## Install

Build the VSIX and upload it to your local collection gallery (`{server}/_gallery/manage`):

```bash
npm install
npm run package   # -> out/local.workitems-export-<version>.vsix
```

## Known limitations (v1)

- Preview is capped at 500 rows (the downloaded file is not).
- Rollups follow hierarchy (Child) links only.
- Closed-state detection uses a fixed set (Closed / Done / Completed).
- Template sharing is "soft" privacy: visibility is filtered client-side from a collection-scoped store.
