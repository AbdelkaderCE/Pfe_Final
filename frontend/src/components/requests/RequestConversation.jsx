import React, { useEffect, useRef } from 'react';

/**
 * Chat/ticket-style conversation for a reclamation or justification.
 *
 * Props:
 *  - request: {
 *      status: 'submitted' | 'under-review' | 'info-requested' | 'resolved' | 'rejected',
 *      studentName, studentId, dateSubmitted, description,
 *      adminResponse?, adminName?, decisionDate?,
 *    }
 *  - variant?: 'admin' | 'student'   (affects which bubble is "self")
 */

const STATUS_META = {
  pending: {
    label: 'Pending Review',
    pillBg: 'bg-yellow-50',
    pillText: 'text-yellow-700',
    pillDot: 'bg-yellow-500',
    pillBorder: 'border-yellow-200',
  },
  approved: {
    label: 'Approved',
    pillBg: 'bg-green-50',
    pillText: 'text-green-700',
    pillDot: 'bg-green-500',
    pillBorder: 'border-green-200',
  },
  rejected: {
    label: 'Rejected',
    pillBg: 'bg-red-50',
    pillText: 'text-red-700',
    pillDot: 'bg-red-500',
    pillBorder: 'border-red-200',
  },
};

export function simplifyStatus(raw) {
  if (raw === 'resolved') return 'approved';
  if (raw === 'rejected') return 'rejected';
  return 'pending';
}

export function isTerminal(raw) {
  const s = simplifyStatus(raw);
  return s === 'approved' || s === 'rejected';
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function formatWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Bubble({ side, name, when, accent = 'neutral', isLast = false, children }) {
  const isRight = side === 'right';
  const tone =
    accent === 'approved'
      ? 'bg-green-50 border-green-200 text-green-900'
      : accent === 'rejected'
        ? 'bg-red-50 border-red-200 text-red-900'
        : isRight
          ? 'bg-brand/5 border-brand/20 text-ink'
          : 'bg-surface-200 border-edge-subtle text-ink';

  const avatarTone = isRight ? 'bg-brand text-surface' : 'bg-surface-300 text-ink-secondary';

  return (
    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'} ${isLast ? 'ring-1 ring-brand/10 rounded-2xl p-1 -m-1' : ''}`}>
      <div className={`flex ${isRight ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm ${avatarTone}`}>
          {initials(name)}
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 shadow-sm transition-all duration-300 ${tone} ${
            isRight ? 'rounded-br-sm' : 'rounded-bl-sm'
          }`}
        >
          <div className={`flex items-center gap-2 mb-1 text-[11px] text-ink-muted ${isRight ? 'justify-end' : ''}`}>
            <span className="font-semibold text-ink-secondary">{name}</span>
            {when ? <span>·</span> : null}
            {when ? <time>{when}</time> : null}
          </div>
          <div className="text-sm whitespace-pre-line leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function RequestConversation({ request, variant = 'admin' }) {
  const scrollRef = useRef(null);
  const status = simplifyStatus(request?.status);
  const meta = STATUS_META[status];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [request?.adminResponse, request?.status, request?.decisionDate]);

  if (!request) return null;

  const hasAdminMessage = Boolean(request.adminResponse);

  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-edge-subtle flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="text-base font-semibold text-ink">Conversation</h2>
        </div>

        <span
          key={status}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-300 animate-[statusPulse_0.4s_ease] ${meta.pillBg} ${meta.pillText} ${meta.pillBorder}`}
          aria-live="polite"
        >
          <span className={`w-2 h-2 rounded-full ${meta.pillDot}`} />
          {meta.label}
        </span>
      </div>

      {/* ── Messages ────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="px-6 py-5 space-y-4 max-h-[480px] overflow-y-auto bg-canvas"
      >
        <Bubble
          side={variant === 'student' ? 'right' : 'left'}
          name={request.studentName || 'Student'}
          when={formatWhen(request.dateSubmitted)}
          isLast={!hasAdminMessage}
        >
          {request.description || '—'}
        </Bubble>

        {hasAdminMessage ? (
          <Bubble
            side={variant === 'student' ? 'left' : 'right'}
            name={request.adminName || 'Administration'}
            when={formatWhen(request.decisionDate || request.dateSubmitted)}
            accent={status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'neutral'}
            isLast
          >
            {request.adminResponse}
          </Bubble>
        ) : (
          <div className="text-center py-3 text-xs text-ink-muted italic">
            {status === 'pending' ? 'No response yet — awaiting review.' : '—'}
          </div>
        )}
      </div>

      {/* ── Locked banner for terminal states ───────────────── */}
      {(status === 'approved' || status === 'rejected') && (
        <div
          className={`px-6 py-3 border-t text-sm flex items-center gap-2 ${
            status === 'approved'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-medium">
            Decision is final — this request cannot be modified.
          </span>
        </div>
      )}
    </div>
  );
}
