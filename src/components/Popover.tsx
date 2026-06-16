import React, { useState } from 'react';

export function Popover({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <span className="popover">
      <button className={open ? 'active' : ''} onClick={() => setOpen((o) => !o)}>
        {label} <span className="popover-caret">▾</span>
      </button>
      {open && (
        <div className="popover-panel">
          <div className="popover-close">
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
          {children}
        </div>
      )}
    </span>
  );
}
