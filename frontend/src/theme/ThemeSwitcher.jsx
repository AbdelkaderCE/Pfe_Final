/*
  Intent: A quiet settings panel — not a celebration of options.
          Mode toggle is binary, accent is a row of swatches.
          Feels like choosing a pen color, not customizing a spaceship.
  Palette: surface card, surface-200 for active well. Brand swatch = the accent itself.
  Depth: shadow-card if floating, border-edge always.
  Typography: Label = text-sm font-medium. Caption = text-xs text-ink-muted.
  Spacing: 4px base. p-4 internal. gap-3 between sections.
*/

import React from 'react';
import { useTheme } from './ThemeProvider';

const ACCENT_META = {
  blue:    { label: 'Blue',    swatch: '#1d4ed8', darkSwatch: '#3b82f6' },
  emerald: { label: 'Emerald', swatch: '#059669', darkSwatch: '#34d399' },
  violet:  { label: 'Violet',  swatch: '#7c3aed', darkSwatch: '#a78bfa' },
  amber:   { label: 'Amber',   swatch: '#d97706', darkSwatch: '#fbbf24' },
  rose:    { label: 'Rose',    swatch: '#e11d48', darkSwatch: '#fb7185' },
};

const SIDEBAR_META = {
  slate: { label: 'Slate', swatch: '#334155' },
  blue: { label: 'Blue', swatch: '#1d4ed8' },
  indigo: { label: 'Indigo', swatch: '#4f46e5' },
  emerald: { label: 'Emerald', swatch: '#059669' },
  rose: { label: 'Rose', swatch: '#e11d48' },
};

export default function ThemeSwitcher({ className = '' }) {
  const { mode, accent, sidebarColor, toggleMode, setAccent, setSidebarColor, isDark } = useTheme();

  return (
    <div className={`space-y-4 ${className}`}>

      {/* ── Mode Toggle ─────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-ink-secondary mb-2">Appearance</p>
        <div className="inline-flex rounded-md bg-surface-200 p-1">
          {[
            { key: 'light', label: 'Light', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            )},
            { key: 'dark', label: 'Dark', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )},
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => { if (mode !== m.key) toggleMode(); }}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
                transition-all duration-150
                ${mode === m.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
                }
              `}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Accent Picker ───────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-ink-secondary mb-2">Accent Color</p>
        <div className="flex items-center gap-2">
          {Object.entries(ACCENT_META).map(([key, meta]) => {
            const isActive = accent === key;
            const color = isDark ? meta.darkSwatch : meta.swatch;
            return (
              <button
                key={key}
                onClick={() => setAccent(key)}
                title={meta.label}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all duration-150
                  flex items-center justify-center
                  ${isActive
                    ? 'border-ink scale-110 shadow-sm'
                    : 'border-transparent hover:border-edge-strong hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color }}
              >
                {isActive && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-muted mt-1.5">
          {ACCENT_META[accent].label} — changes buttons, links, and active states
        </p>
      </div>

      {/* ── Sidebar Color Picker ───────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-ink-secondary mb-2">Sidebar Color</p>
        <div className="flex items-center gap-2">
          {Object.entries(SIDEBAR_META).map(([key, meta]) => {
            const isActive = sidebarColor === key;

            return (
              <button
                key={key}
                onClick={() => setSidebarColor(key)}
                title={meta.label}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all duration-150
                  flex items-center justify-center
                  ${isActive
                    ? 'border-ink scale-110 shadow-sm'
                    : 'border-transparent hover:border-edge-strong hover:scale-105'
                  }
                `}
                style={{ backgroundColor: meta.swatch }}
              >
                {isActive && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-muted mt-1.5">
          {SIDEBAR_META[sidebarColor]?.label || 'Slate'} — applied globally to all sidebars
        </p>
      </div>
    </div>
  );
}
