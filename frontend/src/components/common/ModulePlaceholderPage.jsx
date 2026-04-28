import React from 'react';

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-edge bg-canvas/90 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-tertiary">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  );
}

export default function ModulePlaceholderPage({
  eyebrow = 'Workspace',
  title,
  description,
  stats = [],
  checklist = [],
  accent = 'brand',
}) {
  const accentClasses = {
    brand: 'from-brand/20 via-sky-500/10 to-transparent text-brand',
    success: 'from-emerald-500/20 via-emerald-400/10 to-transparent text-emerald-600',
    warning: 'from-amber-500/20 via-amber-400/10 to-transparent text-amber-600',
  };

  const accentClass = accentClasses[accent] || accentClasses.brand;

  return (
    <div className="space-y-6 max-w-6xl min-w-0">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface shadow-card">
        <div className={`absolute inset-0 bg-gradient-to-br ${accentClass}`} />
        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-secondary">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary md:text-base">{description}</p>
          </div>

          {stats.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <div className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Design Ready, Data Pending</h2>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            This page now has production-grade structure and styling. The next step is connecting the real API and replacing the mock summary with live academic data.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-edge bg-canvas px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Current State</p>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">
                The module has layout, hierarchy, and dashboard presence, so users no longer hit an empty placeholder wall.
              </p>
            </div>
            <div className="rounded-2xl border border-edge bg-canvas px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Next Integration</p>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">
                Wire the backend endpoints, table actions, and permission rules when the business flow for this module is finalized.
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Suggested Next Steps</h2>
          <div className="mt-4 space-y-3">
            {(checklist.length ? checklist : [
              'Connect this page to the real backend endpoint.',
              'Add filters, actions, and empty-state handling.',
              'Translate field labels and role-specific copy.',
            ]).map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-edge bg-canvas px-4 py-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand">•</span>
                <p className="text-sm leading-6 text-ink-secondary">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
