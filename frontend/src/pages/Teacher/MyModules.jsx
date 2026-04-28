import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, GraduationCap, Calendar, Filter } from 'lucide-react';
import { academicAPI } from '../../services/api';

const TYPE_BADGE = {
  cours: 'bg-indigo-100 text-indigo-700',
  td: 'bg-emerald-100 text-emerald-700',
  tp: 'bg-amber-100 text-amber-700',
  online: 'bg-sky-100 text-sky-700',
};

const formatPromo = (promo) => {
  if (!promo) return '—';
  const base = promo.nom_ar || promo.nom_en || `Promo ${promo.id}`;
  return promo.section ? `${base} · ${promo.section}` : base;
};

const formatModule = (mod) => {
  if (!mod) return '—';
  const name = mod.nom_ar || mod.nom_en || '';
  return mod.code ? `${mod.code} — ${name}` : name;
};

export default function TeacherMyModules() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [years, setYears] = useState([]);
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const yrs = await academicAPI.listYears().catch(() => ({ data: [] }));
        if (!cancelled) setYears(Array.isArray(yrs?.data) ? yrs.data : []);
      } catch {
        // ignore — year filter is optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Empty filter => server-side default of "active year" (per spec).
        // 'all' is an explicit override; numeric values target a specific year.
        const filter =
          yearFilter === 'all'
            ? { academicYearId: 'all' }
            : yearFilter
              ? { academicYearId: Number(yearFilter) }
              : {};
        const res = await academicAPI.myTeacherEnseignements(filter);
        if (!cancelled) setItems(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load modules.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [yearFilter]);

  // Group by module so a teacher who teaches the same module to multiple
  // promos / types sees one card with all of their assignments listed inside.
  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = item.module?.id ?? `none-${item.id}`;
      if (!map.has(key)) {
        map.set(key, { module: item.module, rows: [] });
      }
      map.get(key).rows.push(item);
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Modules</h1>
          <p className="text-sm text-slate-500">Modules you teach, grouped by subject. Read-only.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" strokeWidth={2} />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">Active year</option>
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={`y-${y.id}`} value={y.id}>{y.name}{y.isActive ? ' (active)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No teaching assignments for this filter.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {grouped.map(({ module, rows }) => (
            <article key={`mod-${module?.id || rows[0].id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <header className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-900">{formatModule(module)}</h2>
                  {module?.semestre ? (
                    <p className="text-xs text-slate-500">Semestre {module.semestre}</p>
                  ) : null}
                </div>
              </header>

              <ul className="mt-4 divide-y divide-slate-100">
                {rows.map((row) => (
                  <li key={`row-${row.id}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{formatPromo(row.promo)}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" strokeWidth={2} />
                          {row.academicYear?.name || row.anneeUniversitaire || '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE[row.type] || 'bg-slate-100 text-slate-700'}`}>
                      {String(row.type || '').toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
