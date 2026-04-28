import React from 'react';
import { BookOpenCheck, Lock, UserCheck, FileQuestion } from 'lucide-react';

const STATUS_STYLES = {
  draft: {
    label: 'Draft',
    badge: 'bg-edge/40 text-ink-secondary border-edge',
    iconColor: 'text-ink-tertiary',
    Icon: FileQuestion,
    description: 'Not yet assigned to a subject.',
  },
  assigned: {
    label: 'Assigned',
    badge: 'bg-brand/10 text-brand border-brand/30',
    iconColor: 'text-brand',
    Icon: BookOpenCheck,
    description: 'A subject has been assigned — not yet finalized.',
  },
  finalized: {
    label: 'Finalized',
    badge: 'bg-success/10 text-success border-success/30',
    iconColor: 'text-success',
    Icon: Lock,
    description: 'Your PFE is finalized and locked. No further changes allowed.',
  },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${style.badge}`}
    >
      <style.Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {style.label}
    </span>
  );
}

export default function PfeInfoCard({ pfe }) {
  // No data → render the "no PFE" empty state rather than nothing, so the
  // student knows the section exists and is tracking them.
  if (!pfe || !pfe.hasPfe) {
    return (
      <section className="bg-surface rounded-lg border border-edge shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-ink">PFE Information</h2>
          <StatusBadge status="draft" />
        </div>
        <div className="flex items-start gap-3 p-4 rounded-md bg-edge/10 border border-edge">
          <FileQuestion className="w-5 h-5 shrink-0 text-ink-tertiary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">No PFE assigned yet</p>
            <p className="text-xs text-ink-tertiary mt-1">
              You have not been assigned to a PFE subject. Once an assignment is
              made, it will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const status = pfe.assignmentStatus || 'draft';
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;

  return (
    <section className="bg-surface rounded-lg border border-edge shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-ink">PFE Information</h2>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 rounded-md bg-edge/10 border border-edge">
          <div className="p-2 rounded-full bg-brand/10 shrink-0">
            <BookOpenCheck className="w-5 h-5 text-brand" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-ink-tertiary font-semibold">
              Subject
            </p>
            <p className="text-sm font-medium text-ink mt-0.5 break-words">
              {pfe.subjectTitle || 'Not available'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-md bg-edge/10 border border-edge">
          <div className="p-2 rounded-full bg-success/10 shrink-0">
            <UserCheck className="w-5 h-5 text-success" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-ink-tertiary font-semibold">
              Supervisor
            </p>
            <p className="text-sm font-medium text-ink mt-0.5 break-words">
              {pfe.supervisorName || 'Not assigned'}
            </p>
          </div>
        </div>
      </div>

      <p className={`mt-4 text-xs ${style.iconColor}`}>
        {style.description}
      </p>

      {pfe.isLocked && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-md bg-success/5 border border-success/20">
          <Lock className="w-4 h-4 shrink-0 text-success mt-0.5" />
          <p className="text-xs text-success-dark leading-relaxed">
            This assignment is finalized. Editing, leaving the group, or changing
            the subject is no longer possible.
          </p>
        </div>
      )}
    </section>
  );
}
