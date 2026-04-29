/*
  Intent: The administrator's inbox — a registrar processing student grievances.
          Sorted by urgency, filterable by type. Three decisive actions per request:
          Approve, Reject, Request More Info. An internal notes field hidden from
          students lets staff coordinate. Efficient, authoritative, never rushed.
  Access: Teacher / Admin only.
  Palette: canvas base, surface cards. Semantic for decisions. Brand for actions.
  Depth: shadow-card + border-edge on cards.
  Typography: Inter. Section headings = text-base font-semibold. Body = text-sm.
  Spacing: 4px base. Cards p-6. gap-6 between sections.
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request, { resolveMediaUrl } from '../services/api';
import aiAPI from '../services/ai';
import RequestConversation, { isTerminal } from '../components/requests/RequestConversation';

/* ── Status Config ──────────────────────────────────────────── */

const STATUS_CONFIG = {
  submitted:        { label: 'New',             bg: 'bg-brand/5',     text: 'text-brand',      border: 'border-edge-strong', dot: 'bg-brand'   },
  'under-review':   { label: 'Under Review',    bg: 'bg-warning/5',   text: 'text-warning',    border: 'border-edge-strong', dot: 'bg-warning' },
  'info-requested': { label: 'Info Requested',  bg: 'bg-surface-200', text: 'text-ink-secondary', border: 'border-edge-strong', dot: 'bg-ink-tertiary' },
  resolved:         { label: 'Approved',        bg: 'bg-success/5',   text: 'text-success',    border: 'border-edge-strong', dot: 'bg-success' },
  rejected:         { label: 'Rejected',        bg: 'bg-danger/5',    text: 'text-danger',     border: 'border-edge-strong', dot: 'bg-danger'  },
};

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - new Date('2026-02-24').getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysSince(dateStr) {
  const diff = new Date('2026-02-24').getTime() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/* ── Sub-components ─────────────────────────────────────────── */

function AIInsightsPanel({ requestData }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    if (!requestData?.description && !requestData?.title) return;
    try {
      setLoading(true);
      setError(null);
      const res = await aiAPI.analyzeReclamation({
        reclamation_id: requestData.requestId || requestData.id,
        text_content: requestData.description || requestData.title,
        user_role: 'admin'
      });
      setInsights(res?.data || null);
    } catch (err) {
      console.error('AI Insight Error:', err);
      setError('AI Service is starting up or unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [requestData?.id, requestData?.requestId]);

  return (
    <div className="bg-brand/5 border border-brand/20 rounded-lg overflow-hidden shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-brand/10 bg-brand/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <h3 className="text-[10px] font-bold text-brand uppercase tracking-widest">AI Copilot</h3>
        </div>
        {!insights && !loading && (
          <button 
            onClick={runAnalysis}
            className="text-[10px] font-bold text-brand hover:underline"
          >
            RETRY ANALYSIS
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 w-full bg-brand/10 rounded" />
            <div className="h-3 w-4/5 bg-brand/10 rounded" />
          </div>
        ) : error ? (
          <p className="text-[10px] text-ink-tertiary italic">{error}</p>
        ) : insights ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-brand/60 uppercase font-bold mb-1">Sentiment</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{insights.sentiment === 'positive' ? '😊' : insights.sentiment === 'negative' ? '😟' : '😐'}</span>
                  <span className="text-sm font-semibold capitalize text-ink">{insights.sentiment || 'neutral'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-brand/60 uppercase font-bold mb-1">Safety</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${insights.is_safe ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {insights.is_safe ? '✓ SAFE' : '⚠ FLAGGED'}
                </span>
              </div>
            </div>
            <div className="pt-3 border-t border-brand/10">
              <p className="text-xs text-ink-secondary italic leading-relaxed">
                "{insights.summary || 'The student is reporting a family emergency. This usually requires immediate attention.'}"
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-ink-tertiary italic">Select a request to see AI insights.</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon, accent = 'brand' }) {
  const accents = {
    brand:   'bg-brand/10 text-brand',
    warning: 'bg-warning/10 text-warning',
    danger:  'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
    violet:  'bg-surface-200 text-ink-secondary',
  };
  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${accents[accent]} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink tracking-tight">{value}</p>
        <p className="text-xs text-ink-tertiary mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function FileIcon({ type }) {
  if (type === 'Image') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function SourceBadge({ source }) {
  if (source === 'guest') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
        Guest
      </span>
    );
  }
  if (source === 'user') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
        User
      </span>
    );
  }
  return null;
}

function isImageAttachment(file) {
  if (file?.isImage) return true;
  const type = String(file?.type || '').toLowerCase();
  const mime = String(file?.mimeType || '').toLowerCase();
  return type === 'image' || mime.startsWith('image/');
}

function resolveAttachmentUrl(file) {
  const raw = file?.url || file?.downloadUrl || file?.publicUrl || '';
  if (!raw) return '';
  return resolveMediaUrl(raw);
}

/* ════════════════════════════════════════════════════════════════
   ██  MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function AdminRequestsPage() {
  const navigate = useNavigate();
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');
  const [actionModal, setActionModal] = useState(null);      // { type: 'approve' | 'reject' | 'info', request }
  const [responseText, setResponseText] = useState('');
  const [internalNote, setInternalNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await request('/api/v1/requests/admin/inbox');
        setInbox(Array.isArray(res?.data) ? res.data : []);
        setLoadError('');
      } catch (error) {
        if (error?.status === 401) {
          navigate('/login', {
            replace: true,
            state: { from: { pathname: '/dashboard/requests' } },
          });
          return;
        }

        if (error?.code === 'NETWORK_ERROR') {
          setLoadError('Cannot reach backend API. Start the backend server on port 5000, then reload this page.');
          return;
        }

        setLoadError(error?.message || 'Failed to load admin inbox.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const submitDecision = async () => {
    if (!actionModal?.request || actionLoading) return;

    const target = actionModal.request;
    const basePath =
      target.category === 'justification'
        ? `/api/v1/requests/admin/justifications/${target.requestId}/decision`
        : target.category === 'submission'
          ? `/api/v1/requests/admin/submissions/${target.requestId}/decision`
          : target.category === 'guest_submission'
            ? `/api/v1/requests/admin/guest-submissions/${target.requestId}/decision`
            : `/api/v1/requests/admin/reclamations/${target.requestId}/decision`;

    const action = actionModal.type === 'approve'
      ? 'approve'
      : actionModal.type === 'reject'
        ? 'reject'
        : 'info';

    try {
      setActionLoading(true);
      await request(basePath, {
        method: 'POST',
        body: JSON.stringify({
          action,
          responseText,
        }),
      });

      const nextStatus =
        action === 'approve' ? 'resolved' : action === 'reject' ? 'rejected' : 'info-requested';

      setInbox((prev) => prev.map((item) => (
        item.requestId === target.requestId && item.category === target.category
          ? {
              ...item,
              status: nextStatus,
              internalNotes: responseText || item.internalNotes,
            }
          : item
      )));

      setSelectedRequest((prev) => {
        if (!prev) return prev;
        if (prev.requestId !== target.requestId || prev.category !== target.category) return prev;
        return {
          ...prev,
          status: nextStatus,
          internalNotes: responseText || prev.internalNotes,
        };
      });

      setActionModal(null);
      setResponseText('');
    } catch (error) {
      if (error?.status === 401) {
        navigate('/login', {
          replace: true,
          state: { from: { pathname: '/dashboard/requests' } },
        });
        return;
      }

      if (error?.code === 'NETWORK_ERROR') {
        alert('Backend API is unreachable. Start the backend server and try again.');
        return;
      }

      if (error?.status === 409 || error?.code === 'ALREADY_PROCESSED') {
        alert(error?.message || 'This request has already been finalized. Decisions are locked.');
        setActionModal(null);
        return;
      }

      alert(error?.message || 'Failed to process request decision.');
    } finally {
      setActionLoading(false);
    }
  };

  /* Filters */
  const activeRequests = inbox.filter((r) => {
    if (filterType === 'justifications') return r.category === 'justification';
    if (filterType === 'reclamations') return r.category === 'reclamation';
    if (filterType === 'other') return !['justification', 'reclamation'].includes(r.category);
    return true;
  });

  /* Sort */
  const sorted = [...activeRequests].sort((a, b) => {
    if (sortBy === 'urgency') {
      const priorityOrder = { high: 0, normal: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.dateSubmitted).getTime() - new Date(b.dateSubmitted).getTime();
    }
    return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
  });

  const stats = {
    total: inbox.length,
    newCount: inbox.filter((r) => r.status === 'submitted').length,
    reviewing: inbox.filter((r) => r.status === 'under-review').length,
    infoReq: inbox.filter((r) => r.status === 'info-requested').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <section className="space-y-4">
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-md border border-edge px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-200"
        >
          Reload
        </button>
      </section>
    );
  }

  /* ── Action Modal ────────────────────────────────────────── */
  const actionModalJSX = actionModal && (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setActionModal(null)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl shadow-card border border-edge w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              actionModal.type === 'approve' ? 'bg-success/10' :
              actionModal.type === 'reject' ? 'bg-danger/10' : 'bg-surface-200'
            }`}>
              {actionModal.type === 'approve' && (
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {actionModal.type === 'reject' && (
                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              )}
              {actionModal.type === 'info' && (
                <svg className="w-5 h-5 text-ink-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">
                {actionModal.type === 'approve' && 'Approve Request'}
                {actionModal.type === 'reject' && 'Reject Request'}
                {actionModal.type === 'info' && 'Request More Information'}
              </h3>
              <p className="text-xs text-ink-tertiary">
                {actionModal.type === 'approve' && 'This will notify the student that their request has been approved.'}
                {actionModal.type === 'reject' && 'This will notify the student that their request has been rejected.'}
                {actionModal.type === 'info' && 'Ask the student to provide additional documentation or details.'}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              {actionModal.type === 'info' ? 'What information do you need?' : 'Response to Student'}
            </label>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={
                actionModal.type === 'approve' ? 'Your request has been approved. Your records have been updated accordingly.'
                : actionModal.type === 'reject' ? 'Provide a reason for the rejection…'
                : 'Please provide the following documents: …'
              }
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setActionModal(null)}
              className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={submitDecision}
              disabled={actionLoading}
              className={`px-4 py-2 text-sm font-medium text-surface rounded-md transition-colors duration-150 ${
                actionLoading
                  ? 'opacity-60 cursor-not-allowed bg-surface-300 text-ink-muted'
                  :
                actionModal.type === 'approve' ? 'bg-success hover:opacity-90'
                : actionModal.type === 'reject' ? 'bg-danger hover:opacity-90'
                : 'bg-brand hover:bg-brand-hover'
              }`}
            >
              {actionLoading ? 'Processing...' : (
                <>
                  {actionModal.type === 'approve' && 'Confirm Approval'}
                  {actionModal.type === 'reject' && 'Confirm Rejection'}
                  {actionModal.type === 'info' && 'Send Request'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Detail / Review Panel ─────────────────────────────────── */
  if (selectedRequest) {
    const req = selectedRequest;
    const aging = daysSince(req.dateSubmitted);
    const attachments = Array.isArray(req.attachments) ? req.attachments : [];

    return (
    <>
      <div className="space-y-6">
        <button
          onClick={() => setSelectedRequest(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink transition-colors duration-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Inbox
        </button>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-ink-muted">{req.id}</span>
              <StatusBadge status={req.status} />
              {req.priority === 'high' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-danger bg-danger/5 border border-edge-strong rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                  HIGH PRIORITY
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-ink tracking-tight">{req.title}</h1>
            <p className="text-sm text-ink-tertiary mt-1">
              by {req.studentName} ({req.studentId}) · {req.department} · {formatDate(req.dateSubmitted)}
              {aging > 3 && (
                <span className="text-warning font-medium"> · {aging} days pending</span>
              )}
            </p>
          </div>

          {/* Decision buttons — hidden once the request is finalized (approved/rejected) */}
          {isTerminal(req.status) ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold bg-surface-200 border-edge text-ink-tertiary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Decision locked
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActionModal({ type: 'info', request: req }); setResponseText(''); }}
                className="px-4 py-2 text-sm font-medium text-ink-secondary bg-surface-200 border border-edge rounded-md hover:bg-surface-300 transition-colors duration-150 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Request Info
              </button>
              <button
                onClick={() => { setActionModal({ type: 'reject', request: req }); setResponseText(''); }}
                className="px-4 py-2 text-sm font-medium text-danger bg-danger/5 border border-edge-strong rounded-md hover:bg-danger/10 transition-colors duration-150 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
              <button
                onClick={() => { setActionModal({ type: 'approve', request: req }); setResponseText(''); }}
                className="px-4 py-2 text-sm font-medium text-surface bg-success rounded-md hover:opacity-90 transition-colors duration-150 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Approve
              </button>
            </div>
          )}
        </div>

        {/* Deadline warning */}
        {req.linkedExam && (
          <div className="bg-warning/5 border border-edge-strong rounded-lg px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-warning">
                Appeal deadline: {daysUntil(req.linkedExam.deadline)} days remaining
              </p>
              <p className="text-xs text-warning mt-0.5">
                Linked to: {req.linkedExam.name} — Deadline: {formatDate(req.linkedExam.deadline)}
              </p>
            </div>
          </div>
        )}

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left */}
          <div className="lg:col-span-2 space-y-6">

            {/* Conversation (chat/ticket view) */}
            <RequestConversation
              variant="admin"
              request={{
                status: req.status,
                description: req.description,
                studentName: req.studentName,
                studentId: req.studentId,
                dateSubmitted: req.dateSubmitted,
                adminResponse: req.internalNotes || null,
                adminName: 'Administration',
                decisionDate: req.decisionDate || req.updatedAt || null,
              }}
            />

            {/* Attachments (kept separate from the chat panel) */}
            {attachments.length > 0 && (
              <div className="bg-surface rounded-lg border border-edge shadow-card">
                <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
                  <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <h2 className="text-base font-semibold text-ink">Attachments</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attachments.map((file, index) => {
                      const fileUrl = resolveAttachmentUrl(file);
                      const canOpen = Boolean(fileUrl);
                      const isImage = isImageAttachment(file);

                      return (
                        <div key={`${file.id || file.name || 'file'}-${index}`} className="rounded-lg border border-edge-subtle bg-surface-200 p-3">
                          {isImage && canOpen ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block mb-2 overflow-hidden rounded-md border border-edge-subtle bg-surface">
                              <img
                                src={fileUrl}
                                alt={file.name || 'Attachment preview'}
                                className="h-28 w-full object-cover"
                              />
                            </a>
                          ) : null}

                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 text-ink-tertiary"><FileIcon type={file.type} /></div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-ink truncate">{file.name || 'Attachment'}</p>
                              <p className="text-[11px] text-ink-muted">
                                {file.type || 'Document'}{file.size ? ` · ${file.size}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            {canOpen ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 text-[11px] font-medium text-brand bg-brand/5 rounded-md hover:bg-brand/10 transition-colors"
                              >
                                Preview
                              </a>
                            ) : null}
                            {canOpen ? (
                              <a
                                href={fileUrl}
                                download={file.name || undefined}
                                className="px-2.5 py-1 text-[11px] font-medium text-ink-secondary bg-surface rounded-md hover:bg-surface-200 transition-colors"
                              >
                                Download
                              </a>
                            ) : (
                              <span className="text-[11px] text-ink-muted">File link unavailable</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Internal Notes (staff only) */}
            <div className="bg-surface rounded-lg border border-edge shadow-card">
              <div className="px-6 py-4 border-b border-edge-subtle flex items-center gap-2">
                <svg className="w-5 h-5 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <h2 className="text-base font-semibold text-ink">Internal Notes</h2>
                <span className="text-[10px] font-medium text-ink-muted bg-surface-200 px-2 py-0.5 rounded ml-auto">STAFF ONLY</span>
              </div>
              <div className="p-6">
                {req.internalNotes && (
                  <div className="bg-warning/5 border border-edge-strong rounded-lg p-3 mb-4">
                    <p className="text-sm text-ink-secondary italic">{req.internalNotes}</p>
                  </div>
                )}
                <textarea
                  rows={3}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add a private note for other staff members… (not visible to students)"
                  className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-colors duration-150 resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <button className="px-3 py-1.5 text-xs font-medium text-ink-secondary bg-surface border border-edge rounded-md hover:bg-surface-200 transition-colors duration-150">
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <AIInsightsPanel requestData={req} />
            <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                  <span className="text-sm font-bold text-brand">
                    {req.studentName.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{req.studentName}</p>
                    <SourceBadge source={req.submitterSource} />
                  </div>
                  <p className="text-xs text-ink-tertiary">{req.studentId} · {req.department}</p>
                  {req.submitterSource === 'guest' && req.guestEmail && (
                    <p className="text-xs text-ink-secondary mt-1">📧 {req.guestEmail}</p>
                  )}
                </div>
              </div>
              {/* View Student Profile — only for authenticated submitters with a known userId */}
              {req.submitterSource !== 'guest' && req.studentUserId ? (
                <button
                  onClick={() => navigate(`/admin/users/${req.studentUserId}`)}
                  className="w-full px-3 py-2 text-xs font-medium text-brand bg-brand/5 border border-edge-strong rounded-md hover:bg-brand/10 transition-colors duration-100 text-center"
                >
                  View Student Profile
                </button>
              ) : req.submitterSource === 'guest' ? (
                <div className="w-full px-3 py-2 text-xs text-ink-muted bg-surface-200 border border-edge rounded-md text-center">
                  <p className="font-medium">Guest submission</p>
                  {req.guestEmail && <p className="mt-0.5">📧 {req.guestEmail}</p>}
                </div>
              ) : null}
            </div>

            {/* Request meta */}
            <div className="bg-surface rounded-lg border border-edge shadow-card p-6 space-y-3">
              <div>
                <p className="text-xs text-ink-muted">Request ID</p>
                <p className="text-sm font-mono font-medium text-ink mt-0.5">{req.id}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Type</p>
                <p className="text-sm font-medium text-ink mt-0.5">{req.type}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Submitted</p>
                <p className="text-sm font-medium text-ink mt-0.5">{formatDate(req.dateSubmitted)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Age</p>
                <p className={`text-sm font-medium mt-0.5 ${aging > 5 ? 'text-warning' : 'text-ink'}`}>
                  {aging} day{aging !== 1 ? 's' : ''}
                  {aging > 5 && ' — overdue'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {actionModalJSX}
    </>
    );
  }

  /* ── Inbox List (Default) ──────────────────────────────────── */
  return (
    <>
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">Requests Management</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          Review and process student requests, justifications, and grade reclamations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Inbox"
          value={stats.total}
          accent="brand"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>}
        />
        <StatCard
          label="New (Unprocessed)"
          value={stats.newCount}
          accent="warning"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>}
        />
        <StatCard
          label="Under Review"
          value={stats.reviewing}
          accent="brand"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
        />
        <StatCard
          label="Info Requested"
          value={stats.infoReq}
          accent="violet"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>}
        />
      </div>

      {/* Filters + Table */}
      <div className="bg-surface rounded-lg border border-edge shadow-card">
        <div className="px-6 py-4 border-b border-edge-subtle flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Quick filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all', label: 'All Requests' },
              { key: 'justifications', label: 'Justifications' },
              { key: 'reclamations', label: 'Reclamations' },
              { key: 'other', label: 'Other' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-100 ${
                  filterType === f.key
                    ? 'bg-brand text-surface shadow-sm'
                    : 'text-ink-secondary bg-surface-200 hover:bg-surface-300 hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="sm:ml-auto flex items-center gap-2">
            <span className="text-xs text-ink-muted">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm bg-control-bg border border-control-border rounded-md text-ink-secondary focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            >
              <option value="urgency">Urgency</option>
              <option value="date">Newest First</option>
            </select>
          </div>
        </div>

        {/* Inbox table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-edge-subtle">
                <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Request</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">Student</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <svg className="w-10 h-10 text-ink-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                    </svg>
                    <p className="text-sm font-medium text-ink-secondary">No requests found</p>
                    <p className="text-xs text-ink-muted mt-1">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                sorted.map((req) => {
                  const aging = daysSince(req.dateSubmitted);
                  const overdue = aging > 5 && req.status !== 'resolved' && req.status !== 'rejected';

                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`hover:bg-surface-200/50 transition-colors duration-100 cursor-pointer ${overdue ? 'bg-warning/5' : ''}`}
                    >
                      {/* Request */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          {req.priority === 'high' && (
                            <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title="High priority" />
                          )}
                          <span className="font-mono text-xs text-ink-muted">{req.id}</span>
                        </div>
                        <p className="font-medium text-ink text-sm">{req.title}</p>
                        <p className="text-xs text-ink-tertiary mt-0.5">{req.type}</p>
                        {req.linkedExam && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-warning">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {daysUntil(req.linkedExam.deadline)}d left
                          </span>
                        )}
                      </td>

                      {/* Student */}
                      <td className="px-6 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-ink">{req.studentName}</p>
                          <SourceBadge source={req.submitterSource} />
                        </div>
                        <p className="text-xs text-ink-muted">{req.studentId} · {req.department}</p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        <StatusBadge status={req.status} />
                        {overdue && (
                          <p className="text-[10px] text-warning font-medium mt-1">{aging}d pending</p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-ink-tertiary text-xs">{formatDate(req.dateSubmitted)}</span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                          className="px-3 py-1.5 text-xs font-medium text-brand bg-brand/5 border border-edge-strong rounded-md hover:bg-brand/10 transition-colors duration-100"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-edge-subtle flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            Showing {sorted.length} of {inbox.length} requests
          </p>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 text-xs font-medium text-ink-tertiary bg-surface-200 rounded hover:bg-surface-300 transition-colors">Prev</button>
            <button className="px-2.5 py-1 text-xs font-medium text-surface bg-brand rounded shadow-sm">1</button>
            <button className="px-2.5 py-1 text-xs font-medium text-ink-tertiary bg-surface-200 rounded hover:bg-surface-300 transition-colors">Next</button>
          </div>
        </div>
      </div>

      </div>
      {actionModalJSX}
    </>
  );
}

