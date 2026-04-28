import React, { useEffect, useState } from 'react';
import { teacherDashboardService } from '../../../services/teacherDashboard';

export default function ReportStudentModal({ student, open, onClose, onSubmitted }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
      setSubmitting(false);
    }
  }, [open, student?.id]);

  if (!open || !student) return null;

  const fullName = `${student.prenom || ''} ${student.nom || ''}`.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please describe what happened.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await teacherDashboardService.reportStudent({
        studentId: student.id,
        reason: trimmed,
      });
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Failed to submit the report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface w-full max-w-lg rounded-lg border border-edge shadow-card-hover">
        <header className="px-6 py-4 border-b border-edge">
          <h2 className="text-base font-semibold text-ink">Report a student</h2>
          <p className="text-xs text-ink-tertiary mt-1">
            Opens a disciplinary case for review by the council.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="bg-canvas border border-edge-subtle rounded-md p-3">
            <p className="text-xs text-ink-tertiary uppercase tracking-wider font-semibold">
              Student
            </p>
            <p className="text-sm font-medium text-ink mt-1">{fullName || '—'}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">
              {student.matricule ? `Matricule ${student.matricule}` : ''}
              {student.matricule && student.promo?.nom ? ' · ' : ''}
              {student.promo?.nom || ''}
              {student.promo?.section && student.promo.section !== 'N/A'
                ? ` (${student.promo.section})`
                : ''}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Describe the incident…"
              className="w-full px-3 py-2 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand"
              required
            />
            <p className="text-[11px] text-ink-tertiary mt-1">
              {reason.length}/2000
            </p>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded">{error}</p>
          )}

          <footer className="flex items-center justify-end gap-2 pt-2 border-t border-edge-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-ink-secondary border border-edge rounded-md hover:bg-canvas disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-surface bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting…' : 'Open case'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
