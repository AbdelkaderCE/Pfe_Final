import React from 'react';

/**
 * ProgressBar - Semantic progress visualization with proper token mapping
 * Used for status distribution and pipeline metrics
 * @param {string} label - Display label
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {string} status - Semantic color: 'success', 'warning', 'danger', 'brand'
 */
export default function ProgressBar({ label, value, total, status = 'brand' }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  const statusClasses = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    brand: 'bg-brand',
  };

  return (
    <div className="space-y-2">
      {/* Label + Value Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-semibold text-ink-secondary">
          {value}
          <span className="text-ink-tertiary">{' '}/ {total}</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-300">
        {/* Filled Progress Bar */}
        <div
          className={`h-full transition-all duration-300 ${statusClasses[status]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage Label */}
      <span className="text-xs text-ink-tertiary">{percentage}%</span>
    </div>
  );
}
