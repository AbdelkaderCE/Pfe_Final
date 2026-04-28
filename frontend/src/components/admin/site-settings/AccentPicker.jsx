import React from 'react';
import { Check } from 'lucide-react';

const ACCENT_META = {
  blue: { label: 'Blue', light: '#1d4ed8', dark: '#3b82f6' },
  emerald: { label: 'Emerald', light: '#059669', dark: '#34d399' },
  violet: { label: 'Violet', light: '#7c3aed', dark: '#a78bfa' },
  amber: { label: 'Amber', light: '#d97706', dark: '#fbbf24' },
  rose: { label: 'Rose', light: '#e11d48', dark: '#fb7185' },
};

export default function AccentPicker({ accents, value, onChange, isDark = false, label }) {
  return (
    <div>
      {label ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {accents.map((accent) => {
          const meta = ACCENT_META[accent] || {
            label: accent,
            light: '#94a3b8',
            dark: '#94a3b8',
          };
          const swatch = isDark ? meta.dark : meta.light;
          const isActive = value === accent;
          return (
            <button
              key={accent}
              type="button"
              onClick={() => onChange(accent)}
              title={meta.label}
              aria-label={`Select ${meta.label} accent`}
              aria-pressed={isActive}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 ${
                isActive
                  ? 'border-ink scale-110 shadow-md'
                  : 'border-transparent hover:border-edge-strong hover:scale-105'
              }`}
              style={{ backgroundColor: swatch }}
            >
              {isActive ? (
                <Check className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={3} />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
