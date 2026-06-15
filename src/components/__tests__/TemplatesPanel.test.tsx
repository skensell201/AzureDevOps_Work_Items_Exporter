import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TemplatesPanel } from '../TemplatesPanel';
import { Template } from '../../models/types';

function tpl(id: string, ownerId: string): Template {
  return {
    id, name: id,
    source: { kind: 'query', project: 'P', queryId: 'q', label: 'P / q' },
    columns: [], owner: { id: ownerId, displayName: ownerId }, sharedWith: [],
  };
}

const base = {
  templates: [tpl('mine', 'me'), tpl('shared', 'other')],
  currentUserId: 'me',
  canSave: true,
  onSave: jest.fn(),
  onLoad: jest.fn(),
  onDelete: jest.fn(),
  onShare: jest.fn(),
};

describe('TemplatesPanel', () => {
  it('saves the current setup under a typed name', () => {
    const onSave = jest.fn();
    const { getByPlaceholderText, getByText } = render(<TemplatesPanel {...base} onSave={onSave} />);
    fireEvent.change(getByPlaceholderText('Template name…'), { target: { value: 'My export' } });
    fireEvent.click(getByText('Save template'));
    expect(onSave).toHaveBeenCalledWith('My export');
  });

  it('does not save a blank name', () => {
    const onSave = jest.fn();
    const { getByText } = render(<TemplatesPanel {...base} onSave={onSave} />);
    fireEvent.click(getByText('Save template'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('loads a template', () => {
    const onLoad = jest.fn();
    const { getAllByText } = render(<TemplatesPanel {...base} onLoad={onLoad} />);
    fireEvent.click(getAllByText('Load')[0]);
    expect(onLoad).toHaveBeenCalledWith(base.templates[0]);
  });

  it('shows Delete/Share only for templates the user owns', () => {
    const { getAllByText } = render(<TemplatesPanel {...base} />);
    // Only "mine" is owned by "me" → exactly one Delete and one Share button.
    expect(getAllByText('Delete')).toHaveLength(1);
    expect(getAllByText('Share')).toHaveLength(1);
  });

  it('disables Save when canSave is false', () => {
    const { getByText, getByPlaceholderText } = render(<TemplatesPanel {...base} canSave={false} />);
    fireEvent.change(getByPlaceholderText('Template name…'), { target: { value: 'X' } });
    expect((getByText('Save template') as HTMLButtonElement).disabled).toBe(true);
  });
});
