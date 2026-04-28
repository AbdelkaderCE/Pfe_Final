import React from 'react';

export default function SupportPage() {
  return (
    <div className="space-y-6 max-w-5xl min-w-0">
      <section className="rounded-2xl border border-edge bg-surface p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Support</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Need Help?</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Contact the platform support team for login issues, account access, role permissions, and academic workflow questions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">Contact Channels</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
            <li>Email: Mohamed.Said.Ghoulam@univ-tiaret.dz</li>
            <li>Phone: +213551818688</li>
            <li>Office: Zaaroura - Tiaret</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">Response Time</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
            <li>Critical access issues: same day</li>
            <li>General requests: within 24-48 hours</li>
            <li>Feature guidance: within 2 business days</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
