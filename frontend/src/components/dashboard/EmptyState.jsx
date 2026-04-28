import React from 'react';

/**
 * EmptyState — Token-driven, theme-safe empty state component
 * Maintains professional "Active" appearance even with null data
 * Uses semantic tokens, 8pt grid spacing, and instructional copy
 *
 * @param {React.ReactNode} icon - SVG icon with stroke-width="1.5"
 * @param {string} title - Primary message (text-sm, semibold)
 * @param {string} description - Instructional help text (text-xs, secondary)
 * @param {React.ReactNode} action - Optional call-to-action button
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px', // 8pt × 2
        borderRadius: '8px',
        border: '1px solid var(--color-edge-subtle)',
        background: 'linear-gradient(to bottom right, var(--color-surface), var(--color-surface-200))',
        padding: '64px 24px', // 8pt grid: 64px vertical, 24px horizontal
        textAlign: 'center',
      }}
    >
      {/* Icon Container — Semantic token with opacity transition */}
      {icon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px', // 3rem
            opacity: 0.35,
            color: 'var(--color-ink-tertiary)',
            transition: 'opacity 150ms ease-out',
          }}
        >
          {icon}
        </div>
      )}

      {/* Text Content — Proper hierarchy & spacing */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '420px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-ink)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-ink-secondary)',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Action — Optional call-to-action */}
      {action && (
        <div
          style={{
            marginTop: '16px',
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
}
