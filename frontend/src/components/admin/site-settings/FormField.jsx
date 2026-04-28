import React, { useId } from 'react';

const baseInput =
  'w-full rounded-md border bg-control-bg px-3 py-2.5 text-sm text-ink outline-none transition-all duration-150 placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50';

export default function FormField({
  label,
  hint,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  multiline = false,
  rows = 3,
  required = false,
  disabled = false,
  error = '',
  rightSlot = null,
}) {
  const fieldId = useId();
  const hasError = Boolean(error);
  const inputClass = `${baseInput} ${
    hasError ? 'border-danger focus:border-danger' : 'border-control-border focus:border-brand'
  }`;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={fieldId}
          className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary"
        >
          {label}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        {multiline ? (
          <textarea
            id={fieldId}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            required={required}
            className={`${inputClass} min-h-[88px] resize-y`}
          />
        ) : (
          <input
            id={fieldId}
            type={type}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={inputClass}
          />
        )}
        {rightSlot ? (
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-ink-tertiary">
            {rightSlot}
          </div>
        ) : null}
      </div>
      {hasError ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
