import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { authAPI, academicAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const inputClass =
  'w-full rounded-xl border border-edge bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

const TYPE_OPTIONS = [
  { value: 'cours', label: 'COURS' },
  { value: 'td', label: 'TD' },
  { value: 'tp', label: 'TP' },
  { value: 'online', label: 'ONLINE' },
];

const TYPE_BADGE = {
  cours: 'bg-brand/10 text-brand border-brand/20',
  td: 'bg-success/10 text-success border-success/20',
  tp: 'bg-warning/10 text-warning border-warning/20',
  online: 'bg-info/10 text-info border-info/20',
};

function hasAdminAccess(roles) {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => String(r || '').toLowerCase() === 'admin');
}

const promoLabel = (promo) =>
  promo?.nom_ar || promo?.nom_en || promo?.nom || `Promo ${promo?.id}`;

const moduleLabel = (mod) =>
  mod?.nom_ar || mod?.nom_en || mod?.nom || `Module ${mod?.id}`;

export default function AdminAcademicManagementPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const canAccess = useMemo(() => hasAdminAccess(user?.roles), [user?.roles]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Data
  const [tree, setTree] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [legacyOptions, setLegacyOptions] = useState({ specialites: [], promos: [], modules: [] });
  const [teachers, setTeachers] = useState([]);

  // Active drill-down
  const [activeYearId, setActiveYearId] = useState(null);
  const [expandedPromos, setExpandedPromos] = useState({});

  // Forms
  const [yearForm, setYearForm] = useState({ name: '', isActive: false });
  const [promoForm, setPromoForm] = useState({ nom: '', section: '', specialiteId: '' });
  const [moduleForm, setModuleForm] = useState({ promoId: '', nom: '', semestre: '' });
  const [enseignementForm, setEnseignementForm] = useState({
    moduleId: '',
    promoId: '',
    enseignantId: '',
    type: 'cours',
  });

  const [saving, setSaving] = useState({
    year: false,
    promo: false,
    module: false,
    enseignement: false,
  });

  const refresh = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [hierarchyRes, yearsRes, optionsRes, assignmentsRes] = await Promise.all([
        academicAPI.hierarchy(),
        academicAPI.listYears(),
        authAPI.adminGetAcademicOptions(),
        authAPI.adminGetAcademicAssignments(),
      ]);
      const tree = Array.isArray(hierarchyRes?.data) ? hierarchyRes.data : [];
      setTree(tree);
      setAcademicYears(Array.isArray(yearsRes?.data) ? yearsRes.data : []);
      setLegacyOptions({
        specialites: Array.isArray(optionsRes?.data?.specialites) ? optionsRes.data.specialites : [],
        promos: Array.isArray(optionsRes?.data?.promos) ? optionsRes.data.promos : [],
        modules: Array.isArray(optionsRes?.data?.modules) ? optionsRes.data.modules : [],
      });
      setTeachers(Array.isArray(assignmentsRes?.data?.teachers) ? assignmentsRes.data.teachers : []);

      // Auto-select the active year (or the first one) on first load.
      setActiveYearId((prev) => {
        if (prev && tree.some((y) => y.id === prev)) return prev;
        const active = tree.find((y) => y.isActive);
        return active?.id ?? tree[0]?.id ?? null;
      });
    } catch (err) {
      setError(err.message || 'Failed to load academic structure.');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  const togglePromo = (promoId) => {
    setExpandedPromos((prev) => ({ ...prev, [promoId]: !prev[promoId] }));
  };

  const activeYear = useMemo(
    () => tree.find((y) => y.id === activeYearId) || null,
    [tree, activeYearId]
  );

  const promosForActiveYear = activeYear?.promos || [];

  // ── Year actions ─────────────────────────────────────────────
  const createYear = async () => {
    const name = yearForm.name.trim();
    if (!name) {
      setError('Year name is required (e.g. 2025-2026).');
      return;
    }
    setSaving((prev) => ({ ...prev, year: true }));
    setError('');
    setMessage('');
    try {
      await academicAPI.createYear({ name, isActive: !!yearForm.isActive });
      setYearForm({ name: '', isActive: false });
      setMessage(`Academic year "${name}" created.`);
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create academic year.');
    } finally {
      setSaving((prev) => ({ ...prev, year: false }));
    }
  };

  const activateYear = async (id) => {
    setError('');
    setMessage('');
    try {
      await academicAPI.activateYear(id);
      setMessage('Academic year activated.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to activate year.');
    }
  };

  const deleteYear = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this academic year?')) return;
    setError('');
    setMessage('');
    try {
      await academicAPI.deleteYear(id);
      setMessage('Academic year deleted.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to delete year.');
    }
  };

  // ── Promo actions ────────────────────────────────────────────
  const createPromo = async () => {
    if (!activeYear) {
      setError('Pick an academic year first.');
      return;
    }
    if (!promoForm.specialiteId) {
      setError('Select a specialite for the promo.');
      return;
    }
    setSaving((prev) => ({ ...prev, promo: true }));
    setError('');
    setMessage('');
    try {
      await authAPI.adminCreatePromo({
        nom: promoForm.nom.trim() || undefined,
        section: promoForm.section.trim() || undefined,
        anneeUniversitaire: activeYear.name,
        specialiteId: Number(promoForm.specialiteId),
      });
      setPromoForm({ nom: '', section: '', specialiteId: '' });
      setMessage('Promo created.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create promo.');
    } finally {
      setSaving((prev) => ({ ...prev, promo: false }));
    }
  };

  // ── Module actions ───────────────────────────────────────────
  const createModule = async () => {
    if (!moduleForm.promoId) {
      setError('Select a promo to attach the module to.');
      return;
    }
    if (!moduleForm.nom.trim()) {
      setError('Module name is required.');
      return;
    }
    const promo = promosForActiveYear.find((p) => p.id === Number(moduleForm.promoId));
    if (!promo?.specialiteId) {
      setError('Selected promo has no specialite — cannot derive module scope.');
      return;
    }
    setSaving((prev) => ({ ...prev, module: true }));
    setError('');
    setMessage('');
    try {
      // Module code is auto-generated server-side for parity with the legacy
      // schema (which still requires it). We hide it from the UI per spec —
      // a slug from the promo + name keeps it unique without admin input.
      const codeSlug =
        `M${promo.id}-` +
        moduleForm.nom
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '')
          .slice(0, 8) +
        `-${Date.now().toString(36).slice(-4)}`;

      await academicAPI.createModule({
        nom_ar: moduleForm.nom.trim(),
        code: codeSlug,
        specialiteId: promo.specialiteId,
        semestre: moduleForm.semestre ? Number(moduleForm.semestre) : undefined,
      });
      setModuleForm({ promoId: moduleForm.promoId, nom: '', semestre: '' });
      setMessage('Module created.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create module.');
    } finally {
      setSaving((prev) => ({ ...prev, module: false }));
    }
  };

  const deleteModule = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this module?')) return;
    setError('');
    setMessage('');
    try {
      await academicAPI.deleteModule(id);
      setMessage('Module deleted.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to delete module.');
    }
  };

  // ── Enseignement (TD/TP/COURS/ONLINE assignment) ─────────────
  const createEnseignement = async () => {
    if (!activeYear) {
      setError('Pick an academic year first.');
      return;
    }
    if (!enseignementForm.moduleId || !enseignementForm.promoId || !enseignementForm.enseignantId) {
      setError('Module, promo, and teacher are required.');
      return;
    }
    setSaving((prev) => ({ ...prev, enseignement: true }));
    setError('');
    setMessage('');
    try {
      await academicAPI.createEnseignement({
        enseignantId: Number(enseignementForm.enseignantId),
        moduleId: Number(enseignementForm.moduleId),
        promoId: Number(enseignementForm.promoId),
        type: enseignementForm.type,
        academicYearId: activeYear.id,
      });
      setEnseignementForm({ moduleId: '', promoId: '', enseignantId: '', type: 'cours' });
      setMessage('Teaching assignment added.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to create enseignement.');
    } finally {
      setSaving((prev) => ({ ...prev, enseignement: false }));
    }
  };

  const deleteEnseignement = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Remove this teaching assignment?')) return;
    setError('');
    setMessage('');
    try {
      await academicAPI.deleteEnseignement(id);
      setMessage('Teaching assignment removed.');
      await refresh(true);
    } catch (err) {
      setError(err.message || 'Failed to remove assignment.');
    }
  };

  if (authLoading || loading) {
    return <div className="rounded-2xl border border-edge bg-surface p-6">Loading academic structure…</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-edge-strong bg-danger/10 p-6 text-danger">
        Restricted area.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-brand/5 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">
              Academic Structure
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Year · Promos · Modules</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
              Drill into an academic year, manage its promos, and assign modules and teachers — all from one tree.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin/users')}
            className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Users
          </button>
        </div>
      </section>

      {message ? (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-edge-strong bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      {/* ── Step 1: Academic Year ────────────────────────────── */}
      <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <CalendarRange className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Step 1 · Academic Year</h2>
              <p className="text-sm text-ink-secondary">Select a year to drill into. Only one year can be active at a time.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <input
              className={`${inputClass} max-w-[14rem]`}
              placeholder="2025-2026"
              value={yearForm.name}
              onChange={(e) => setYearForm((p) => ({ ...p, name: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={yearForm.isActive}
                onChange={(e) => setYearForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Set active
            </label>
            <button
              type="button"
              onClick={createYear}
              disabled={saving.year}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {saving.year ? 'Saving…' : 'Create year'}
            </button>
          </div>
        </div>

        {tree.length === 0 ? (
          <p className="text-sm text-ink-secondary">No academic years yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tree.map((year) => {
              const isSelected = year.id === activeYearId;
              return (
                <div
                  key={`year-pill-${year.id}`}
                  className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    isSelected
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-edge bg-canvas text-ink-secondary hover:border-brand/40 hover:text-brand'
                  }`}
                >
                  <button type="button" onClick={() => setActiveYearId(year.id)} className="flex items-center gap-2">
                    <span className="font-semibold">{year.name}</span>
                    {year.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : null}
                    <span className="text-xs text-ink-tertiary">{year.promos?.length || 0} promos</span>
                  </button>
                  {!year.isActive ? (
                    <button
                      type="button"
                      onClick={() => activateYear(year.id)}
                      className="rounded-md border border-edge px-2 py-0.5 text-xs text-ink-secondary opacity-0 transition group-hover:opacity-100 hover:border-brand/40 hover:text-brand"
                    >
                      Activate
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => deleteYear(year.id)}
                    className="rounded-md p-1 text-ink-tertiary opacity-0 transition group-hover:opacity-100 hover:text-danger"
                    aria-label="Delete year"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Step 2 & 3: Promos and Modules tree ──────────────── */}
      {activeYear ? (
        <>
          <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Layers className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    Step 2 · Promos in {activeYear.name}
                  </h2>
                  <p className="text-sm text-ink-secondary">
                    Each promo holds modules and student enrollments.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <select
                  className={`${inputClass} max-w-[12rem]`}
                  value={promoForm.specialiteId}
                  onChange={(e) => setPromoForm((p) => ({ ...p, specialiteId: e.target.value }))}
                >
                  <option value="">Specialite (internal)</option>
                  {legacyOptions.specialites.map((s) => (
                    <option key={`promo-spec-${s.id}`} value={s.id}>
                      {s.nom} {s.niveau ? `· ${s.niveau}` : ''}
                    </option>
                  ))}
                </select>
                <input
                  className={`${inputClass} max-w-[12rem]`}
                  placeholder="Promo name"
                  value={promoForm.nom}
                  onChange={(e) => setPromoForm((p) => ({ ...p, nom: e.target.value }))}
                />
                <input
                  className={`${inputClass} max-w-[8rem]`}
                  placeholder="Section"
                  value={promoForm.section}
                  onChange={(e) => setPromoForm((p) => ({ ...p, section: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={createPromo}
                  disabled={saving.promo}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" /> {saving.promo ? 'Saving…' : 'Add promo'}
                </button>
              </div>
            </div>

            {promosForActiveYear.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                No promos in this academic year. Add one above.
              </p>
            ) : (
              <ul className="space-y-3">
                {promosForActiveYear.map((promo) => {
                  const open = !!expandedPromos[promo.id];
                  return (
                    <li
                      key={`promo-${promo.id}`}
                      className="overflow-hidden rounded-xl border border-edge bg-canvas/50 transition hover:border-brand/30"
                    >
                      <button
                        type="button"
                        onClick={() => togglePromo(promo.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4 text-ink-tertiary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-ink-tertiary" />
                        )}
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <GraduationCap className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-ink">{promoLabel(promo)}</p>
                          <p className="text-xs text-ink-tertiary">
                            {promo.section ? `Section ${promo.section} · ` : ''}
                            {promo.niveau ? `${promo.niveau} · ` : ''}
                            {promo.modules?.length || 0} module(s) · {promo.studentCount || 0} student(s)
                          </p>
                        </div>
                      </button>

                      {open ? (
                        <div className="border-t border-edge bg-surface px-5 pb-5 pt-4 space-y-4">
                          {/* Modules under promo */}
                          {promo.modules.length === 0 ? (
                            <p className="text-sm text-ink-secondary">No modules attached yet.</p>
                          ) : (
                            <div className="overflow-hidden rounded-lg border border-edge">
                              <table className="min-w-full divide-y divide-edge text-sm">
                                <thead className="bg-canvas/60 text-xs uppercase tracking-wide text-ink-tertiary">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Module</th>
                                    <th className="px-3 py-2 text-left">Semester</th>
                                    <th className="px-3 py-2 text-left">Teaching slots</th>
                                    <th className="px-3 py-2 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-edge">
                                  {promo.modules.map((mod) => (
                                    <tr key={`mod-${promo.id}-${mod.id}`} className="bg-surface">
                                      <td className="px-3 py-2 font-medium text-ink">
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="h-4 w-4 text-brand" />
                                          {moduleLabel(mod)}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-ink-secondary">{mod.semestre ?? '—'}</td>
                                      <td className="px-3 py-2">
                                        {mod.enseignements.length === 0 ? (
                                          <span className="text-xs text-ink-tertiary">No teacher assigned</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-1.5">
                                            {mod.enseignements.map((slot) => (
                                              <span
                                                key={`slot-${slot.id}`}
                                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                                  TYPE_BADGE[slot.type] || 'bg-canvas text-ink-secondary border-edge'
                                                }`}
                                              >
                                                <span className="font-semibold uppercase">{slot.type}</span>
                                                {slot.teacher ? (
                                                  <span>
                                                    {slot.teacher.prenom} {slot.teacher.nom}
                                                  </span>
                                                ) : null}
                                                <button
                                                  type="button"
                                                  onClick={() => deleteEnseignement(slot.id)}
                                                  className="ml-1 text-ink-tertiary hover:text-danger"
                                                  aria-label="Remove assignment"
                                                >
                                                  ×
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          type="button"
                                          onClick={() => deleteModule(mod.id)}
                                          className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface px-2 py-1 text-xs text-danger hover:bg-danger/10"
                                        >
                                          <Trash2 className="h-3 w-3" /> Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Add module form (Step 3) */}
                          <div className="rounded-lg border border-dashed border-edge bg-canvas/40 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                              Add a module to this promo
                            </p>
                            <div className="flex flex-wrap items-end gap-2">
                              <input
                                className={`${inputClass} max-w-[16rem]`}
                                placeholder="Module name"
                                value={moduleForm.promoId === String(promo.id) ? moduleForm.nom : ''}
                                onChange={(e) =>
                                  setModuleForm({
                                    promoId: String(promo.id),
                                    nom: e.target.value,
                                    semestre:
                                      moduleForm.promoId === String(promo.id) ? moduleForm.semestre : '',
                                  })
                                }
                              />
                              <input
                                className={`${inputClass} max-w-[6rem]`}
                                type="number"
                                min={1}
                                max={12}
                                placeholder="Sem."
                                value={moduleForm.promoId === String(promo.id) ? moduleForm.semestre : ''}
                                onChange={(e) =>
                                  setModuleForm({
                                    promoId: String(promo.id),
                                    nom: moduleForm.promoId === String(promo.id) ? moduleForm.nom : '',
                                    semestre: e.target.value,
                                  })
                                }
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setModuleForm((prev) => ({ ...prev, promoId: String(promo.id) }));
                                  createModule();
                                }}
                                disabled={saving.module}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-surface hover:bg-brand-hover disabled:opacity-60"
                              >
                                <Plus className="h-3 w-3" /> {saving.module ? 'Saving…' : 'Add module'}
                              </button>
                            </div>
                          </div>

                          {/* Step 4: assign teaching type */}
                          {promo.modules.length > 0 ? (
                            <div className="rounded-lg border border-dashed border-edge bg-canvas/40 p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                                Step 4 · Assign teaching slot (TD / TP / COURS / ONLINE)
                              </p>
                              <div className="flex flex-wrap items-end gap-2">
                                <select
                                  className={`${inputClass} max-w-[14rem]`}
                                  value={
                                    enseignementForm.promoId === String(promo.id) ? enseignementForm.moduleId : ''
                                  }
                                  onChange={(e) =>
                                    setEnseignementForm({
                                      ...enseignementForm,
                                      promoId: String(promo.id),
                                      moduleId: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select module</option>
                                  {promo.modules.map((m) => (
                                    <option key={`as-mod-${m.id}`} value={m.id}>
                                      {moduleLabel(m)}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className={`${inputClass} max-w-[14rem]`}
                                  value={
                                    enseignementForm.promoId === String(promo.id)
                                      ? enseignementForm.enseignantId
                                      : ''
                                  }
                                  onChange={(e) =>
                                    setEnseignementForm({
                                      ...enseignementForm,
                                      promoId: String(promo.id),
                                      enseignantId: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select teacher</option>
                                  {teachers.map((t) => (
                                    <option key={`as-tch-${t.id}`} value={t.id}>
                                      {t.prenom} {t.nom}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className={`${inputClass} max-w-[8rem]`}
                                  value={enseignementForm.type}
                                  onChange={(e) =>
                                    setEnseignementForm({
                                      ...enseignementForm,
                                      promoId: String(promo.id),
                                      type: e.target.value,
                                    })
                                  }
                                >
                                  {TYPE_OPTIONS.map((opt) => (
                                    <option key={`as-type-${opt.value}`} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEnseignementForm((prev) => ({ ...prev, promoId: String(promo.id) }));
                                    createEnseignement();
                                  }}
                                  disabled={saving.enseignement}
                                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-surface hover:bg-brand-hover disabled:opacity-60"
                                >
                                  <Users className="h-3 w-3" /> {saving.enseignement ? 'Saving…' : 'Assign'}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="text-xs text-ink-tertiary">
            {refreshing ? 'Refreshing data…' : 'Tree mirrors the active database state.'}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-edge bg-surface p-6 text-sm text-ink-secondary">
          Create or pick an academic year to manage its promos and modules.
        </div>
      )}
    </div>
  );
}
