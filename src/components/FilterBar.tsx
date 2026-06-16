import React from 'react';
import { Table } from '../models/types';
import { Filters, EMPTY_FILTERS, filterableColumns, distinctValues } from '../services/filter';

interface Props {
  table: Table;
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function FilterBar({ table, filters, onChange }: Props): JSX.Element {
  const cols = filterableColumns(table);
  function setField(header: string, value: string): void {
    onChange({ ...filters, byHeader: { ...filters.byHeader, [header]: value } });
  }
  return (
    <div className="filter-bar">
      <input
        placeholder="Filter text…"
        value={filters.text}
        onChange={(e) => onChange({ ...filters, text: e.target.value })}
      />
      {cols.map((c) => (
        <span className="filter-field" key={c.header}>
          <label htmlFor={`flt-${c.header}`}>{c.header}</label>
          <select
            id={`flt-${c.header}`}
            value={filters.byHeader[c.header] ?? ''}
            onChange={(e) => setField(c.header, e.target.value)}
          >
            <option value="">All</option>
            {distinctValues(table, c).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </span>
      ))}
      <button onClick={() => onChange(EMPTY_FILTERS)}>Clear</button>
    </div>
  );
}
