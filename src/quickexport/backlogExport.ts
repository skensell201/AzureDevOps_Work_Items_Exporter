import { NamedRef } from '../models/types';
import { buildTable } from '../services/TableBuilder';
import { toCsv, toXlsxBlob } from '../services/ExportService';
import { quickExportColumns, emptyRollups } from './columns';

export interface ExportDeps {
  backlog: {
    getBacklogLevels(project: string, team: string): Promise<NamedRef[]>;
    getBacklogWorkItemIds(project: string, team: string, backlogId: string): Promise<number[]>;
  };
  workItems: {
    getFieldsBatch(project: string, ids: number[], fields: string[]): Promise<Map<number, Record<string, unknown>>>;
  };
}

export interface ExportRequest {
  project: string;
  team: string;
  level: string;
  format: 'csv' | 'excel';
}

export interface ExportPayload {
  filename: string;
  mime: string;
  data: string | Blob;
}

const CSV_MIME = 'text/csv;charset=utf-8';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function buildBacklogExport(deps: ExportDeps, req: ExportRequest): Promise<ExportPayload> {
  const levels = await deps.backlog.getBacklogLevels(req.project, req.team);
  const match = levels.find((l) => l.name.toLowerCase() === req.level.toLowerCase());
  if (!match) {
    const known = levels.map((l) => l.name).join(', ');
    throw new Error(`Backlog level "${req.level}" not found for team "${req.team}". Available: ${known}`);
  }

  const ids = await deps.backlog.getBacklogWorkItemIds(req.project, req.team, match.id);
  const columns = quickExportColumns();
  const fields = await deps.workItems.getFieldsBatch(
    req.project,
    ids,
    columns.map((c) => (c.kind === 'field' ? c.referenceName : '')).filter(Boolean)
  );
  const table = buildTable({ rowIds: ids, columns, fields, rollups: emptyRollups() });

  const base = `${req.team} - ${match.name}`;
  if (req.format === 'csv') {
    return { filename: `${base}.csv`, mime: CSV_MIME, data: toCsv(table) };
  }
  return { filename: `${base}.xlsx`, mime: XLSX_MIME, data: toXlsxBlob(table) };
}
