import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SourcePicker, Selection } from '../SourcePicker';
import { NamedRef, QueryNode } from '../../models/types';

const projects: NamedRef[] = [{ id: 'p1', name: 'Contoso' }];
const teams: NamedRef[] = [{ id: 't1', name: 'Ops' }];
const levels: NamedRef[] = [{ id: 'Microsoft.RequirementCategory', name: 'Stories' }];
const queryTree: QueryNode[] = [
  { id: 'f1', name: 'Shared Queries', path: 'Shared Queries', isFolder: true, children: [
    { id: 'q1', name: 'Open Bugs', path: 'Shared Queries/Open Bugs', isFolder: false, children: [] },
  ] },
];

const EMPTY: Selection = { tab: 'backlog', project: '', team: '', level: '', query: '', itemType: '' };

function setup(value: Selection = EMPTY) {
  const props = {
    projects, teams, levels, queryTree,
    types: ['User Story', 'Bug'],
    value,
    onChange: jest.fn(),
    onProjectSelected: jest.fn(),
    onTeamSelected: jest.fn(),
    onRefreshQueries: jest.fn(),
    onLoadBacklog: jest.fn(),
    onLoadQuery: jest.fn(),
  };
  return { props, ...render(<SourcePicker {...props} />) };
}

describe('SourcePicker (controlled)', () => {
  it('changing project emits cleared dependent selection and fires onProjectSelected', () => {
    const { props, getByLabelText } = setup();
    fireEvent.change(getByLabelText('Project'), { target: { value: 'p1' } });
    expect(props.onChange).toHaveBeenCalledWith({ tab: 'backlog', project: 'p1', team: '', level: '', query: '', itemType: '' });
    expect(props.onProjectSelected).toHaveBeenCalledWith('p1');
  });

  it('changing team clears level and fires onTeamSelected', () => {
    const { props, getByLabelText } = setup({ tab: 'backlog', project: 'p1', team: '', level: 'L', query: '', itemType: '' });
    fireEvent.change(getByLabelText('Team'), { target: { value: 't1' } });
    expect(props.onChange).toHaveBeenCalledWith({ tab: 'backlog', project: 'p1', team: 't1', level: '', query: '', itemType: '' });
    expect(props.onTeamSelected).toHaveBeenCalledWith('p1', 't1');
  });

  it('loads a backlog using the current value', () => {
    const { props, getByText } = setup({ tab: 'backlog', project: 'p1', team: 't1', level: 'Microsoft.RequirementCategory', query: '', itemType: '' });
    fireEvent.click(getByText('Load backlog'));
    expect(props.onLoadBacklog).toHaveBeenCalledWith('p1', 't1', 'Microsoft.RequirementCategory');
  });

  it('shows the Query tab and loads the selected query', () => {
    const { props, getByText } = setup({ tab: 'query', project: 'p1', team: '', level: '', query: 'q1', itemType: '' });
    fireEvent.click(getByText('Load query'));
    expect(props.onLoadQuery).toHaveBeenCalledWith('p1', 'q1');
  });

  it('has a refresh button on the Query tab that fires onRefreshQueries', () => {
    const { props, getByText } = setup({ tab: 'query', project: 'p1', team: '', level: '', query: '', itemType: '' });
    fireEvent.click(getByText('↻'));
    expect(props.onRefreshQueries).toHaveBeenCalled();
  });

  it('selecting a work item type emits onChange with itemType', () => {
    const { props, getByLabelText } = setup({ tab: 'backlog', project: 'p1', team: 't1', level: 'Microsoft.RequirementCategory', query: '', itemType: '' });
    fireEvent.change(getByLabelText('Work Item Type'), { target: { value: 'Bug' } });
    expect(props.onChange).toHaveBeenCalledWith({ tab: 'backlog', project: 'p1', team: 't1', level: 'Microsoft.RequirementCategory', query: '', itemType: 'Bug' });
  });

  it('switching tabs emits the new tab', () => {
    const { props, getByText } = setup();
    fireEvent.click(getByText('Query'));
    expect(props.onChange).toHaveBeenCalledWith({ ...EMPTY, tab: 'query' });
  });
});
