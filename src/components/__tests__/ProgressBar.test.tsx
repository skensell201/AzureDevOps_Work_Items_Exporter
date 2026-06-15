import React from 'react';
import { render } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders nothing when step is null', () => {
    const { container } = render(<ProgressBar step={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the current step text', () => {
    const { getByText } = render(<ProgressBar step="Loading backlog..." />);
    expect(getByText('Loading backlog...')).toBeTruthy();
  });
});
