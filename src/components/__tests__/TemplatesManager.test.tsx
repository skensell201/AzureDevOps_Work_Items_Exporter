import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { TemplatesManager } from '../TemplatesManager';
import { Template } from '../../models/types';

function tpl(id: string, ownerId: string, kind: 'backlog' | 'query', name = id): Template {
  return {
    id, name,
    source:
      kind === 'query'
        ? { kind, project: 'P', queryId: 'q', label: `P / ${name}` }
        : { kind, project: 'P', team: 't', backlogId: 'b', label: `P / ${name}` },
    columns: [], owner: { id: ownerId, displayName: ownerId }, sharedWith: [],
  };
}

const base = {
  templates: [tpl('a', 'me', 'backlog', 'Alpha'), tpl('b', 'other', 'query', 'Beta')],
  currentUserId: 'me',
  search: jest.fn(),
  onLoad: jest.fn(),
  onDelete: jest.fn(),
  onShareChange: jest.fn(),
  onClose: jest.fn(),
};

describe('TemplatesManager', () => {
  it('shows the total count and all templates by default', () => {
    const { getByText } = render(<TemplatesManager {...base} />);
    expect(getByText('Templates (2)')).toBeTruthy();
    expect(getByText('Alpha')).toBeTruthy();
    expect(getByText('Beta')).toBeTruthy();
  });

  it('filters by search text (name or source label)', () => {
    const { getByPlaceholderText, queryByText } = render(<TemplatesManager {...base} />);
    fireEvent.change(getByPlaceholderText('Search templates…'), { target: { value: 'alph' } });
    expect(queryByText('Alpha')).toBeTruthy();
    expect(queryByText('Beta')).toBeNull();
  });

  it('shows "found of total" in the header while filtering', () => {
    const { getByPlaceholderText, getByText } = render(<TemplatesManager {...base} />);
    fireEvent.change(getByPlaceholderText('Search templates…'), { target: { value: 'alph' } });
    expect(getByText('Templates (1 of 2)')).toBeTruthy();
  });

  it('filters by type', () => {
    const { getByLabelText, queryByText } = render(<TemplatesManager {...base} />);
    fireEvent.change(getByLabelText('Type'), { target: { value: 'query' } });
    expect(queryByText('Beta')).toBeTruthy();
    expect(queryByText('Alpha')).toBeNull();
  });

  it('loads a template', () => {
    const onLoad = jest.fn();
    const { getAllByText } = render(<TemplatesManager {...base} onLoad={onLoad} />);
    fireEvent.click(getAllByText('Load')[0]);
    expect(onLoad).toHaveBeenCalledWith(base.templates[0]);
  });

  it('shows Share/Delete only for owned templates', () => {
    const { getAllByText } = render(<TemplatesManager {...base} />);
    expect(getAllByText('Delete')).toHaveLength(1);
    expect(getAllByText('Share')).toHaveLength(1);
  });

  it('opens ShareControl for a template and persists changes', async () => {
    const search = jest.fn().mockResolvedValue([{ id: 'u2', displayName: 'Bob' }]);
    const onShareChange = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <TemplatesManager {...base} search={search} onShareChange={onShareChange} />
    );
    fireEvent.click(getByText('Share'));
    fireEvent.change(getByPlaceholderText('Search people…'), { target: { value: 'bo' } });
    fireEvent.click(getByText('Search'));
    await waitFor(() => getByText('Bob'));
    fireEvent.click(getByText('Bob'));
    expect(onShareChange).toHaveBeenCalledWith(base.templates[0], [{ id: 'u2', displayName: 'Bob' }]);
  });

  it('shows an empty message when nothing matches', () => {
    const { getByPlaceholderText, getByText } = render(<TemplatesManager {...base} />);
    fireEvent.change(getByPlaceholderText('Search templates…'), { target: { value: 'zzz' } });
    expect(getByText('No templates match.')).toBeTruthy();
  });

  it('closes', () => {
    const onClose = jest.fn();
    const { getByText } = render(<TemplatesManager {...base} onClose={onClose} />);
    fireEvent.click(getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
