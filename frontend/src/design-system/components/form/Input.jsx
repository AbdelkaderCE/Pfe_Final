/*
  TextInput — inset control feel. Darker bg than surface signals "type here."
  Focus: subtle ring + border color shift. Not glowing — noticeable.
  Error: border turns danger, helper text appears below.
  Sizes match Button: sm/md/lg for alignment in forms.
*/

import React from 'react';

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-3 text-sm',
};

export function TextInput({
  label,
  error,
  hint,
  size = 'md',
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block mb-1.5 text-sm font-medium text-ink-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full ${sizes[size]}
          text-ink bg-control-bg
          border rounded-md
          placeholder:text-ink-muted
          focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
          transition-colors duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-control-border'}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-danger">{error}</p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}
