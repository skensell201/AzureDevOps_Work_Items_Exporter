import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SourcePicker } from '../SourcePicker';
import { NamedRef, QueryNode } from '../../models/types';

const projects: NamedRef[] = [{ id: 'p1', name: 'Datagile' }];
const teams: NamedRef[] = [{ id: 't1', name: 'Ops' }];
const levels: NamedRef[] = [{ id: 'Microsoft.RequirementCategory', name: 'Stories' }];
const queryTree: QueryNode[] = [
  { id: 'f1', name: 'Shared Queries', path: 'Shared Queries', isFolder: true, children: [
    { id: 'q1', name: 'Open Bugs', path: 'Shared Queries/Open Bugs', isFolder: false, children: [] },
  ] },
];

function baseProps() {
  return {
    projects,
    teams,
    levels,
    queryTree,
    onProjectChange: jest.fn(),
    onTeamChange: jest.fn(),
    onLoadBacklog: jest.fn(),
    onLoadQuery: jest.fn(),
  };
}

describe('SourcePicker', () => {
  it('loads a backlog with the selected project/team/level', () => {
    const props = baseProps();
    const { getByText, getByLabelText } = render(<SourcePicker {...props} />);
    fireEvent.change(getByLabelText('Project'), { target: { value: 'p1' } });
    fireEvent.change(getByLabelText('Team'), { target: { value: 't1' } });
    fireEvent.change(getByLabelText('Backlog level'), { target: { value: 'Microsoft.RequirementCategory' } });
    fireEvent.click(getByText('Load backlog'));
    expect(props.onLoadBacklog).toHaveBeenCalledWith('p1', 't1', 'Microsoft.RequirementCategory');
  });

  it('switches to the Query tab and loads a selected query', () => {
    const props = baseProps();
    const { getByText, getByLabelText } = render(<SourcePicker {...props} />);
    fireEvent.click(getByText('Query'));
    fireEvent.change(getByLabelText('Project'), { target: { value: 'p1' } });
    fireEvent.change(getByLabelText('Query'), { target: { value: 'q1' } });
    fireEvent.click(getByText('Load query'));
    expect(props.onLoadQuery).toHaveBeenCalledWith('p1', 'q1');
  });

  it('resets team and level when the project changes (prevents loading a stale combo)', () => {
    const props = baseProps();
    const { getByLabelText } = render(<SourcePicker {...props} />);
    fireEvent.change(getByLabelText('Project'), { target: { value: 'p1' } });
    fireEvent.change(getByLabelText('Team'), { target: { value: 't1' } });
    fireEvent.change(getByLabelText('Backlog level'), { target: { value: 'Microsoft.RequirementCategory' } });
    expect((getByLabelText('Team') as HTMLSelectElement).value).toBe('t1');
    // Re-selecting/changing the project must clear the dependent selects.
    fireEvent.change(getByLabelText('Project'), { target: { value: 'p1' } });
    expect((getByLabelText('Team') as HTMLSelectElement).value).toBe('');
    expect((getByLabelText('Backlog level') as HTMLSelectElement).value).toBe('');
  });
});
