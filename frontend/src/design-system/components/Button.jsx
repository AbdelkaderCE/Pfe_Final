/*
  Button — the most-used control in the system.
  Depth: borders-only for secondary, brand fill for primary, danger fill for destructive.
  States: default → hover → active → focus → disabled. Every state feels alive.
  Sizes: sm (32px), md (36px), lg (40px). Multiples of 4.
*/

import React from 'react';

const base = `
  inline-flex items-center justify-center gap-2
  font-medium
  rounded-md
  transition-all duration-150
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  select-none whitespace-nowrap
`;

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};

const variants = {
  primary: `
    bg-brand text-white
    hover:bg-brand-hover active:bg-brand-dark
    focus:ring-brand/30
  `,
  secondary: `
    bg-surface border border-edge text-ink-secondary
    hover:bg-surface-200 active:bg-surface-300
    focus:ring-brand/30
  `,
  danger: `
    bg-danger text-white
    hover:opacity-90 active:opacity-80
    focus:ring-danger/30
  `,
  ghost: `
    bg-transparent text-ink-secondary
    hover:bg-surface-200 active:bg-surface-300
    focus:ring-brand/30
  `,
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
