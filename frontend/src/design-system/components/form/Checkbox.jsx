/*
  Checkbox — custom styled. Brand color when checked.
  Label is ink-secondary, interactive cursor.
  Focus ring on the checkbox itself for keyboard nav.
*/

import React from 'react';

export function Checkbox({ label, className = '', id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label htmlFor={inputId} className={`inline-flex items-center gap-2 text-sm text-ink-secondary cursor-pointer select-none ${className}`}>
      <input
        id={inputId}
        type="checkbox"
        className="w-4 h-4 rounded border-control-border text-brand focus:ring-2 focus:ring-brand/30 transition-colors"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
