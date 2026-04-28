/*
  HistoryRow Component — High-density history item display
  
  Purpose: Render a single history entry with date, category icon, title, status badge, and action button.
  Theme Safety: Uses semantic tokens (--surface-L2 background, --text-primary title, --text-muted timestamp,
                --border-subtle separator). Compatible with light/dark mode.
  Accessibility: Semantic structure with role="listitem", proper heading hierarchy, accessible buttons.
  Grid Alignment: Follows 8pt grid with consistent padding/spacing.
*/

import React from 'react';
import { Eye, FileText, AlertTriangle, CheckCircle, FileQuestion, Briefcase, BookOpen, Clock } from 'lucide-react';

const ICON_MAP = {
  AlertTriangle: AlertTriangle,
  BookOpen: BookOpen,
  FileText: FileText,
  FileQuestion: FileQuestion,
  CheckCircle: CheckCircle,
  Briefcase: Briefcase,
};

const STATUS_CONFIG = {
  pending: {
    badge: 'bg-warning-light dark:bg-warning/12 text-warning border border-warning/30',
    label: 'Pending',
  },
  approved: {
    badge: 'bg-success-light dark:bg-success/12 text-success border border-success/30',
    label: 'Approved',
  },
  rejected: {
    badge: 'bg-danger-light dark:bg-danger/12 text-danger border border-danger/30',
    label: 'Rejected',
  },
  submitted: {
    badge: 'bg-brand-light dark:bg-brand/12 text-brand border border-brand/30',
    label: 'Submitted',
  },
  'in progress': {
    badge: 'bg-brand-light dark:bg-brand/12 text-brand border border-brand/30',
    label: 'In Progress',
  },
  completed: {
    badge: 'bg-success-light dark:bg-success/12 text-success border border-success/30',
    label: 'Completed',
  },
};

export default function HistoryRow({
  id,
  date,
  category,
  categoryIcon,
  title,
  description,
  status,
  onView,
}) {
  const IconComponent = ICON_MAP[categoryIcon] || FileText;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      role="listitem"
      className="flex items-start gap-4 px-4 py-3 border-b border-edge-subtle hover:bg-surface-200 dark:hover:bg-surface-300/20 transition-colors"
    >
      {/* Left: Date + Category Icon */}
      <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-200 dark:bg-surface-300/30 border border-edge-subtle">
          <IconComponent className="w-5 h-5 text-ink-secondary" />
        </div>
        <div className="text-xs text-ink-muted text-center whitespace-nowrap">
          <div className="font-medium">{formattedDate.split(' ')[1]}</div>
          <div className="text-ink-tertiary">{formattedDate.split(' ')[0]}</div>
        </div>
      </div>

      {/* Middle: Title + Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-sm font-semibold text-ink truncate">{title}</h3>
          <span className="text-xs text-ink-tertiary whitespace-nowrap">{category}</span>
        </div>
        {description && (
          <p className="text-xs text-ink-secondary line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-ink-tertiary">
          <Clock className="w-3 h-3" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Right: Status Badge + View Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${statusConfig.badge}`}>
          {statusConfig.label}
        </div>
        <button
          type="button"
          onClick={() => onView?.(id)}
          className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-300/30 transition-colors text-ink-secondary hover:text-ink flex-shrink-0"
          aria-label={`View details for ${title}`}
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
