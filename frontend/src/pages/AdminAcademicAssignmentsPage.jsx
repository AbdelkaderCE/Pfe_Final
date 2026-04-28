import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Search,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { authAPI, academicAPI, affectationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const inputClass =
  'w-full rounded-md border border-control-border bg-control-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30';

const TYPE_OPTIONS = [
  { value: 'cours', label: 'COURS' },
  { value: 'td', label: 'TD' },
  { value: 'tp', label: 'TP' },
  { value: 'online', label: 'ONLINE' },
];

const TYPE_BADGE = {
  cours: 'bg-brand/10 text-brand',
  td: 'bg-success/10 text-success',
  tp: 'bg-warning/10 text-warning',
  online: 'bg-info/10 text-info',
};

const TABS = [
  { id: 'students', label: 'Students', Icon: GraduationCap },
  { id: 'teachers', label: 'Teachers', Icon: UserCheck },
];

function hasAdminAccess(roles) {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => String(r || '').toLowerCase() === 'admin');
}

const promoLabel = (promo) => {
  if (!promo) return '—';
  const base = promo.nom_ar || promo.nom_en || promo.nom || `Promo ${promo.id}`;
  const section = promo.section ? ` · ${promo.section}` : '';
  const year = promo.anneeUniversitaire ? ` · ${promo.anneeUniversitaire}` : '';
  return `${base}${section}${year}`;
};

const moduleLabel = (mod) => {
  if (!mod) return '—';
  return mod.nom_ar || mod.nom_en || mod.nom || `Module ${mod.id}`;
};

const teacherLabel = (teacher) => {
  if (!teacher) return '—';
  if (teacher.user) return `${teacher.user.prenom || ''} ${teacher.user.nom || ''}`.trim() || teacher.user.email;
  return `${teacher.prenom || ''} ${teacher.nom || ''}`.trim() || teacher.email || `Teacher ${teacher.id}`;
};

export default function AdminAcademicAssignmentsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const canAccess = useMemo(() => hasAdminAccess(user?.roles), [user?.roles]);

  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState({ promos: [], students: [], teachers: [], modules: [] });
  const [academicYears, setAcademicYears] = useState([]);
  const [enseignements, setEnseignements] = useState([]);
  const [yearFilter, setYearFilter] = useState('');

  // Student tab state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState({});
  const [bulkPromoId, setBulkPromoId] = useState('');
  const [busy, setBusy] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvImportPromoId, setCsvImportPromoId] = useState('');
  const [importReport, setImportReport] = useState(null);

  // Teacher tab state
  const [teacherSearch, setTeacherSearch] = useState('');
  const [enseignementForm, setEnseignementForm] = useState({
    enseignantId: '',
    moduleId: '',
    promoId: '',
    type: 'cours',
    academicYearId: '',
  });

  const loadCore = async () => {
    const [assignRes, yearsRes] = await Promise.all([
      authAPI.adminGetAcademicAssignments(),
      academicAPI.listYears().catch(() => ({ data: [] })),
    ]);
    const payload = assignRes?.data || {};
    setData({
      promos: Array.isArray(payload.promos) ? payload.promos : [],
      students: Array.isArray(payload.students) ? payload.students : [],
      teachers: Array.isArray(payload.teachers) ? payload.teachers : [],
      modules: Array.isArray(payload.modules) ? payload.modules : [],
    });
    setAcademicYears(Array.isArray(yearsRes?.data) ? yearsRes.data : []);
  };

  const loadEnseignements = async (filterYearId) => {
    try {
      const filter = filterYearId
        ? { academicYearId: Number(filterYearId) }
        : { academicYearId: 'all' };
      const res = await academicAPI.listEnseignements(filter);
      setEnseignements(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load enseignements.');
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      await loadCore();
      await loadEnseignements(yearFilter);
    } catch (err) {
      setError(err.message || 'Failed to load assignments data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    loadEnseignements(yearFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearFilter]);

  // ── Student helpers ─────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return data.students;
    return data.students.filter((s) =>
      [s.prenom, s.nom, s.email, s.promoLabel]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((value) => value.includes(q))
    );
  }, [data.students, studentSearch]);

  const allFilteredSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents[s.userId]);

  const toggleStudent = (userId) => {
    setSelectedStudents((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleAllFiltered = () => {
    setSelectedStudents((prev) => {
      const next = { ...prev };
      const target = !allFilteredSelected;
      for (const s of filteredStudents) next[s.userId] = target;
      return next;
    });
  };

  const selectedUserIds = useMemo(
    () =>
      Object.entries(selectedStudents)
        .filter(([, on]) => on)
        .map(([uid]) => Number(uid))
        .filter((n) => Number.isInteger(n) && n > 0),
    [selectedStudents]
  );

  const bulkAssign = async () => {
    if (selectedUserIds.length === 0) {
      setError('Select at least one student to assign.');
      return;
    }
    if (!bulkPromoId) {
      setError('Select a target promo for the bulk assignment.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await affectationAPI.bulkAssignStudentsPromo({
        promoId: Number(bulkPromoId),
        userIds: selectedUserIds,
      });
      const t = result?.data?.totals;
      setMessage(`Bulk assignment done — updated ${t?.updated ?? 0}, errors ${t?.errors ?? 0}.`);
      setSelectedStudents({});
      await loadCore();
    } catch (err) {
      setError(err.message || 'Bulk assignment failed.');
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    if (!csvText.trim()) {
      setError('Paste CSV content first (header + rows).');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    setImportReport(null);
    try {
      const result = await affectationAPI.importStudentsCsv({
        csv: csvText,
        promoId: csvImportPromoId ? Number(csvImportPromoId) : null,
      });
      const payload = result?.data || {};
      setImportReport(payload);
      setMessage(
        `Import done — created ${payload.totals?.created ?? 0}, updated ${payload.totals?.updated ?? 0}, errors ${payload.totals?.errors ?? 0}.`
      );
      setCsvText('');
      await loadCore();
    } catch (err) {
      setError(err.message || 'CSV import failed.');
    } finally {
      setBusy(false);
    }
  };

  const onCsvFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setCsvText(text);
    } catch (err) {
      setError('Could not read the selected file.');
    } finally {
      event.target.value = '';
    }
  };

  // ── Teacher helpers ─────────────────────────────────────────
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return data.teachers;
    return data.teachers.filter((t) =>
      [t.prenom, t.nom, t.email]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((value) => value.includes(q))
    );
  }, [data.teachers, teacherSearch]);

  const createEnseignement = async () => {
    if (!enseignementForm.enseignantId || !enseignementForm.moduleId || !enseignementForm.promoId) {
      setError('Teacher, module and promo are required.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await academicAPI.createEnseignement({
        enseignantId: Number(enseignementForm.enseignantId),
        moduleId: Number(enseignementForm.moduleId),
        promoId: Number(enseignementForm.promoId),
        type: enseignementForm.type,
        academicYearId: enseignementForm.academicYearId
          ? Number(enseignementForm.academicYearId)
          : undefined,
      });
      setEnseignementForm({ enseignantId: '', moduleId: '', promoId: '', type: 'cours', academicYearId: '' });
      setMessage('Enseignement created.');
      await loadEnseignements(yearFilter);
    } catch (err) {
      setError(err.message || 'Failed to create enseignement.');
    } finally {
      setBusy(false);
    }
  };

  const removeEnseignement = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this enseignement assignment?')) return;
    setError('');
    setMessage('');
    try {
      await academicAPI.deleteEnseignement(id);
      setMessage('Enseignement deleted.');
      await loadEnseignements(yearFilter);
    } catch (err) {
      setError(err.message || 'Failed to delete enseignement.');
    }
  };

  if (authLoading || loading) {
    return <div className="rounded-2xl border border-edge bg-surface p-6">Loading assignments…</div>;
  }

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-edge-strong bg-danger/10 p-6 text-danger">Restricted area.</div>
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Affectation</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Bulk Assignment Hub</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
              Import students from CSV, mass-assign promos, and attach teachers to modules across academic years.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-canvas px-3 py-1 text-ink-secondary">
                <GraduationCap className="h-3.5 w-3.5" />
                {data.students.length} students
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-canvas px-3 py-1 text-ink-secondary">
                <UserCheck className="h-3.5 w-3.5" />
                {data.teachers.length} teachers
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-canvas px-3 py-1 text-ink-secondary">
                <BookOpen className="h-3.5 w-3.5" />
                {data.modules.length} modules
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin/users')}
            className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
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

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-edge">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 ${
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-secondary hover:text-ink'
            }`}
          >
            <tab.Icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Students tab ─────────────────────────────────────── */}
      {activeTab === 'students' ? (
        <>
          {/* CSV import card */}
          <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Upload className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">CSV Import</h2>
                <p className="text-sm text-ink-secondary">
                  Upload a CSV with columns <code className="rounded bg-canvas px-1">firstName,lastName,email,matricule</code>.
                  Existing accounts are matched by email and updated; new accounts get a temporary password.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-ink-tertiary">
                  CSV file
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={onCsvFileChange}
                  className="mt-1 block w-full cursor-pointer rounded-md border border-edge bg-canvas px-3 py-2 text-sm text-ink-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1 file:text-sm file:font-medium file:text-surface hover:file:bg-brand-hover"
                />
                <textarea
                  className={`${inputClass} mt-2 min-h-[8rem] font-mono text-xs`}
                  placeholder={`firstName,lastName,email,matricule\nMohamed,Saad,m.saad@univ.dz,202301\n...`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wide text-ink-tertiary">
                  Auto-assign to promo (optional)
                </label>
                <select
                  className={inputClass}
                  value={csvImportPromoId}
                  onChange={(e) => setCsvImportPromoId(e.target.value)}
                >
                  <option value="">No promo (just create accounts)</option>
                  {data.promos.map((promo) => (
                    <option key={`csv-promo-${promo.id}`} value={promo.id}>
                      {promoLabel(promo)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={importCsv}
                  disabled={busy || !csvText.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {busy ? 'Importing…' : 'Import CSV'}
                </button>
                {importReport ? (
                  <div className="rounded-lg border border-edge bg-canvas/40 p-3 text-xs">
                    <p className="font-semibold text-ink">Import report</p>
                    <p className="mt-1 text-ink-secondary">
                      Created {importReport.totals?.created ?? 0} · Updated {importReport.totals?.updated ?? 0} · Errors {importReport.totals?.errors ?? 0}
                    </p>
                    {Array.isArray(importReport.rows) && importReport.rows.some((r) => r.tempPassword) ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-ink-secondary hover:text-ink">
                          Temporary passwords for new accounts
                        </summary>
                        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-2">
                          {importReport.rows
                            .filter((r) => r.tempPassword)
                            .map((r, idx) => (
                              <li key={`pw-${idx}`} className="font-mono text-[11px] text-ink">
                                {r.email} → <span className="rounded bg-canvas px-1">{r.tempPassword}</span>
                              </li>
                            ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* Bulk assign card */}
          <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Bulk Assign Students</h2>
                  <p className="text-sm text-ink-secondary">
                    Select students with the checkboxes, pick a target promo, and apply in one click.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
                  <input
                    className={`${inputClass} pl-9 max-w-[16rem]`}
                    placeholder="Search students…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <select
                  className={`${inputClass} max-w-[18rem]`}
                  value={bulkPromoId}
                  onChange={(e) => setBulkPromoId(e.target.value)}
                >
                  <option value="">Target promo…</option>
                  {data.promos.map((p) => (
                    <option key={`bulk-promo-${p.id}`} value={p.id}>
                      {promoLabel(p)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={bulkAssign}
                  disabled={busy || selectedUserIds.length === 0 || !bulkPromoId}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  Assign {selectedUserIds.length || ''}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-edge-subtle bg-canvas/60">
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleAllFiltered}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Current promo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-secondary">
                        No students match the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={`bulk-stu-${s.userId}`} className="border-b border-edge-subtle hover:bg-canvas/40 last:border-b-0">
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={!!selectedStudents[s.userId]}
                            onChange={() => toggleStudent(s.userId)}
                            aria-label={`Select ${s.prenom} ${s.nom}`}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">
                          {s.prenom} {s.nom}
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">{s.email}</td>
                        <td className="px-4 py-3 text-ink-secondary">{s.promoLabel || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {/* ── Teachers tab ─────────────────────────────────────── */}
      {activeTab === 'teachers' ? (
        <>
          <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <UserCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Assign teacher to module</h2>
                  <p className="text-sm text-ink-secondary">
                    Pick a teacher, a module, the promo, the type (TD/TP/COURS/ONLINE) and the academic year.
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">
                  Filter year
                </label>
                <select className={`${inputClass} mt-1`} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  <option value="">All years</option>
                  {academicYears.map((y) => (
                    <option key={`yf-${y.id}`} value={y.id}>
                      {y.name}{y.isActive ? ' (active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
                  <input
                    className={`${inputClass} pl-9`}
                    placeholder="Filter teacher list…"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </div>
                <select
                  className={`${inputClass} mt-2`}
                  value={enseignementForm.enseignantId}
                  onChange={(e) => setEnseignementForm((p) => ({ ...p, enseignantId: e.target.value }))}
                >
                  <option value="">Select teacher</option>
                  {filteredTeachers.map((t) => (
                    <option key={`af-tch-${t.id}`} value={t.id}>
                      {`${t.prenom || ''} ${t.nom || ''}`.trim() || t.email}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className={inputClass}
                value={enseignementForm.moduleId}
                onChange={(e) => setEnseignementForm((p) => ({ ...p, moduleId: e.target.value }))}
              >
                <option value="">Select module</option>
                {data.modules.map((m) => (
                  <option key={`af-mod-${m.id}`} value={m.id}>
                    {moduleLabel(m)}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={enseignementForm.promoId}
                onChange={(e) => setEnseignementForm((p) => ({ ...p, promoId: e.target.value }))}
              >
                <option value="">Select promo</option>
                {data.promos.map((p) => (
                  <option key={`af-pr-${p.id}`} value={p.id}>
                    {promoLabel(p)}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={enseignementForm.type}
                onChange={(e) => setEnseignementForm((p) => ({ ...p, type: e.target.value }))}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={`af-t-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  className={inputClass}
                  value={enseignementForm.academicYearId}
                  onChange={(e) => setEnseignementForm((p) => ({ ...p, academicYearId: e.target.value }))}
                >
                  <option value="">No year</option>
                  {academicYears.map((y) => (
                    <option key={`af-yr-${y.id}`} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={createEnseignement}
                  disabled={busy}
                  className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-ink">Teaching assignments</h2>
            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-edge-subtle bg-canvas/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Promo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Year</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enseignements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-secondary">
                        No teaching assignments for this filter.
                      </td>
                    </tr>
                  ) : (
                    enseignements.map((en) => (
                      <tr key={`af-en-${en.id}`} className="border-b border-edge-subtle hover:bg-canvas/40 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-ink">{teacherLabel(en.enseignant)}</td>
                        <td className="px-4 py-3 text-ink">{moduleLabel(en.module)}</td>
                        <td className="px-4 py-3 text-ink-secondary">{promoLabel(en.promo)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              TYPE_BADGE[en.type] || 'bg-canvas text-ink-secondary'
                            }`}
                          >
                            {String(en.type || '').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">
                          {en.academicYear?.name || en.anneeUniversitaire || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeEnseignement(en.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-3 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
