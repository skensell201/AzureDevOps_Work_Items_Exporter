import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ColumnPicker } from '../ColumnPicker';
import { Column, FieldDef } from '../../models/types';

const fields: FieldDef[] = [
  { referenceName: 'System.Title', name: 'Title', type: 'string' },
  { referenceName: 'System.State', name: 'State', type: 'string' },
  { referenceName: 'Microsoft.VSTS.Scheduling.Effort', name: 'Effort', type: 'double' },
];

describe('ColumnPicker', () => {
  it('checks fields already present in value and toggles them off', () => {
    const value: Column[] = [{ kind: 'field', referenceName: 'System.Title', header: 'Title' }];
    const onChange = jest.fn();
    const { getByLabelText } = render(<ColumnPicker fields={fields} value={value} onChange={onChange} />);
    const title = getByLabelText('Title') as HTMLInputElement;
    expect(title.checked).toBe(true);
    fireEvent.click(title);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('adds an unchecked field as a field column', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<ColumnPicker fields={fields} value={[]} onChange={onChange} />);
    fireEvent.click(getByLabelText('State'));
    expect(onChange).toHaveBeenCalledWith([{ kind: 'field', referenceName: 'System.State', header: 'State' }]);
  });

  it('adds a "Sum of <numeric field>" column', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByText } = render(<ColumnPicker fields={fields} value={[]} onChange={onChange} />);
    fireEvent.change(getByLabelText('Add rollup sum of'), { target: { value: 'Microsoft.VSTS.Scheduling.Effort' } });
    fireEvent.click(getByText('Add sum column'));
    expect(onChange).toHaveBeenCalledWith([
      { kind: 'rollupSum', field: 'Microsoft.VSTS.Scheduling.Effort', header: 'Sum of Effort' },
    ]);
  });

  it('filters the field list by the search box', () => {
    const { getByPlaceholderText, queryByLabelText } = render(<ColumnPicker fields={fields} value={[]} onChange={jest.fn()} />);
    fireEvent.change(getByPlaceholderText('Search fields...'), { target: { value: 'eff' } });
    expect(queryByLabelText('Effort')).toBeTruthy();
    expect(queryByLabelText('Title')).toBeNull();
  });

  it('offers all computed columns: Parent, Hierarchy Path, Level, Child Count, Closed Child Count', () => {
    const { getByLabelText } = render(<ColumnPicker fields={fields} value={[]} onChange={jest.fn()} />);
    ['Parent', 'Hierarchy Path', 'Level', 'Child Count', 'Closed Child Count'].forEach((l) => {
      expect(getByLabelText(l)).toBeTruthy();
    });
  });

  it('toggles the computed "Child Count" column on (all variant)', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<ColumnPicker fields={fields} value={[]} onChange={onChange} />);
    fireEvent.click(getByLabelText('Child Count'));
    expect(onChange).toHaveBeenCalledWith([{ kind: 'childCount', variant: 'all', header: 'Child Count' }]);
  });

  it('adds the closed child-count variant distinctly', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<ColumnPicker fields={fields} value={[]} onChange={onChange} />);
    fireEvent.click(getByLabelText('Closed Child Count'));
    expect(onChange).toHaveBeenCalledWith([{ kind: 'childCount', variant: 'closed', header: 'Closed Child Count' }]);
  });

  it('toggles a present computed column off', () => {
    const value: Column[] = [{ kind: 'parent', header: 'Parent' }];
    const onChange = jest.fn();
    const { getByLabelText } = render(<ColumnPicker fields={fields} value={value} onChange={onChange} />);
    const parent = getByLabelText('Parent') as HTMLInputElement;
    expect(parent.checked).toBe(true);
    fireEvent.click(parent);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
