import React from 'react';
import { render } from '@testing-library/react';
import { DataGrid } from '../DataGrid';
import { Table } from '../../models/types';

function makeTable(rowCount: number): Table {
  return {
    columns: [],
    headers: ['ID', 'Title'],
    rows: Array.from({ length: rowCount }, (_, i) => [i + 1, `Item ${i + 1}`]),
  };
}

describe('DataGrid', () => {
  it('renders headers and rows', () => {
    const { getByText, getAllByRole } = render(<DataGrid table={makeTable(3)} maxRows={500} />);
    expect(getByText('Title')).toBeTruthy();
    // 1 header row + 3 body rows
    expect(getAllByRole('row')).toHaveLength(4);
  });

  it('caps visible rows at maxRows and shows a truncation note', () => {
    const { getByText, getAllByRole } = render(<DataGrid table={makeTable(700)} maxRows={500} />);
    expect(getAllByRole('row')).toHaveLength(501); // header + 500
    expect(getByText(/showing 500 of 700/i)).toBeTruthy();
  });

  it('renders null cells as empty', () => {
    const table: Table = { columns: [], headers: ['A'], rows: [[null]] };
    const { container } = render(<DataGrid table={table} maxRows={500} />);
    const cell = container.querySelector('tbody td');
    expect(cell?.textContent).toBe('');
  });
});
