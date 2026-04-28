import React, { useEffect, useMemo, useState } from 'react';
import pfeAPI from '../../services/pfe';

function subjectTitle(subject) {
  return subject?.titre_ar || subject?.titre_en || `PFE #${subject?.id}`;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSubjects() {
      try {
        setLoading(true);
        const response = await pfeAPI.listSubjects();
        if (!active) return;
        setSubjects(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Failed to load subjects');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSubjects();

    return () => {
      active = false;
    };
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!statusFilter) return subjects;
    return subjects.filter((subject) => String(subject?.status || '').toLowerCase() === statusFilter.toLowerCase());
  }, [subjects, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Subjects</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">PFE Subjects</h1>
            <p className="mt-2 text-sm text-ink-secondary">Full subject list backed by `PfeSujet`.</p>
          </div>

          <label className="flex items-center gap-3 text-sm text-ink-secondary">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-edge bg-canvas px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="">All</option>
              <option value="propose">Proposed</option>
              <option value="valide">Validated</option>
              <option value="reserve">Reserved</option>
              <option value="affecte">Assigned</option>
              <option value="termine">Completed</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          Loading subjects...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-edge bg-surface shadow-card">
          <table className="min-w-full divide-y divide-edge-subtle text-left text-sm">
            <thead className="bg-canvas/90 text-ink-tertiary">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Teacher</th>
                <th className="px-5 py-3 font-medium">Promo</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Groups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle bg-surface">
              {filteredSubjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="px-5 py-4 text-ink">
                    <div className="font-medium">{subjectTitle(subject)}</div>
                    <div className="mt-1 text-xs text-ink-tertiary">{subject.description_ar || subject.description_en || '—'}</div>
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">
                    {subject.enseignant?.user?.nom} {subject.enseignant?.user?.prenom}
                  </td>
                  <td className="px-5 py-4 text-ink-secondary">{subject.promo?.nom_ar || subject.promo?.nom_en || '—'}</td>
                  <td className="px-5 py-4 text-ink-secondary">{subject.status || '—'}</td>
                  <td className="px-5 py-4 text-ink-secondary">{subject.groupsPfe?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredSubjects.length ? (
            <div className="border-t border-edge-subtle px-5 py-8 text-center text-sm text-ink-secondary">
              No subjects match the selected status.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}