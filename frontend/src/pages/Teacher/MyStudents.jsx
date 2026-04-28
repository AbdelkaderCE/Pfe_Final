import React, { useCallback, useEffect, useState } from 'react';
import { teacherPanelAPI } from '../../services/api';

function Avatar({ name }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
      {initials || '?'}
    </span>
  );
}

function StudentRow({ student }) {
  const fullName = `${student.user?.prenom || ''} ${student.user?.nom || ''}`.trim() || '—';
  const groups = student.groupMembers || [];
  const subject = groups[0]?.group?.sujetFinal;

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} />
          <div>
            <p className="text-sm font-medium text-slate-900">{fullName}</p>
            <p className="text-xs text-slate-500">{student.user?.email || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{student.matricule || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {student.promo?.nom_ar || student.promo?.nom_en || '—'}
      </td>
      <td className="px-4 py-3">
        {subject ? (
          <div>
            <p className="text-sm font-medium text-slate-800 line-clamp-1">
              {subject.titre_ar || subject.titre_en}
            </p>
            {groups[0]?.group && (
              <p className="text-xs text-slate-500">
                {groups[0].group.nom_ar || groups[0].group.nom_en}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">No subject assigned</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{student.user?.telephone || '—'}</td>
    </tr>
  );
}

export default function MyStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchStudents = useCallback(async (searchVal, pageVal) => {
    try {
      console.log(`[MyStudents] Fetching PFE students page=${pageVal} search="${searchVal}"…`);
      const result = await teacherPanelAPI.getStudents({
        search: searchVal || undefined,
        page: pageVal,
        limit: 15,
      });
      setStudents(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || null);
      console.log(`[MyStudents] Loaded ${result.data?.length} students`);
    } catch (err) {
      console.error('[MyStudents] getStudents error:', err);
      setError('Failed to load students. Please try again.');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStudents('', 1);
      setLoading(false);
    };
    init();
  }, [fetchStudents]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
    fetchStudents(searchInput, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchStudents(search, newPage);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">PFE Supervision</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">My Students</h1>
      <header className="rounded-3xl border border-edge bg-surface p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-tertiary">PFE Supervision</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">My Students</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Students working on PFE topics under your supervision.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">Total Supervised</p>
              <p className="text-2xl font-bold text-ink">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">Active Projects</p>
              <p className="text-2xl font-bold text-ink">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">Finalized</p>
              <p className="text-2xl font-bold text-ink">{stats.finalized}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email or matricule…"
          className="flex-1 rounded-xl border border-control-border bg-surface px-4 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Search
        </button>
      </form>

      {/* Table */}
      {students.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No students are currently assigned to your PFE subjects.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Matricule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Promo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">PFE Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge bg-surface">>
              {students.map((student) => (
                <StudentRow key={student.id} student={student} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pagination.totalPages}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
