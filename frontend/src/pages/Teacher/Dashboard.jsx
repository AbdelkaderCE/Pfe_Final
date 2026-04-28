/*
  TeacherDashboard — PFE-only dashboard.

  The teacher in this product is a PFE supervisor, not a course instructor.
  No announcements, reclamations, courses, or groupes exist on this page.
*/

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import ProfileHeader from '../../components/dashboard/teacher/ProfileHeader';
import ReportStudentModal from '../../components/dashboard/teacher/ReportStudentModal';
import { teacherDashboardService } from '../../services/teacherDashboard';
import { academicAPI } from '../../services/api';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pfe', label: 'PFE' },
  { id: 'jury', label: 'Jury' },
  { id: 'teaching', label: 'Teaching' },
];

const TEACHING_TYPE_TONE = {
  cours: 'bg-indigo-100 text-indigo-700',
  td: 'bg-emerald-100 text-emerald-700',
  tp: 'bg-amber-100 text-amber-700',
  online: 'bg-sky-100 text-sky-700',
};

const CHART_PALETTE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1', '#a4de6c'];


function StudentListModal({ isOpen, onClose, title, students, onReport }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-surface rounded-xl shadow-card border border-edge w-full max-w-2xl max-h-[80vh] flex flex-col transform transition-all duration-300">
        <div className="flex items-center justify-between p-6 border-b border-edge">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-ink-tertiary hover:text-ink hover:bg-surface-200 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {students.length === 0 ? (
            <p className="text-center text-ink-tertiary">No students found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-edge/20 text-ink-secondary text-sm">
                <tr>
                  <th className="p-3 border-b border-edge font-medium rounded-tl-lg">Matricule</th>
                  <th className="p-3 border-b border-edge font-medium">Name</th>
                  {onReport && <th className="p-3 border-b border-edge font-medium rounded-tr-lg">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-edge/10 border-b border-edge last:border-b-0">
                    <td className="p-3 font-mono text-ink-secondary">{s.matricule}</td>
                    <td className="p-3 font-medium text-ink">{s.name}</td>
                    {onReport && (
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onReport(s)}
                          className="px-3 py-1 text-xs font-medium text-danger border border-danger/40 rounded-md hover:bg-danger/10 transition-colors"
                        >
                          Report
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}


export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [reportTarget, setReportTarget] = useState(null);
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', students: [] });

  // ── Teaching tab state — sourced from /api/v1/enseignements/mine ──
  const [teachingItems, setTeachingItems] = useState([]);
  const [teachingYears, setTeachingYears] = useState([]);
  const [teachingYear, setTeachingYear] = useState('');
  const [teachingLoading, setTeachingLoading] = useState(false);

  const hasPresidentMembership = useMemo(
    () =>
      Array.isArray(user?.memberships) &&
      user.memberships.some(
        (membership) => String(membership?.role || '').toLowerCase() === 'president'
      ),
    [user]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingOverview(true);
        const response = await teacherDashboardService.getOverview();
        if (!cancelled) setOverview(response?.data || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load dashboard.');
      } finally {
        if (!cancelled) setLoadingOverview(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Year list — load once; reused by the teaching filter selector.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await academicAPI.listYears();
        if (!cancelled) setTeachingYears(Array.isArray(res?.data) ? res.data : []);
      } catch {
        // Optional — selector simply won't list known years.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Teaching items — refetch when entering the tab or changing the year filter.
  useEffect(() => {
    if (activeTab !== 'teaching') return undefined;
    let cancelled = false;
    (async () => {
      setTeachingLoading(true);
      try {
        const filter =
          teachingYear === 'all'
            ? { academicYearId: 'all' }
            : teachingYear
              ? { academicYearId: Number(teachingYear) }
              : {}; // empty => server defaults to active year
        const res = await academicAPI.myTeacherEnseignements(filter);
        if (!cancelled) setTeachingItems(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load teaching assignments.');
      } finally {
        if (!cancelled) setTeachingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, teachingYear]);

  const summary          = overview?.summary          ?? null;
  const pfeBreakdown     = overview?.pfeBreakdown     ?? [];
  const pfeBySpecialite  = overview?.pfeBySpecialite  ?? [];
  const moduleBySpecialite = overview?.moduleBySpecialite ?? [];
  const documentBreakdown  = overview?.documentBreakdown  ?? [];
  const disciplineByType   = overview?.disciplineByType   ?? [];

  const chartsData = useMemo(() => ({
    pfeProjectsByStatus: summary
      ? [
          { name: 'Active',    value: summary.activePfeProjects    ?? 0 },
          { name: 'Finalized', value: summary.finalizedPfeProjects ?? 0 },
        ].filter((d) => d.value > 0)
      : [],
    pfeBySpecialite: pfeBySpecialite.map((s) => ({ name: s.specialiteName, value: s.count })),
    moduleBySpecialite: moduleBySpecialite.map((s) => ({ name: s.specialiteName, value: s.count })),
    disciplineByType: disciplineByType.map((d) => ({ name: d.infractionName, value: d.count })),
  }), [summary, pfeBySpecialite, moduleBySpecialite, disciplineByType]);

  // ── PFE tab — real data sourced from /teacher/dashboard pfeBreakdown ─
  const pfeData = useMemo(() => {
    const themes = (pfeBreakdown || []).map((g) => ({
      id: g.groupId,
      title: g.subjectTitle || g.groupName,
      type: g.isFinalized ? 'finalized' : 'active',
      specialite: g.groupName,
      status: g.isFinalized ? 'finalized' : 'en_cours',
      studentsCount: g.studentCount ?? 0,
    }));
    const statusDistribution = [
      { name: 'Active', value: summary?.activePfeProjects ?? 0 },
      { name: 'Finalized', value: summary?.finalizedPfeProjects ?? 0 },
    ].filter((d) => d.value > 0);
    return {
      stats: {
        totalThemes: summary?.pfeProjects ?? 0,
        totalStudents: summary?.supervisedStudents ?? 0,
        totalGroups: summary?.pfeGroups ?? 0,
        averageGroupSize: summary?.averagePfeGroupSize ?? 0,
      },
      diversity: (pfeBreakdown || []).map((g) => ({
        name: g.groupName,
        value: g.studentCount ?? 0,
      })),
      statusDistribution,
      themes,
    };
  }, [pfeBreakdown, summary]);

  // ── Jury tab — no NEW endpoint ────────────────────────────────────────
  const juryData = useMemo(() => ({
    summary: { totalThemes: 0 },
    themes: [],
  }), []);

  // ── Teaching tab — derived from teachingItems ─────────────────────────
  const teachingDerived = useMemo(() => {
    const grouped = new Map();
    const typeCounts = { cours: 0, td: 0, tp: 0, online: 0 };
    const distinctModules = new Set();
    const distinctPromos = new Set();

    for (const item of teachingItems) {
      const moduleKey = item.module?.id ?? `none-${item.id}`;
      if (!grouped.has(moduleKey)) {
        grouped.set(moduleKey, { module: item.module, rows: [] });
      }
      grouped.get(moduleKey).rows.push(item);

      const t = String(item.type || '').toLowerCase();
      if (typeCounts[t] !== undefined) typeCounts[t] += 1;
      if (item.module?.id) distinctModules.add(item.module.id);
      if (item.promo?.id) distinctPromos.add(item.promo.id);
    }

    return {
      groups: Array.from(grouped.values()),
      typeChart: [
        { name: 'COURS', value: typeCounts.cours },
        { name: 'TD', value: typeCounts.td },
        { name: 'TP', value: typeCounts.tp },
        { name: 'ONLINE', value: typeCounts.online },
      ],
      stats: {
        total: teachingItems.length,
        modules: distinctModules.size,
        promos: distinctPromos.size,
      },
    };
  }, [teachingItems]);

  const loading = loadingOverview;

  const handleReport = (student) => {
    setReportTarget(student);
    setModalOpen(false);
  };

  // ── Render helpers for each tab ───────────────────────────────────────
  const renderOverview = () => {
    const documentChartData = documentBreakdown.map((d) => ({ name: d.typeName, value: d.total }));

    return (
      <div className="space-y-6 mt-6">

        {/* ── Quick Access ──────────────────────────────────────────── */}
        <QuickAccess navigate={navigate} hasPresident={hasPresidentMembership} />

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard label="Supervised Students" value={summary?.supervisedStudents ?? 0} accent="brand" />
          <KpiCard label="PFE Groups" value={summary?.pfeGroups ?? 0} accent="success" />
          <KpiCard label="PFE Projects" value={summary?.pfeProjects ?? 0} accent="warning" />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="My PFE Projects" data={chartsData.pfeProjectsByStatus} variant="pie" palette={CHART_PALETTE} />
          <ChartCard title="Document Requests by Type" data={documentChartData} variant="bar" color="#00C49F" />
          <ChartCard title="Disciplinary Cases by Type" data={chartsData.disciplineByType} variant="bar" color="#FF8042" />
        </div>
      </div>
    );
  };

  const renderPfe = () => (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="My PFE Projects" value={pfeData.stats.totalThemes} accent="brand" />
        <KpiCard label="My PFE Groups" value={pfeData.stats.totalGroups} accent="success" />
        <KpiCard label="Supervised Students" value={pfeData.stats.totalStudents} accent="warning" />
        <KpiCard label="Avg Group Size" value={pfeData.stats.averageGroupSize} accent="brand" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Students per PFE Group" data={pfeData.diversity} variant="pie" palette={CHART_PALETTE} />
        <ChartCard title="Project Status" data={pfeData.statusDistribution} variant="bar" color="#8884d8" />
      </div>

      <div className="bg-surface rounded-lg border border-edge shadow-card overflow-hidden">
        <h3 className="p-6 text-lg font-bold text-ink border-b border-edge">My Supervised PFE Groups</h3>
        <table className="w-full text-left border-collapse">
          <thead className="bg-edge/20 text-ink-secondary text-sm">
            <tr>
              <th className="p-4 border-b border-edge font-medium">Subject / Group</th>
              <th className="p-4 border-b border-edge font-medium">Group Name</th>
              <th className="p-4 border-b border-edge font-medium">Status</th>
              <th className="p-4 border-b border-edge font-medium">Students</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {pfeData.themes.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-ink-tertiary">
                  No PFE groups assigned.
                </td>
              </tr>
            ) : (
              pfeData.themes.map((theme) => (
                <tr key={theme.id} className="hover:bg-edge/10">
                  <td className="p-4 border-b border-edge font-medium">{theme.title}</td>
                  <td className="p-4 border-b border-edge">{theme.specialite}</td>
                  <td className="p-4 border-b border-edge">
                    <span
                      className={`px-2 py-1 text-xs rounded-full uppercase tracking-wider font-semibold ${
                        theme.status === 'finalized'
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {String(theme.status || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 border-b border-edge font-bold">{theme.studentsCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderJury = () => (
    <div className="mt-6 space-y-6">
      <div className="bg-surface rounded-lg border border-edge shadow-card p-6 inline-flex flex-col">
        <span className="text-sm text-ink-secondary uppercase font-semibold tracking-wider">
          Total Jury Themes
        </span>
        <span className="text-3xl font-bold text-brand mt-2">{juryData.summary.totalThemes}</span>
      </div>

      <div className="bg-surface rounded-lg border border-edge shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-edge/20 text-ink-secondary text-sm">
            <tr>
              <th className="p-4 border-b border-edge font-medium">Theme</th>
              <th className="p-4 border-b border-edge font-medium">Roles</th>
              <th className="p-4 border-b border-edge font-medium">Date</th>
              <th className="p-4 border-b border-edge font-medium">Salle</th>
              <th className="p-4 border-b border-edge font-medium">Students</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {juryData.themes.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-ink-tertiary">
                  No jury themes found.
                </td>
              </tr>
            ) : (
              juryData.themes.map((theme) => (
                <tr key={theme.id} className="hover:bg-edge/10">
                  <td className="p-4 border-b border-edge font-medium">{theme.title}</td>
                  <td className="p-4 border-b border-edge">
                    <div className="flex gap-2 flex-wrap">
                      {(theme.roles || []).map((r) => (
                        <span
                          key={r}
                          className="px-2 py-1 bg-brand/10 text-brand text-xs rounded-md font-semibold"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 border-b border-edge">
                    {theme.date ? new Date(theme.date).toLocaleDateString() : 'TBD'}
                  </td>
                  <td className="p-4 border-b border-edge">{theme.salle || 'TBD'}</td>
                  <td className="p-4 border-b border-edge">
                    {(theme.students || []).map((s) => (
                      <div key={s}>{s}</div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeaching = () => (
    <div className="mt-6 space-y-6">
      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">My Teaching</h3>
          <p className="text-sm text-ink-tertiary">Modules you are assigned to (cours, td, tp, online).</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Year</span>
          <select
            value={teachingYear}
            onChange={(e) => setTeachingYear(e.target.value)}
            className="rounded-md border border-edge bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          >
            <option value="">Active year</option>
            <option value="all">All years</option>
            {teachingYears.map((y) => (
              <option key={`tch-y-${y.id}`} value={y.id}>{y.name}{y.isActive ? ' (active)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Assignments" value={teachingDerived.stats.total} accent="brand" />
        <KpiCard label="Distinct Modules" value={teachingDerived.stats.modules} accent="success" />
        <KpiCard label="Distinct Promos" value={teachingDerived.stats.promos} accent="warning" />
      </div>

      {/* Type distribution bar chart */}
      <ChartCard
        title="Teaching Distribution by Type"
        data={teachingDerived.typeChart}
        variant="bar"
        color="#0088FE"
      />

      {/* Grouped list */}
      <div className="bg-surface rounded-lg border border-edge shadow-card overflow-hidden">
        <h3 className="p-6 text-lg font-bold text-ink border-b border-edge">My Modules &amp; Promos</h3>
        {teachingLoading ? (
          <div className="p-8 text-center text-sm text-ink-tertiary">Loading…</div>
        ) : teachingDerived.groups.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-tertiary">
            No teaching assignments for this filter.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-edge/20 text-ink-secondary text-sm">
              <tr>
                <th className="p-4 border-b border-edge font-medium">Module</th>
                <th className="p-4 border-b border-edge font-medium">Promo</th>
                <th className="p-4 border-b border-edge font-medium">Type</th>
                <th className="p-4 border-b border-edge font-medium">Year</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {teachingDerived.groups.flatMap(({ module, rows }) =>
                rows.map((row, idx) => (
                  <tr key={`tch-${row.id}`} className="hover:bg-edge/10 border-b border-edge last:border-b-0">
                    <td className="p-4 font-medium text-ink">
                      {idx === 0 ? (
                        <>
                          {module?.code ? <span className="font-mono text-ink-tertiary mr-2">{module.code}</span> : null}
                          {module?.nom_ar || module?.nom_en || '—'}
                        </>
                      ) : (
                        <span className="text-ink-tertiary text-xs">↳ same module</span>
                      )}
                    </td>
                    <td className="p-4 text-ink-secondary">
                      {(row.promo?.nom_ar || row.promo?.nom_en || '—')}
                      {row.promo?.section ? ` · ${row.promo.section}` : ''}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${TEACHING_TYPE_TONE[row.type] || 'bg-edge/20 text-ink-secondary'}`}>
                        {String(row.type || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-ink-secondary">{row.academicYear?.name || row.anneeUniversitaire || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <ProfileHeader profile={user} />

      {hasPresidentMembership && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/dashboard/discipline/president')}
            className="px-4 py-2 text-sm font-medium text-surface bg-brand rounded-md hover:bg-brand-hover transition-colors"
          >
            Open Decision Panel
          </button>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {toast && (
        <div className="bg-success/10 border border-success/30 text-success text-sm px-4 py-3 rounded-md">
          {toast}
        </div>
      )}

      <nav
        className="flex items-center gap-1 border-b border-edge overflow-x-auto"
        role="tablist"
        aria-label="Teacher dashboard sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-tertiary hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'pfe' && renderPfe()}
          {activeTab === 'jury' && renderJury()}
          {activeTab === 'teaching' && renderTeaching()}
        </>
      )}

      <StudentListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        students={modalData.students}
        onReport={handleReport}
      />

      <ReportStudentModal
        student={reportTarget}
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmitted={() => {
          setToast('Report submitted. Case created for review.');
          window.setTimeout(() => setToast(''), 4000);
        }}
      />
    </div>
  );
}

function KpiCard({ label, value, accent = 'brand' }) {
  const tones = {
    brand:   { bg: 'bg-brand/10',   text: 'text-brand' },
    success: { bg: 'bg-success/10', text: 'text-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
    danger:  { bg: 'bg-danger/10',  text: 'text-danger' },
  };
  const tone = tones[accent] || tones.brand;
  return (
    <div className={`${tone.bg} rounded-xl border border-edge p-4 flex flex-col gap-1`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${tone.text}`}>{value}</p>
    </div>
  );
}


function ChartCard({ title, data, variant, color, palette, offset = 0 }) {
  const isEmpty = !Array.isArray(data) || data.length === 0 || data.every((d) => !d.value);

  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
      {title && <h3 className="text-base font-semibold text-ink mb-4">{title}</h3>}
      <div className="h-64">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-sm text-ink-tertiary">
            No data available
          </div>
        ) : variant === 'pie' ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie 
                data={data} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={60}
                outerRadius={80} 
                paddingAngle={5}
                label={{ 
                  fill: 'var(--color-ink-secondary)', 
                  fontSize: 10,
                  fontWeight: 600
                }}
              >
                {data.map((_, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={(palette || CHART_PALETTE)[(i + offset) % (palette || CHART_PALETTE).length]} 
                    stroke="var(--color-surface)"
                    strokeWidth={3}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-edge)',
                  color: 'var(--color-ink)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '1px solid var(--color-edge-strong)'
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px', 
                  fontSize: '11px', 
                  fontWeight: 500,
                  color: 'var(--color-ink-secondary)' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                stroke="var(--color-ink-tertiary)" 
                fontSize={10}
                fontWeight={600}
                tick={{ fill: 'var(--color-ink-secondary)' }}
                axisLine={{ stroke: 'var(--color-edge)', strokeWidth: 1 }}
                tickLine={{ stroke: 'var(--color-edge)' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis 
                stroke="var(--color-ink-tertiary)" 
                fontSize={10}
                fontWeight={600}
                tick={{ fill: 'var(--color-ink-secondary)' }}
                axisLine={{ stroke: 'var(--color-edge)', strokeWidth: 1 }}
                tickLine={{ stroke: 'var(--color-edge)' }}
              />
              <Tooltip 
                cursor={{ fill: 'var(--color-brand)', opacity: 0.05 }}
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-edge)',
                  color: 'var(--color-ink)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '1px solid var(--color-edge-strong)'
                }}
                itemStyle={{ color: 'var(--color-ink)' }}
              />
              <Bar 
                dataKey="value" 
                fill={color || 'var(--color-brand)'} 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   QUICK ACCESS COMPONENT
   ════════════════════════════════════════════════════════════ */

const QUICK_LINKS = [
  {
    id: 'news',
    label: 'News & Announcements',
    description: 'Latest university news, events and notices',
    path: '/dashboard/actualites',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    border: 'hover:border-blue-400/50',
    iconBg: 'bg-blue-500/10 text-blue-500',
    chevron: 'group-hover:text-blue-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
      </svg>
    ),
  },
  {
    id: 'conseil',
    label: 'Disciplinary Council',
    description: 'Manage disciplinary cases and committee reports',
    path: '/dashboard/discipline/report',
    gradient: 'from-orange-500/10 to-red-500/10',
    border: 'hover:border-orange-400/50',
    iconBg: 'bg-orange-500/10 text-orange-500',
    chevron: 'group-hover:text-orange-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.59 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
      </svg>
    ),
  },
  {
    id: 'documents',
    label: 'Document Requests',
    description: 'Request and track official university documents',
    path: '/dashboard/documents',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    border: 'hover:border-emerald-400/50',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    chevron: 'group-hover:text-emerald-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: 'remise',
    label: 'Copy Submission',
    description: 'Submit and manage corrected exam copies',
    path: '/dashboard/remise-copies',
    gradient: 'from-violet-500/10 to-purple-500/10',
    border: 'hover:border-violet-400/50',
    iconBg: 'bg-violet-500/10 text-violet-600',
    chevron: 'group-hover:text-violet-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
      </svg>
    ),
  },
];

function QuickAccess({ navigate }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
          Quick Access
        </h2>
        <div className="flex-1 h-px bg-edge" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => navigate(link.path)}
            className={`
              group relative flex flex-col items-start gap-3 p-4 rounded-xl
              bg-gradient-to-br ${link.gradient}
              border border-edge ${link.border}
              shadow-sm hover:shadow-md
              transition-all duration-200 ease-out
              hover:-translate-y-0.5 active:translate-y-0
              text-left w-full
            `}
          >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${link.iconBg} transition-transform duration-200 group-hover:scale-110`}>
              {link.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink leading-tight truncate">
                {link.label}
              </p>
              <p className="text-xs text-ink-tertiary mt-0.5 leading-snug line-clamp-2">
                {link.description}
              </p>
            </div>

            {/* Chevron */}
            <svg
              className={`w-4 h-4 text-ink-muted ${link.chevron} transition-all duration-200 group-hover:translate-x-0.5 self-end`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
