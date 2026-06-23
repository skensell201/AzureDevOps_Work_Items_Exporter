# Work Items Export

Download a team backlog level or a saved query to CSV/Excel with configurable columns — including computed rollup sums and work-item hierarchy.

## What it does
- Export a **team backlog level** (Epics / Features / Stories) or a **saved query** to **CSV** or **Excel**
- **Native tree view** with parent/child **hierarchy** and a **Work Item Type** selector for an exact level match
- **Configurable columns**, including computed **rollup sums** (type-scoped), child counts, parent, and hierarchy path
- **Native-style filters** that apply to the grid *and* the export ("download what you see")
- Save and **share reusable templates** (source + column set)
- Formula-injection-hardened CSV export (UTF-8 BOM); read-only by design

## Where to find it
- **Boards → Work Items Export**

## Compatibility
- Azure DevOps Server **2022** and **2020** (on-premises) — built and tested
- Loads on application version **17.0+** (`Microsoft.TeamFoundation.Server [17.0,)`), including Azure DevOps Server 2019
- Pure client-side (REST `api-version=6.0`, SDK-injected token); no server components

## Author
By **iksoftware**.
