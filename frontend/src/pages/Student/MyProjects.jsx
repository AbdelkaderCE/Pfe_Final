import React, { useCallback, useEffect, useState } from 'react';
import { pfeAPI } from '../../services/pfe';

const STATUS_BADGE = {
  propose: 'bg-amber-100 text-amber-800 border border-amber-200',
  valide: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  reserve: 'bg-blue-100 text-blue-800 border border-blue-200',
  affecte: 'bg-violet-100 text-violet-800 border border-violet-200',
  termine: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const TYPE_BADGE = {
  recherche: 'bg-sky-100 text-sky-700',
  application: 'bg-indigo-100 text-indigo-700',
  etude: 'bg-teal-100 text-teal-700',
  innovation: 'bg-purple-100 text-purple-700',
};

function Badge({ label, className }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Read-only subject card. Subject selection is now an admin-controlled
// affectation (see admin PFE workflow); students only browse the list of
// promo-scoped subjects and see which one they've been assigned to.
function SubjectCard({ subject, isAssigned }) {
  const supervisorName = subject.enseignant?.user
    ? `${subject.enseignant.user.prenom} ${subject.enseignant.user.nom}`.trim()
    : '—';

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm transition ${
        isAssigned
          ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
          : 'border-edge bg-surface hover:border-edge-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-ink truncate">
            {subject.titre_ar || subject.titre_en || `Sujet #${subject.id}`}
          </h3>
          {subject.titre_en && subject.titre_en !== subject.titre_ar && (
            <p className="mt-0.5 text-xs text-ink-tertiary italic truncate">{subject.titre_en}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            label={subject.status}
            className={STATUS_BADGE[subject.status] || 'bg-slate-100 text-slate-600'}
          />
          <Badge
            label={subject.typeProjet || 'application'}
            className={TYPE_BADGE[subject.typeProjet] || 'bg-slate-100 text-slate-600'}
          />
        </div>
      </div>

      {subject.description_ar && (
        <p className="mt-3 text-sm text-ink-secondary line-clamp-2">{subject.description_ar}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-tertiary">
        <span>Supervisor: <strong className="text-ink-secondary">{supervisorName}</strong></span>
        {subject.promo && (
          <span>Promo: <strong className="text-ink-secondary">{subject.promo.nom_ar || subject.promo.nom_en}</strong></span>
        )}
        <span>Groups: <strong className="text-ink-secondary">{subject._count?.groupsPfe ?? 0}/{subject.maxGrps ?? 1}</strong></span>
      </div>

      {isAssigned ? (
        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">
            ✓ Your assigned PFE
          </span>
        </div>
      ) : null}
    </article>
  );
}

export default function MyProjects() {
  const [subjects, setSubjects] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchSubjects = useCallback(async (searchVal, pageVal) => {
    try {
      console.log('[MyProjects] Fetching subjects…');
      const result = await pfeAPI.listSubjects({ search: searchVal || undefined, page: pageVal, limit: 12 });
      setSubjects(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || null);
      console.log(`[MyProjects] Loaded ${result.data?.length} subjects`);
    } catch (err) {
      console.error('[MyProjects] listSubjects error:', err);
      setError('Failed to load PFE subjects. Please try again.');
    }
  }, []);

  const fetchMyGroup = useCallback(async () => {
    try {
      console.log('[MyProjects] Fetching my group…');
      const result = await pfeAPI.getMyGroup();
      setMyGroup(result.data?.group || null);
    } catch (err) {
      // Not in a group yet — not an error
      setMyGroup(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSubjects('', 1), fetchMyGroup()]);
      setLoading(false);
    };
    init();
  }, [fetchSubjects, fetchMyGroup]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
    fetchSubjects(searchInput, 1);
  };

  // Selection has moved to admin-controlled affectation. The student-facing
  // page is now read-only; we keep the data fetch and group display.
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchSubjects(search, newPage);
  };

  const selectedSubjectId = myGroup?.sujetFinal?.id ?? myGroup?.sujetFinalId ?? null;

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
      <header className="rounded-3xl border border-edge bg-surface p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-tertiary">Final Year Project</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">PFE Subjects for Your Promo</h1>
        <p className="mt-1 text-sm text-ink-secondary">Browse the subjects proposed for your promo. Affectation to a subject is decided by the administration.</p>
      </header>

      {/* Current affectation */}
      {myGroup?.sujetFinal && (
        <section className="rounded-2xl border border-brand bg-brand/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Your assigned PFE</p>
          <h2 className="mt-1 text-base font-bold text-ink">
            {myGroup.sujetFinal.titre_ar || myGroup.sujetFinal.titre_en}
          </h2>
          {myGroup.coEncadrant?.user && (
            <p className="mt-1 text-sm text-ink-secondary">
              Supervisor: {myGroup.coEncadrant.user.prenom} {myGroup.coEncadrant.user.nom}
            </p>
          )}
          <p className="mt-1 text-xs text-ink-tertiary">Group: {myGroup.nom_ar || myGroup.nom_en}</p>
        </section>
      )}

      {/* Alerts */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title or description…"
          className="flex-1 rounded-xl border border-control-border bg-surface px-4 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Search
        </button>
      </form>

      {/* Subject list */}
      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-edge bg-surface-200 p-10 text-center text-sm text-ink-tertiary">
          No PFE subjects available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              isAssigned={selectedSubjectId === subject.id}
            />
          ))}
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
