import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ExportMenu } from '../ExportMenu';
import { Table } from '../../models/types';

const table: Table = { columns: [], headers: ['ID'], rows: [[1]] };

describe('ExportMenu', () => {
  it('downloads a CSV file when CSV is clicked', () => {
    const download = jest.fn();
    const { getByText } = render(<ExportMenu table={table} baseName="backlog" download={download} />);
    fireEvent.click(getByText('Download CSV'));
    expect(download).toHaveBeenCalledTimes(1);
    const [filename, content] = download.mock.calls[0];
    expect(filename).toBe('backlog.csv');
    expect(content).toContain('ID');
  });

  it('downloads an xlsx blob when Excel is clicked', () => {
    const download = jest.fn();
    const { getByText } = render(<ExportMenu table={table} baseName="backlog" download={download} />);
    fireEvent.click(getByText('Download Excel'));
    const [filename, content] = download.mock.calls[0];
    expect(filename).toBe('backlog.xlsx');
    expect(content).toBeInstanceOf(Blob);
  });

  it('is disabled when there are no rows', () => {
    const empty: Table = { columns: [], headers: ['ID'], rows: [] };
    const { getByText } = render(<ExportMenu table={empty} baseName="x" download={jest.fn()} />);
    expect((getByText('Download CSV') as HTMLButtonElement).disabled).toBe(true);
  });
});
