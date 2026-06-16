import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { FilterBar } from '../FilterBar';
import { EMPTY_FILTERS } from '../../services/filter';
import { Table } from '../../models/types';

const table: Table = {
  columns: [],
  headers: ['ID', 'State', 'Value Area'],
  rows: [
    [1, 'Active', 'Dev'],
    [2, 'Resolved', 'Business'],
  ],
};

describe('FilterBar', () => {
  it('emits text changes', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(<FilterBar table={table} filters={EMPTY_FILTERS} onChange={onChange} />);
    fireEvent.change(getByPlaceholderText('Filter text…'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalledWith({ text: 'abc', byHeader: {} });
  });

  it('renders a dropdown per filterable column with distinct values', () => {
    const { getByLabelText } = render(<FilterBar table={table} filters={EMPTY_FILTERS} onChange={jest.fn()} />);
    const state = getByLabelText('State') as HTMLSelectElement;
    expect([...state.options].map((o) => o.value)).toEqual(['', 'Active', 'Resolved']);
    expect(getByLabelText('Value Area')).toBeTruthy();
  });

  it('emits a field selection', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<FilterBar table={table} filters={EMPTY_FILTERS} onChange={onChange} />);
    fireEvent.change(getByLabelText('State'), { target: { value: 'Active' } });
    expect(onChange).toHaveBeenCalledWith({ text: '', byHeader: { State: 'Active' } });
  });

  it('clears all filters', () => {
    const onChange = jest.fn();
    const filters = { text: 'x', byHeader: { State: 'Active' } };
    const { getByText } = render(<FilterBar table={table} filters={filters} onChange={onChange} />);
    fireEvent.click(getByText('Clear'));
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
  });
});
