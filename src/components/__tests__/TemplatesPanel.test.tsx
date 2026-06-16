import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TemplatesPanel } from '../TemplatesPanel';

const base = { count: 3, canSave: true, onSave: jest.fn(), onOpenManager: jest.fn() };

describe('TemplatesPanel', () => {
  it('saves a typed name (empty description by default)', () => {
    const onSave = jest.fn();
    const { getByPlaceholderText, getByText } = render(<TemplatesPanel {...base} onSave={onSave} />);
    fireEvent.change(getByPlaceholderText('Template name…'), { target: { value: 'X' } });
    fireEvent.click(getByText('Save template'));
    expect(onSave).toHaveBeenCalledWith('X', '');
  });

  it('saves an optional description', () => {
    const onSave = jest.fn();
    const { getByPlaceholderText, getByText } = render(<TemplatesPanel {...base} onSave={onSave} />);
    fireEvent.change(getByPlaceholderText('Template name…'), { target: { value: 'X' } });
    fireEvent.change(getByPlaceholderText('Description (optional)…'), { target: { value: 'my notes' } });
    fireEvent.click(getByText('Save template'));
    expect(onSave).toHaveBeenCalledWith('X', 'my notes');
  });

  it('does not save a blank name', () => {
    const onSave = jest.fn();
    const { getByText } = render(<TemplatesPanel {...base} onSave={onSave} />);
    fireEvent.click(getByText('Save template'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('disables Save when canSave is false', () => {
    const { getByText, getByPlaceholderText } = render(<TemplatesPanel {...base} canSave={false} />);
    fireEvent.change(getByPlaceholderText('Template name…'), { target: { value: 'X' } });
    expect((getByText('Save template') as HTMLButtonElement).disabled).toBe(true);
  });

  it('opens the manager and shows the count', () => {
    const onOpenManager = jest.fn();
    const { getByText } = render(<TemplatesPanel {...base} onOpenManager={onOpenManager} />);
    fireEvent.click(getByText('Templates (3)'));
    expect(onOpenManager).toHaveBeenCalled();
  });
});
