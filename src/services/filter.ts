import { Table } from '../models/types';

export interface Filters {
  text: string;
  byHeader: Record<string, string>; // column header -> selected value ('' = all)
}

export const EMPTY_FILTERS: Filters = { text: '', byHeader: {} };

const FILTERABLE = ['Work Item Type', 'State', 'Value Area', 'Iteration Path', 'Tags', 'Assigned To'];

export interface FilterCol {
  header: string;
  index: number;
}

function cellText(c: unknown): string {
  return c === null || c === undefined ? '' : String(c);
}

function tagTokens(cell: string): string[] {
  return cell.split(/[;,]/).map((t) => t.trim()).filter(Boolean);
}

/** Filterable columns that are actually present in the table, with their column index. */
export function filterableColumns(table: Table): FilterCol[] {
  return FILTERABLE.map((header) => ({ header, index: table.headers.indexOf(header) })).filter((c) => c.index >= 0);
}

/** Sorted distinct values for a column (Tags are split into individual tokens). */
export function distinctValues(table: Table, col: FilterCol): string[] {
  const set = new Set<string>();
  for (const row of table.rows) {
    const raw = cellText(row[col.index]);
    if (col.header === 'Tags') tagTokens(raw).forEach((t) => set.add(t));
    else {
      const v = raw.trim();
      if (v) set.add(v);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Filters rows by free text (any cell) AND each active per-column selection. */
export function applyFilters(table: Table, filters: Filters): Table {
  const text = filters.text.trim().toLowerCase();
  const active = filterableColumns(table)
    .map((c) => ({ ...c, value: filters.byHeader[c.header] }))
    .filter((c) => c.value);
  const rows = table.rows.filter((row) => {
    if (text && !row.some((cell) => cellText(cell).toLowerCase().includes(text))) return false;
    for (const f of active) {
      const cell = cellText(row[f.index]);
      if (f.header === 'Tags') {
        if (!tagTokens(cell).includes(f.value)) return false;
      } else if (cell !== f.value) {
        return false;
      }
    }
    return true;
  });
  return { ...table, rows };
}
