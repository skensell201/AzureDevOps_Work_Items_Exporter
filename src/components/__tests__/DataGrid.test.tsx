import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { DataGrid } from '../DataGrid';
import { TreeNode, TreeTable } from '../../models/types';

/** Epic(root, !isLevel) → Story(isLevel) → Task(leaf). */
function makeTree(): TreeTable {
  const nodes = new Map<number, TreeNode>([
    [1, { id: 1, cells: [1, 'Epic A'], childIds: [2], isLevel: false }],
    [2, { id: 2, cells: [2, 'Story B'], childIds: [3], isLevel: true }],
    [3, { id: 3, cells: [3, 'Task C'], childIds: [], isLevel: false }],
  ]);
  return {
    columns: [],
    headers: ['ID', 'Title'],
    titleIndex: 1,
    nodes,
    roots: [1],
  };
}

describe('DataGrid (tree)', () => {
  it('renders the header row from headers', () => {
    const { getByText } = render(<DataGrid tree={makeTree()} />);
    expect(getByText('ID')).toBeTruthy();
    expect(getByText('Title')).toBeTruthy();
  });

  it('expands ancestors by default but collapses level items', () => {
    const { getByText, queryByText } = render(<DataGrid tree={makeTree()} />);
    // Epic (ancestor, !isLevel) expanded → Story visible
    expect(getByText('Epic A')).toBeTruthy();
    expect(getByText('Story B')).toBeTruthy();
    // Story (isLevel) collapsed → Task hidden
    expect(queryByText('Task C')).toBeNull();
  });

  it('clicking a level row chevron reveals its child', () => {
    const { getByText, queryByText, container } = render(<DataGrid tree={makeTree()} />);
    expect(queryByText('Task C')).toBeNull();
    // The Story row has a chevron (collapsed ▸); find toggle buttons.
    const toggles = container.querySelectorAll('button.tree-toggle');
    // Epic has children (expanded ▾) and Story has children (collapsed ▸).
    const storyToggle = Array.from(toggles).find((b) => b.textContent?.includes('▸'));
    expect(storyToggle).toBeTruthy();
    fireEvent.click(storyToggle as Element);
    expect(getByText('Task C')).toBeTruthy();
  });

  it('indents the title cell by depth', () => {
    const { container } = render(<DataGrid tree={makeTree()} />);
    // Expand the Story to reveal the Task.
    const storyToggle = Array.from(container.querySelectorAll('button.tree-toggle')).find((b) =>
      b.textContent?.includes('▸'),
    );
    fireEvent.click(storyToggle as Element);

    const titleCells = container.querySelectorAll('tbody td.title-cell');
    // Row order: Epic (depth 0), Story (depth 1), Task (depth 2).
    const epicPad = parseInt((titleCells[0] as HTMLElement).style.paddingLeft || '0', 10);
    const taskPad = parseInt((titleCells[2] as HTMLElement).style.paddingLeft || '0', 10);
    expect(taskPad).toBeGreaterThan(epicPad);
  });

  it('caps visible rows at maxRows and shows a count note', () => {
    const nodes = new Map<number, TreeNode>();
    const roots: number[] = [];
    for (let i = 1; i <= 5; i++) {
      nodes.set(i, { id: i, cells: [i, `Item ${i}`], childIds: [], isLevel: false });
      roots.push(i);
    }
    const tree: TreeTable = { columns: [], headers: ['ID', 'Title'], titleIndex: 1, nodes, roots };
    const { getByText, getAllByRole } = render(<DataGrid tree={tree} maxRows={2} />);
    // header + 2 body rows
    expect(getAllByRole('row')).toHaveLength(3);
    expect(getByText(/showing 2 of 5/i)).toBeTruthy();
  });

  it('renders null cells as empty', () => {
    const nodes = new Map<number, TreeNode>([
      [1, { id: 1, cells: [null], childIds: [], isLevel: false }],
    ]);
    const tree: TreeTable = { columns: [], headers: ['A'], titleIndex: -1, nodes, roots: [1] };
    const { container } = render(<DataGrid tree={tree} />);
    const cell = container.querySelector('tbody td');
    expect(cell?.textContent).toBe('');
  });
});
