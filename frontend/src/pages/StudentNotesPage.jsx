import React, { useEffect, useState } from 'react';
import request from '../services/api';

export default function StudentNotesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ moyenneGenerale: 0, modules: [] });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await request('/api/v1/student/notes');
        if (!cancelled) {
          setData(res?.data || { moyenneGenerale: 0, modules: [] });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load notes');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl min-w-0">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">My Notes</h1>
        <p className="mt-1 text-sm text-ink-tertiary">View your global average and module-level grading information.</p>
      </div>

      {loading && (
        <div className="rounded-lg border border-edge bg-surface p-6 text-sm text-ink-secondary">Loading notes...</div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-edge-strong bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="rounded-lg border border-edge bg-surface p-5 shadow-card">
            <p className="text-xs uppercase tracking-wider text-ink-muted">Global Average</p>
            <p className="mt-2 text-3xl font-bold text-brand">{Number(data?.moyenneGenerale || 0).toFixed(2)} / 20</p>
          </div>

          <div className="rounded-lg border border-edge bg-surface shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge-subtle">
                  <th className="px-5 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Module</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Code</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-ink-muted uppercase tracking-wider">Semester</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-ink-muted uppercase tracking-wider">Credit</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-ink-muted uppercase tracking-wider">Coef</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-ink-muted uppercase tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {(data?.modules || []).map((module) => (
                  <tr key={module.id} className="hover:bg-surface-200/50">
                    <td className="px-5 py-3 font-medium text-ink">{module.nom}</td>
                    <td className="px-5 py-3 text-ink-secondary">{module.code}</td>
                    <td className="px-5 py-3 text-center text-ink-secondary">{module.semestre || '-'}</td>
                    <td className="px-5 py-3 text-center text-ink-secondary">{module.credit}</td>
                    <td className="px-5 py-3 text-center text-ink-secondary">{module.coef}</td>
                    <td className="px-5 py-3 text-center font-medium text-ink">
                      {module.note == null ? 'N/A' : Number(module.note).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

