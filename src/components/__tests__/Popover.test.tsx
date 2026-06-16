import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Popover } from '../Popover';

describe('Popover', () => {
  it('toggles its panel content on the trigger button', () => {
    const { getByText, queryByText } = render(<Popover label="Columns"><div>PANEL</div></Popover>);
    expect(queryByText('PANEL')).toBeNull();
    fireEvent.click(getByText('Columns'));
    expect(queryByText('PANEL')).toBeTruthy();
    fireEvent.click(getByText('Columns'));
    expect(queryByText('PANEL')).toBeNull();
  });

  it('closes when clicking outside', () => {
    const { getByText, queryByText } = render(
      <div>
        <Popover label="Columns"><div>PANEL</div></Popover>
        <button>Outside</button>
      </div>
    );
    fireEvent.click(getByText('Columns'));
    expect(queryByText('PANEL')).toBeTruthy();
    fireEvent.mouseDown(getByText('Outside'));
    expect(queryByText('PANEL')).toBeNull();
  });
});
