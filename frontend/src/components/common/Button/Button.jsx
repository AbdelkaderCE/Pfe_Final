/*
  Button — reusable button component.
  Converted from friend's TS. Adapted to design-system tokens + rules.md patterns.
*/

import React from 'react';

const variantClasses = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-dark focus:ring-brand/30',
  secondary: 'bg-surface border border-edge text-ink-secondary hover:bg-surface-200',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-200',
  outline: 'border-2 border-brand text-brand hover:bg-brand hover:text-white focus:ring-brand/30',
  danger: 'bg-danger text-white hover:opacity-90 focus:ring-danger/30',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',   /* 40px height — rules.md default */
  lg: 'px-6 py-3 text-base',
};

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading…
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
