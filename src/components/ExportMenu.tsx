import React from 'react';
import { Table } from '../models/types';
import { toCsv, toXlsxBlob } from '../services/ExportService';

type Download = (filename: string, content: string | Blob) => void;

const defaultDownload: Download = (filename, content) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: 'text/csv;charset=utf-8' }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface Props {
  table: Table;
  baseName: string;
  download?: Download;
}

export function ExportMenu({ table, baseName, download = defaultDownload }: Props): JSX.Element {
  const disabled = table.rows.length === 0;
  return (
    <div className="export-menu">
      <button disabled={disabled} onClick={() => download(`${baseName}.csv`, toCsv(table))}>
        Download CSV
      </button>
      <button disabled={disabled} onClick={() => download(`${baseName}.xlsx`, toXlsxBlob(table))}>
        Download Excel
      </button>
    </div>
  );
}
