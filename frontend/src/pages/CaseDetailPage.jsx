/*
  Intent: The Digital Dossier — a single disciplinary case laid open on the desk.
          Chronological, evidence-based, and formally structured.
          Reads like a legal brief: facts, timeline, evidence, verdict.
  Access: Teacher / Admin only.
  Palette: canvas base, surface cards. Semantic colors for status and urgency.
  Depth: shadow-card + border-edge on section cards.
  Typography: Inter. Section headings = text-base font-semibold.
  Spacing: 4px base. Cards p-6. gap-6 between sections.
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Status Config ──────────────────────────────────────────── */

const STATUS_CONFIG = {
  pending:    { label: 'Pending Investigation', bg: 'bg-warning/5', text: 'text-warning', border: 'border-edge-strong', dot: 'bg-warning' },
  hearing:    { label: 'En instruction',        bg: 'bg-brand/5',   text: 'text-brand',   border: 'border-edge-strong', dot: 'bg-brand' },
  sanctioned: { label: 'Sanction Applied',      bg: 'bg-danger/5',  text: 'text-danger',  border: 'border-edge-strong', dot: 'bg-danger' },
  closed:     { label: 'Case Closed',           bg: 'bg-success/5', text: 'text-success', border: 'border-edge-strong', dot: 'bg-success' },
};

/* ── Timeline step icons ────────────────────────────────────── */

