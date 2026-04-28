import React from 'react';
import EmptyState from '../EmptyState';

const Avatar = ({ name }) => {
  const initials = String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-brand">{initials || '?'}</span>
    </div>
  );
};

const formatGroupe = (promo) => {
  if (!promo) return '—';
  if (promo.section && promo.section !== 'N/A') {
    return `${promo.nom} — ${promo.section}`;
  }
  return promo.nom || '—';
};

export default function StudentsTable({ students = [], loading = false, onReport }) {
  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-edge p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!students.length) {
    return (
      <EmptyState
        title="No students match your filters"
        description="Try clearing a filter or pick a different course / groupe."
      />
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-edge overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-canvas border-b border-edge">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Groupe</th>
              <th className="px-4 py-3">Promo</th>
              <th className="px-4 py-3">Matricule</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-subtle">
            {students.map((student) => {
              const fullName = `${student.prenom || ''} ${student.nom || ''}`.trim();
              return (
                <tr key={student.id} className="hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={fullName} />
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate">{fullName || '—'}</p>
                        <p className="text-xs text-ink-tertiary truncate">{student.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{formatGroupe(student.promo)}</td>
                  <td className="px-4 py-3 text-ink-secondary">{student.promo?.nom || '—'}</td>
                  <td className="px-4 py-3 text-ink-tertiary font-mono text-xs">
                    {student.matricule || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onReport?.(student)}
                      className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-md hover:bg-danger/10 transition-colors"
                    >
                      Report
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
