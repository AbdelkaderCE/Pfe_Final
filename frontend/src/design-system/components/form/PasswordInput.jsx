/*
  PasswordInput — TextInput with show/hide toggle.
  The eye icon is tertiary ink by default, secondary on hover.
  Toggle doesn't steal focus from the input (tabIndex -1).
*/

import React, { useState } from 'react';

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-3 text-sm',
};

export function PasswordInput({
  label = 'Password',
  error,
  hint,
  size = 'md',
  className = '',
  id,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const inputId = id || 'password';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block mb-1.5 text-sm font-medium text-ink-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`
            w-full ${sizes[size]} pr-10
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
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-danger">{error}</p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}