const TIMELINE_ICONS = {
  'Report Submitted':     { color: 'bg-warning/10 text-warning', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> },
  'Investigation Started': { color: 'bg-brand/10 text-brand',    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg> },
  'Meeting with Student':  { color: 'bg-surface-200 text-ink-secondary', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
  'Hearing Scheduled':     { color: 'bg-brand/10 text-brand',    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> },
  'Final Decision':        { color: 'bg-success/10 text-success',  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
};

const DEFAULT_ICON = { color: 'bg-surface-200 text-ink-tertiary', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };

/* ── File type icons ────────────────────────────────────────── */

function FileIcon({ type }) {
  if (type === 'Image') {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

/* ── Section wrapper ────────────────────────────────────────── */

function Section({ title, icon, children, action }) {
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card">
      <div className="px-6 py-4 border-b border-edge-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 text-ink-tertiary">{icon}</span>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────── */

export default function CaseDetailPage({ caseData, onBack, canManageActions = true, onCreateMeeting = null, canDeleteCase = false, onDeleteCase = null }) {
  const navigate = useNavigate();
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const safeCaseData = {
    ...caseData,
    timeline: Array.isArray(caseData?.timeline) ? caseData.timeline : [],
    evidence: Array.isArray(caseData?.evidence) ? caseData.evidence : [],
  };
  const [hearingDate, setHearingDate] = useState(safeCaseData.hearingDate || '');

  const status = STATUS_CONFIG[safeCaseData.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6">

      {/* ── Back + Header ────────────────────────────────────── */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink transition-colors duration-100 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Cases
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-ink tracking-tight">Case {safeCaseData.id}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded ${status.bg} ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-sm text-ink-tertiary">
              {safeCaseData.violationType} · Reported {formatDate(safeCaseData.dateReported)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canManageActions && typeof onCreateMeeting === 'function' && safeCaseData.status === 'pending' && (
              <button
                onClick={() => onCreateMeeting(safeCaseData.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Meeting
              </button>
            )}
            {canDeleteCase && typeof onDeleteCase === 'function' && safeCaseData.status === 'pending' && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Delete this case? This action cannot be undone.')) return;
                  setDeleting(true);
                  try {
                    await onDeleteCase(safeCaseData.id);
                    onBack();
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-md hover:bg-danger-hover active:bg-danger-dark transition-all duration-150"
              >
                {deleting ? 'Deleting…' : 'Delete Case'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Case Summary ───────────────────────────────────── */}
          <Section
            title="Case Summary"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
          >
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-ink-muted">Report Reason</p>
                <p className="text-sm text-ink-secondary leading-relaxed">{safeCaseData.descriptionSignal_ar || safeCaseData.descriptionSignal_en || safeCaseData.description || 'No reason provided'}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-ink-muted">Student</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{safeCaseData.studentName}</p>
                  <p className="text-xs text-ink-tertiary">{safeCaseData.studentId}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Department</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{safeCaseData.department}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Violation</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{safeCaseData.violationType}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Incident Date</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{formatDateShort(safeCaseData.dateOfIncident)}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Chronological Timeline ─────────────────────────── */}
          <Section
            title="Case Timeline"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          >
            <div className="p-6">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-edge" />

                <ul className="space-y-6">
                  {safeCaseData.timeline.map((step, i) => {
                    const iconCfg = TIMELINE_ICONS[step.event] || DEFAULT_ICON;
                    const isLast = i === safeCaseData.timeline.length - 1;

                    return (
                      <li key={i} className="relative flex gap-4">
                        {/* Dot */}
                        <div className={`relative z-10 w-8 h-8 rounded-full ${iconCfg.color} flex items-center justify-center shrink-0`}>
                          {iconCfg.icon}
                        </div>

                        {/* Content */}
                        <div className={`pb-${isLast ? '0' : '2'} min-w-0 flex-1`}>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-ink">{step.event}</p>
                            <span className="text-xs text-ink-muted">{formatDateShort(step.date)}</span>
                          </div>
                          <p className="text-sm text-ink-secondary mt-0.5">{step.detail}</p>
                          <p className="text-xs text-ink-tertiary mt-1">By: {step.by}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </Section>

          {/* ── Decision / Sanction Box ─────────────────────────── */}
          {(safeCaseData.decision || safeCaseData.status === 'closed') && (
            <Section
              title="Decision & Sanction"
              icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" /></svg>}
            >
              <div className="p-6">
                {safeCaseData.decision ? (
                  <>
                    {/* Verdict badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 text-sm font-semibold rounded-md bg-success/5 text-success border border-edge-strong">
                        {safeCaseData.decision.verdict || 'Decision Recorded'}
                      </span>
                      <span className="text-xs text-ink-muted">Issued {formatDate(safeCaseData.decision.date)}</span>
                    </div>

                    {/* Details */}
                    <div className="bg-surface-200 rounded-lg p-4 border border-edge-subtle">
                      <p className="text-sm text-ink leading-relaxed">{safeCaseData.decision.details || 'No additional remarks'}</p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-surface-200 rounded-lg border border-edge-subtle text-center">
                    <p className="text-sm text-ink-muted">Case has been closed. Decision details will appear here once finalized.</p>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* Right — 1/3 sidebar */}
        <div className="space-y-6">

          {/* ── Student Info ───────────────────────────────────── */}
          <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                <span className="text-sm font-bold text-brand">
                  {safeCaseData.studentName?.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{safeCaseData.studentName}</p>
                <p className="text-xs text-ink-tertiary">{safeCaseData.studentId} · {safeCaseData.department}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/profile', {
                state: {
                  selectedStudentProfile: {
                    name: safeCaseData.studentName,
                    studentId: safeCaseData.studentId,
                    department: safeCaseData.department,
                    studentEtudiantId: safeCaseData.studentEtudiantId,
                    studentUserId: safeCaseData.studentUserId,
                    source: 'discipline-case',
                  },
                },
              })}
              className="w-full px-3 py-2 text-xs font-medium text-brand bg-brand/5 border border-edge-strong rounded-md hover:bg-brand/10 transition-colors duration-100 text-center"
            >
              View Student Profile
            </button>
          </div>

          {/* ── Evidence ──────────────────────────────────────── */}
          <div className="bg-surface rounded-lg border border-edge shadow-card">
            <div className="px-6 py-4 border-b border-edge-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                <h3 className="text-sm font-semibold text-ink">Evidence</h3>
              </div>
              <span className="text-[11px] font-medium text-ink-muted bg-surface-200 px-2 py-0.5 rounded">
                {safeCaseData.evidence.length} files
              </span>
            </div>
            <ul className="divide-y divide-edge-subtle">
              {safeCaseData.evidence.map((file) => (
                <li key={file.name} className="px-6 py-3 flex items-center gap-3 hover:bg-surface-200/50 transition-colors duration-100">
                  <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center text-ink-tertiary shrink-0">
                    <FileIcon type={file.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{file.name}</p>
                    <p className="text-xs text-ink-muted">{file.type} · {file.size}</p>
                  </div>
                  <button className="p-1.5 rounded-md text-ink-tertiary hover:text-brand hover:bg-brand/5 transition-colors" title="Download">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-6 py-3 border-t border-edge-subtle">
              <button className="w-full px-3 py-2 text-xs font-medium text-ink-secondary bg-surface-200 border border-edge rounded-md hover:bg-surface-300 transition-colors duration-100 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Upload Evidence
              </button>
            </div>
          </div>

          {/* ── Summons / Convocation ─────────────────────────── */}
          {/* Summons section removed - no longer used */}
        </div>
      </div>

      {/* ── Sanction Confirmation Modal ──────────────────────── */}
      {canManageActions && showSanctionModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setShowSanctionModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-lg shadow-card border border-edge w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-danger/5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">Apply Sanction</h3>
                  <p className="text-xs text-ink-tertiary">This action will be recorded permanently.</p>
                </div>
              </div>

              {/* Sanction type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">Sanction Type</label>
                <select className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink focus:ring-2 focus:ring-brand/30 focus:border-brand">
                  <option>Warning</option>
                  <option>Suspension (1 semester)</option>
                  <option>Suspension (1 year)</option>
                  <option>Expulsion</option>
                </select>
              </div>

              {/* Details */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">Decision Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe the sanction and reasoning…"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSanctionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSanctionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-md hover:opacity-90 transition-colors duration-150"
                >
                  Confirm & Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Summons modal removed */}
    </div>
  );
}

