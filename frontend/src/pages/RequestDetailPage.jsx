/*
  Intent: A single request opened and laid flat — the student reading the
          official response, or reviewing their own submission timeline.
          Formal, clear, respectful. The response box is the centerpiece.
  Access: Student view. Props from parent: request data + onBack.
  Palette: canvas base, surface cards. Semantic for decision colors.
  Depth: shadow-card + border-edge on section cards.
  Typography: Inter. Section headings = text-base font-semibold.
  Spacing: 4px base. Cards p-6. gap-6 between sections.
*/

import React from 'react';
import RequestConversation from '../components/requests/RequestConversation';

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - new Date('2026-02-24').getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ── Status Config ──────────────────────────────────────────── */

const STATUS_CONFIG = {
  draft:          { label: 'Draft',         bg: 'bg-surface-200',                        text: 'text-ink-tertiary', border: 'border-edge',                               dot: 'bg-ink-muted'    },
  submitted:      { label: 'Submitted',     bg: 'bg-brand/5',                            text: 'text-brand',        border: 'border-edge-strong',                       dot: 'bg-brand'        },
  'under-review': { label: 'Under Review',  bg: 'bg-warning/5',                          text: 'text-warning',      border: 'border-edge-strong',                       dot: 'bg-warning'      },
  resolved:       { label: 'Resolved',      bg: 'bg-success/5',                          text: 'text-success',      border: 'border-edge-strong',                       dot: 'bg-success'      },
  rejected:       { label: 'Rejected',      bg: 'bg-danger/5',                           text: 'text-danger',       border: 'border-edge-strong',                       dot: 'bg-danger'       },
};

/* ── Timeline icons ─────────────────────────────────────────── */

const TIMELINE_ICONS = {
  'Submitted':              { color: 'bg-brand/50 text-brand',     icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg> },
  'Under Review':           { color: 'bg-warning/50 text-warning', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg> },
  'Resolved — Approved':    { color: 'bg-success/50 text-success', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  'Resolved — Rejected':    { color: 'bg-danger/50 text-danger',   icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> },
};

const DEFAULT_ICON = { color: 'bg-surface-200 text-ink-tertiary', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };

/* ── File icon ───────────────────────────────────────────────── */
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

/* ── Section wrapper ─────────────────────────────────────────── */
function Section({ title, icon, children }) {
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card">
      <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
        <span className="w-5 h-5 text-ink-tertiary">{icon}</span>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ██  COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function RequestDetailPage({ request, onBack }) {
  const status = STATUS_CONFIG[request?.status] || STATUS_CONFIG.draft;
  const timeline = Array.isArray(request?.timeline) ? request.timeline : [];
  const attachments = Array.isArray(request?.attachments) ? request.attachments : [];

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
          Back to My Requests
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-ink-muted">{request.id}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded ${status.bg} ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-ink tracking-tight">{request.title}</h1>
            <p className="text-sm text-ink-tertiary mt-1">
              {request.type} · Submitted {formatDate(request.dateSubmitted)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Deadline Warning ──────────────────────────────────── */}
      {request.linkedExam && request.status !== 'resolved' && request.status !== 'rejected' && (
        <div className="bg-warning/5 border border-edge-strong rounded-lg px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-warning">
              {daysUntil(request.linkedExam.deadline)} days remaining to appeal
            </p>
            <p className="text-xs text-warning mt-0.5">
              Linked to: {request.linkedExam.name} — Deadline: {formatDate(request.linkedExam.deadline)}
            </p>
          </div>
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Conversation (chat/ticket view) ─────────────────── */}
          <RequestConversation
            variant="student"
            request={{
              status: request.status,
              description: request.description,
              studentName: request.studentName || 'You',
              studentId: request.studentId,
              dateSubmitted: request.dateSubmitted,
              adminResponse: request.adminResponse?.message || null,
              adminName: request.adminResponse?.respondedBy || 'Administration',
              decisionDate: request.adminResponse?.date || request.lastUpdated || null,
            }}
          />

          {/* ── Meta ─────────────────────────────────────────────── */}
          <Section
            title="Request Details"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
          >
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-ink-muted">Type</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{request.type}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Last Updated</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{formatDateShort(request.lastUpdated)}</p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Right — 1/3 sidebar */}
        <div className="space-y-6">

          {/* ── Status Timeline ────────────────────────────────── */}
          <div className="bg-surface rounded-lg border border-edge shadow-card">
            <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
              <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-ink">Timeline</h3>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-edge" />
                <ul className="space-y-5">
                  {timeline.map((step, i) => {
                    const iconCfg = TIMELINE_ICONS[step.event] || DEFAULT_ICON;
                    return (
                      <li key={i} className="relative flex gap-3">
                        <div className={`relative z-10 w-8 h-8 rounded-full ${iconCfg.color} flex items-center justify-center shrink-0`}>
                          {iconCfg.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink">{step.event}</p>
                          <p className="text-xs text-ink-tertiary mt-0.5">{step.by} · {formatDateShort(step.date)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Attachments ────────────────────────────────────── */}
          {attachments.length > 0 && (
            <div className="bg-surface rounded-lg border border-edge shadow-card">
              <div className="px-6 py-4 border-b border-edge-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  <h3 className="text-sm font-semibold text-ink">Attachments</h3>
                </div>
                <span className="text-[11px] font-medium text-ink-muted bg-surface-200 px-2 py-0.5 rounded">
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="divide-y divide-edge-subtle">
                {attachments.map((file) => (
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
            </div>
          )}

          {/* ── Need Help ──────────────────────────────────────── */}
          <div className="bg-surface rounded-lg border border-edge shadow-card p-6 text-center">
            <svg className="w-7 h-7 text-ink-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-ink">Need help?</p>
            <p className="text-xs text-ink-tertiary mt-1">
              Contact the Student Affairs Office or visit the Dean's office for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

