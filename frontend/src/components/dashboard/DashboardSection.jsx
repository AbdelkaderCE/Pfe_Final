import React from 'react';

/**
 * DashboardSection — Token-driven container with depth & layering
 * Replaces flat containers with semantic shadows and proper spacing
 * Uses CSS custom properties for theme safety
 *
 * @param {string} title - Section heading (text-base, semibold)
 * @param {React.ReactNode} children - Section content
 * @param {React.ReactNode} action - Optional action button (top-right)
 * @param {boolean} compact - Reduced padding variant (p-16 vs p-24)
 */
export default function DashboardSection({ title, children, action, compact = false }) {
  const padding = compact ? '16px' : '24px';
  const contentGap = compact ? '12px' : '16px';

  return (
    <section
      style={{
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid var(--color-edge)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
        padding: padding,
        transition: 'all 150ms ease-out',
      }}
    >
      {/* Header with title and optional action */}
      {title && (
        <div
          style={{
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-edge-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h2>
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Content Area with consistent negative space (8pt grid) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: contentGap,
        }}
      >
        {children}
      </div>
    </section>
  );
}
