import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ShareControl } from '../ShareControl';
import { SharedUser } from '../../models/types';

describe('ShareControl', () => {
  const shared: SharedUser[] = [{ id: 'u1', displayName: 'Ann' }];

  it('lists currently shared users and removes one', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <ShareControl sharedWith={shared} search={jest.fn()} onChange={onChange} onClose={jest.fn()} />
    );
    expect(getByText('Ann')).toBeTruthy();
    fireEvent.click(getByText('✕'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('searches and adds a user', async () => {
    const search = jest.fn().mockResolvedValue([{ id: 'u2', displayName: 'Bob' }]);
    const onChange = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <ShareControl sharedWith={[]} search={search} onChange={onChange} onClose={jest.fn()} />
    );
    fireEvent.change(getByPlaceholderText('Search people…'), { target: { value: 'bo' } });
    fireEvent.click(getByText('Search'));
    await waitFor(() => getByText('Bob'));
    fireEvent.click(getByText('Bob'));
    expect(onChange).toHaveBeenCalledWith([{ id: 'u2', displayName: 'Bob' }]);
  });

  it('does not add a duplicate user', async () => {
    const search = jest.fn().mockResolvedValue([{ id: 'u1', displayName: 'Ann' }]);
    const onChange = jest.fn();
    const { getByPlaceholderText, getByText, getAllByText } = render(
      <ShareControl sharedWith={shared} search={search} onChange={onChange} onClose={jest.fn()} />
    );
    fireEvent.change(getByPlaceholderText('Search people…'), { target: { value: 'an' } });
    fireEvent.click(getByText('Search'));
    await waitFor(() => getAllByText('Ann'));
    // Click the search-result "Ann" (the last occurrence)
    const anns = getAllByText('Ann');
    fireEvent.click(anns[anns.length - 1]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
