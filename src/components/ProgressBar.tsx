import React from 'react';

export function ProgressBar({ step }: { step: string | null }): JSX.Element | null {
  if (!step) return null;
  return (
    <div className="progress" role="status">
      <span className="spinner" /> {step}
    </div>
  );
}
