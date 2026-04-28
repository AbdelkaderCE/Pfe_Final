import React, { useId } from 'react';

export default function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={`flex items-start justify-between gap-4 rounded-xl border border-edge bg-canvas/40 px-4 py-3 transition-colors hover:border-brand/30 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-tertiary">{description}</span>
        ) : null}
      </span>
      <span className="relative shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={Boolean(checked)}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="block h-6 w-11 rounded-full bg-surface-300 transition-colors duration-200 peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-focus-visible:ring-offset-2"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
