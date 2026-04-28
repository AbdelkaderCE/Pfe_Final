import React from 'react';

/**
 * StatusIndicator — Token-driven semantic status visualization
 * Theme-safe for light/dark modes. Uses CSS custom properties throughout.
 * Three display variants: badge (pill), label (border), dot (inline)
 *
 * @param {string} status - Status key: 'active', 'pending', 'approved', 'rejected', 'suspended', 'draft', 'published', 'archived'
 * @param {string} label - Display text
 * @param {string} variant - 'badge' (pill), 'label' (border), 'dot' (inline)
 */
export default function StatusIndicator({ status, label, variant = 'badge' }) {
  // Map status to semantic token colors (CSS custom properties)
  const statusMap = {
    // Success states
    active: {
      bg: 'rgba(22, 163, 74, 0.05)',
      text: 'var(--color-success)',
      border: 'rgba(22, 163, 74, 0.2)',
    },
    approved: {
      bg: 'rgba(22, 163, 74, 0.05)',
      text: 'var(--color-success)',
      border: 'rgba(22, 163, 74, 0.2)',
    },
    published: {
      bg: 'rgba(22, 163, 74, 0.05)',
      text: 'var(--color-success)',
      border: 'rgba(22, 163, 74, 0.2)',
    },

    // Warning states
    pending: {
      bg: 'rgba(202, 138, 4, 0.05)',
      text: 'var(--color-warning)',
      border: 'rgba(202, 138, 4, 0.2)',
    },
    draft: {
      bg: 'rgba(202, 138, 4, 0.05)',
      text: 'var(--color-warning)',
      border: 'rgba(202, 138, 4, 0.2)',
    },
    inactive: {
      bg: 'rgba(202, 138, 4, 0.05)',
      text: 'var(--color-warning)',
      border: 'rgba(202, 138, 4, 0.2)',
    },
    scheduled: {
      bg: 'rgba(202, 138, 4, 0.05)',
      text: 'var(--color-warning)',
      border: 'rgba(202, 138, 4, 0.2)',
    },

    // Danger states
    rejected: {
      bg: 'rgba(220, 38, 38, 0.05)',
      text: 'var(--color-danger)',
      border: 'rgba(220, 38, 38, 0.2)',
    },
    suspended: {
      bg: 'rgba(220, 38, 38, 0.05)',
      text: 'var(--color-danger)',
      border: 'rgba(220, 38, 38, 0.2)',
    },
    archived: {
      bg: 'rgba(220, 38, 38, 0.05)',
      text: 'var(--color-danger)',
      border: 'rgba(220, 38, 38, 0.2)',
    },

    // Brand (default)
    default: {
      bg: 'rgba(29, 78, 216, 0.05)',
      text: 'var(--color-brand, #1d4ed8)',
      border: 'rgba(29, 78, 216, 0.2)',
    },
  };

  const colors = statusMap[status] || statusMap.default;

  // Dot variant — inline indicator with label
  if (variant === 'dot') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: colors.text,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: colors.text,
          }}
        >
          {label}
        </span>
      </div>
    );
  }

  // Label variant — bordered with rounded corners
  if (variant === 'label') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          color: colors.text,
          padding: '6px 10px',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    );
  }

  // Badge variant (default) — pill-shaped, no border
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        background: colors.bg,
        color: colors.text,
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}
