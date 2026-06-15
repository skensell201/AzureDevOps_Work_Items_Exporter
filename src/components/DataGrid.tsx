import React from 'react';
import { CellValue, Table } from '../models/types';

function text(c: CellValue): string {
  return c === null ? '' : String(c);
}

export function DataGrid({ table, maxRows = 500 }: { table: Table; maxRows?: number }): JSX.Element {
  const visible = table.rows.slice(0, maxRows);
  const truncated = table.rows.length > maxRows;
  return (
    <div className="grid-wrap">
      {truncated && (
        <div className="grid-note">
          Showing {maxRows} of {table.rows.length} rows — the downloaded file contains all {table.rows.length}.
        </div>
      )}
      <table className="data-grid">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci}>{text(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
