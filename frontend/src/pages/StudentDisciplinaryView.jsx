/*
  Intent: Student-facing disciplinary view — restricted, notification-only.
          Students should NOT see case lists or admin controls.
          They see their own notifications: hearing dates, appeal rights, case status.
          Calm, non-threatening. Informational, not accusatory.
  Access: Student only.
  Palette: canvas base, surface cards. Neutral tones. Blue for info.
  Depth: shadow-card + border-edge.
  Typography: Inter. Headings text-base font-semibold.
*/

import React, { useState, useEffect } from 'react';
import request from '../services/api';

/* ── Mock student notifications ─────────────────────────────── */
/* Data fetched from API — see component useEffect */

/* ── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ── Notification type config ───────────────────────────────── */

const TYPE_CONFIG = {
  hearing: {
    bg: 'bg-brand-light',
    border: 'border-edge-strong',
    iconBg: 'bg-brand-light text-brand',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  decision: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    iconBg: 'bg-warning/20 text-warning',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-surface-200',
    border: 'border-edge',
    iconBg: 'bg-surface-300 text-ink-tertiary',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
};

/* ── Component ──────────────────────────────────────────────── */

export default function StudentDisciplinaryView() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await request('/api/v1/disciplinary/notifications');
        setNotifications(Array.isArray(res?.data) ? res.data : []);
      } catch {
        /* endpoint may not exist yet */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">Disciplinary Notifications</h1>
        <p className="text-sm text-ink-tertiary mt-1">
          Official notices related to your disciplinary record. Contact the Dean's office for any questions.
        </p>
      </div>

      {/* ── Info Banner ─────────────────────────────────────── */}
      <div className="bg-brand-light border border-edge-strong rounded-lg p-4 flex gap-3">
        <div className="shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-brand">Your Rights</p>
          <p className="text-sm text-ink-secondary mt-0.5 leading-relaxed">
            You have the right to be heard, to present evidence in your defense, and to be accompanied by a representative 
            during any hearing. You may file an appeal within 15 days of any decision.
          </p>
        </div>
      </div>

      {/* ── Unread counter ──────────────────────────────────── */}
      {unread > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <p className="text-sm font-medium text-ink">
            {unread} unread notification{unread !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── Notification Cards ──────────────────────────────── */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-ink-muted">No disciplinary notifications.</div>
        ) : notifications.map((notif) => {
          const cfg = TYPE_CONFIG[notif.type];

          return (
            <div
              key={notif.id}
              className={`bg-surface rounded-lg border shadow-card overflow-hidden transition-all duration-150 ${
                notif.read ? 'border-edge' : `border-l-4 ${cfg.border}`
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-semibold ${notif.read ? 'text-ink-secondary' : 'text-ink'}`}>
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-surface bg-danger rounded">NEW</span>
                      )}
                    </div>
                    <p className="text-sm text-ink-secondary mt-1 leading-relaxed">{notif.description}</p>
                    <p className="text-xs text-ink-muted mt-2">{formatDate(notif.date)}</p>

                    {/* ── Hearing Details ──────────────────── */}
                    {notif.type === 'hearing' && notif.hearingDate && (
                      <div className="mt-3 bg-brand-light border border-edge-strong rounded-lg p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-ink-muted">Hearing Date</p>
                            <p className="text-sm font-semibold text-brand mt-0.5">{formatDate(notif.hearingDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-muted">Location</p>
                            <p className="text-sm font-medium text-ink mt-0.5">{notif.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-muted">Days Until</p>
                            <p className="text-sm font-semibold text-ink mt-0.5">
                              {daysUntil(notif.hearingDate)} days
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Decision Details ─────────────────── */}
                    {notif.type === 'decision' && (
                      <div className="mt-3 bg-warning/10 border border-warning/20 rounded-lg p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-ink-muted">Decision</p>
                            <p className="text-sm font-semibold text-warning mt-0.5">{notif.verdict}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-muted">Appeal Deadline</p>
                            <p className="text-sm font-semibold text-ink mt-0.5">
                              {formatDate(notif.appealDeadline)}
                              <span className="text-xs text-ink-muted font-normal ml-1">
                                ({daysUntil(notif.appealDeadline)} days remaining)
                              </span>
                            </p>
                          </div>
                        </div>
                        <button className="mt-3 px-4 py-2 text-sm font-medium text-brand bg-surface border border-edge-strong rounded-md hover:bg-surface-200 transition-colors duration-150 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          File an Appeal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      }
      </div>

      {/* ── Contact Box ─────────────────────────────────────── */}
      <div className="bg-surface rounded-lg border border-edge shadow-card p-6 text-center">
        <svg className="w-8 h-8 text-ink-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <p className="text-sm font-medium text-ink">Need help?</p>
        <p className="text-xs text-ink-tertiary mt-1 max-w-md mx-auto">
          For questions about your case or your rights, contact the Student Affairs Office at the Dean's office, 
          or email <span className="text-brand font-medium">student.affairs@univ-tiaret.dz</span>
        </p>
      </div>
    </div>
  );
}

