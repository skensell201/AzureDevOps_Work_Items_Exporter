import React, { useEffect, useState } from 'react';
import { CellValue, TreeNode, TreeTable } from '../models/types';

function text(c: CellValue): string {
  return c === null ? '' : String(c);
}

/** Node ids that should start expanded: everything that is NOT a level item. */
function initialExpanded(tree: TreeTable): Set<number> {
  const ids = new Set<number>();
  for (const node of tree.nodes.values()) {
    if (!node.isLevel) ids.add(node.id);
  }
  return ids;
}

export function DataGrid({ tree, maxRows = 500 }: { tree: TreeTable; maxRows?: number }): JSX.Element {
  const [expanded, setExpanded] = useState<Set<number>>(() => initialExpanded(tree));

  // Reset expansion when the tree identity changes.
  useEffect(() => {
    setExpanded(initialExpanded(tree));
  }, [tree]);

  function toggle(id: number): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Depth-first walk into a flat list of visible rows (seen-guard against malformed cycles).
  const visible: { node: TreeNode; depth: number }[] = [];
  const seen = new Set<number>();
  const visit = (id: number, depth: number): void => {
    const node = tree.nodes.get(id);
    if (!node || seen.has(id)) return;
    seen.add(id);
    visible.push({ node, depth });
    if (expanded.has(id)) {
      for (const childId of node.childIds) visit(childId, depth + 1);
    }
  };
  for (const rootId of tree.roots) visit(rootId, 0);

  const total = tree.nodes.size;
  const shown = Math.min(visible.length, maxRows);
  const capped = visible.slice(0, maxRows);
  const truncated = visible.length > maxRows;

  return (
    <div className="grid-wrap">
      {truncated && (
        <div className="grid-note">
          Showing {shown} of {total} rows — the downloaded file contains all rows.
        </div>
      )}
      <table className="data-grid">
        <thead>
          <tr>
            {tree.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {capped.map(({ node, depth }) => (
            <tr key={node.id} className={node.isLevel ? 'level-row' : undefined}>
              {node.cells.map((c, ci) => {
                if (ci === tree.titleIndex) {
                  const hasChildren = node.childIds.length > 0;
                  const isOpen = expanded.has(node.id);
                  return (
                    <td
                      key={ci}
                      className="title-cell"
                      style={{ paddingLeft: 8 + depth * 16 }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          className="tree-toggle"
                          aria-label={isOpen ? 'Collapse' : 'Expand'}
                          aria-expanded={isOpen}
                          onClick={() => toggle(node.id)}
                        >
                          {isOpen ? '▾' : '▸'}
                        </button>
                      ) : (
                        <span className="tree-toggle placeholder" aria-hidden="true">
                          ▸
                        </span>
                      )}
                      {text(c)}
                    </td>
                  );
                }
                return <td key={ci}>{text(c)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
