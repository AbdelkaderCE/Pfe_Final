import React from 'react';

const formatGroupe = (groupe) => {
  if (groupe.section && groupe.section !== 'N/A') {
    return `${groupe.promoName} — ${groupe.section}`;
  }
  return groupe.promoName;
};

export default function CourseOverviewCard({ course }) {
  const { moduleName, moduleCode, groupes = [], studentCount = 0 } = course;

  return (
    <article className="bg-surface rounded-lg border border-edge shadow-card p-5 transition-all hover:shadow-card-hover">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-xs font-mono text-ink-tertiary uppercase tracking-wider">
            {moduleCode}
          </p>
          <h3 className="text-base font-semibold text-ink mt-0.5 truncate">
            {moduleName}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-brand leading-none">{studentCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-ink-tertiary mt-1">
            students
          </p>
        </div>
      </header>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-ink-tertiary font-semibold mb-2">
          Assigned groupes ({groupes.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {groupes.map((groupe) => (
            <span
              key={`${groupe.promoId}-${groupe.section || ''}`}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-brand-light text-brand rounded"
            >
              {formatGroupe(groupe)}
            </span>
          ))}
          {groupes.length === 0 && (
            <span className="text-xs text-ink-tertiary italic">No groupes assigned</span>
          )}
        </div>
      </div>
    </article>
  );
}
