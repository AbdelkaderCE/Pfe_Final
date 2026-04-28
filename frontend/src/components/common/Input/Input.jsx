/*
  Input — form input with label + error.
  Converted from friend's TS. Uses design tokens from rules.md.
*/

import React from 'react';

const Input = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className = '',
  ...rest
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-ink-secondary mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2.5 border rounded-md bg-control-bg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-control-focus transition ${
          error ? 'border-danger' : 'border-control-border'
        }`}
        {...rest}
      />
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Input;
