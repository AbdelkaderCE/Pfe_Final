import React from 'react';

/**
 * KPITile — Token-driven, interactive KPI card with depth & layering
 * Converts flat counters into semantic, accent-colored cards
 * Uses CSS custom properties for theme safety (light/dark compatible)
 *
 * @param {string} title - Label (text-xs, uppercase, tertiary)
 * @param {string|number} value - Primary numeric display (text-4xl, bold)
 * @param {string} subtitle - Supporting descriptive text (text-sm, secondary)
 * @param {string} accent - Semantic color: 'brand', 'success', 'warning', 'danger'
 * @param {React.ReactNode} icon - Optional icon (small, accent-colored)
 */
export default function KPITile({ title, value, subtitle, accent = 'brand', icon }) {
  // Token-to-CSS-var mapping
  const accentColorMap = {
    brand: 'var(--color-brand, #1d4ed8)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  };

  const accentBgMap = {
    brand: 'rgba(29, 78, 216, 0.05)',
    success: 'rgba(22, 163, 74, 0.05)',
    warning: 'rgba(202, 138, 4, 0.05)',
    danger: 'rgba(220, 38, 38, 0.05)',
  };

  const accentColor = accentColorMap[accent] || accentColorMap.brand;
  const accentBg = accentBgMap[accent] || accentBgMap.brand;

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid var(--color-edge)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
        padding: '24px', // 8pt grid
        transition: 'all 150ms ease-out',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 0.5px var(--color-edge-subtle)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Gradient Accent Background — Depth layer */}
      <div
        style={{
          position: 'absolute',
          top: '-32px',
          right: '-32px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: accentBg,
          filter: 'blur(48px)',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Content Layer (positioned above gradient) */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header: Label + Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-ink-tertiary)',
              margin: 0,
            }}
          >
            {title}
          </p>
          {icon && (
            <div
              style={{
                fontSize: '18px',
                opacity: 0.6,
                color: accentColor,
                transition: 'transform 150ms ease-out',
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Primary Value — Visual Anchor */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <p
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: accentColor,
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </p>
        </div>

        {/* Subtitle — Supporting context */}
        {subtitle && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-ink-secondary)',
              margin: 0,
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </article>
  );
}
