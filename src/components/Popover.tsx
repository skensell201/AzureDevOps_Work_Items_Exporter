import React, { useEffect, useRef, useState } from 'react';

export function Popover({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="popover" ref={ref}>
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
