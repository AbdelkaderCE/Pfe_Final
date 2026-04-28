/*
  AdminAnalyticsPage — global KPIs for administrators.

  Data is fetched from a single endpoint (/api/v1/admin/analytics) backed by
  the centralized statistics service. Every metric shown here uses the same
  query definition as the student and teacher dashboards — so a "pending
  reclamation" is a pending reclamation everywhere.
*/

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  GraduationCap,
  UserCog,
  FileText,
  Megaphone,
  BookOpenCheck,
  ShieldAlert,
  Rocket,
  Layers,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { adminPanelAPI, academicAPI } from '../../services/api';

const TEACHING_TYPE_FILL = {
  cours: '#6366f1',
  td: '#16a34a',
  tp: '#f59e0b',
  online: '#0ea5e9',
};

const AnalyticsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-edge rounded-lg shadow-md px-3 py-2 text-xs">
      {label && <p className="font-semibold text-ink mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="tabular-nums">
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, children }) {
  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm overflow-hidden">
      <h3 className="px-5 py-4 text-sm font-semibold text-ink border-b border-edge">{title}</h3>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, accent = 'brand' }) {
  const accentMap = {
    brand: { bg: 'bg-brand/10', text: 'text-brand' },
    success: { bg: 'bg-success/10', text: 'text-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
    danger: { bg: 'bg-danger/10', text: 'text-danger' },
    ink: { bg: 'bg-edge/30', text: 'text-ink' },
  };
  const tone = accentMap[accent] || accentMap.brand;

  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm p-5 flex items-start gap-4 transition-shadow hover:shadow-md">
      <div className={`p-3 rounded-full flex-shrink-0 ${tone.bg}`}>
        <Icon className={`w-6 h-6 ${tone.text}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide font-semibold text-ink-tertiary">
          {title}
        </p>
        <p className="text-2xl font-bold text-ink mt-1 tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-xs text-ink-secondary mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-ink-tertiary">{description}</p>
      )}
    </div>
  );
}

function MetricTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm overflow-hidden">
      <h3 className="px-5 py-4 text-sm font-semibold text-ink border-b border-edge">
        {title}
      </h3>
      <dl className="divide-y divide-edge">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-5 py-3 text-sm"
          >
            <dt className="text-ink-secondary">{row.label}</dt>
            <dd className="font-semibold text-ink tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function UserListCard({ title, icon: Icon, users, loading, emptyMessage }) {
  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-edge">
        <div className="p-2 rounded-full bg-brand/10">
          <Icon className="w-4 h-4 text-brand" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      {loading ? (
        <div className="p-5 flex items-center gap-2 text-sm text-ink-tertiary">
          <div className="w-4 h-4 border-2 border-edge-strong border-t-brand rounded-full animate-spin" />
          Loading…
        </div>
      ) : !users || users.length === 0 ? (
        <p className="p-5 text-sm text-ink-tertiary">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-edge">
          {users.map((user) => {
            const fullName = [user.prenom, user.nom]
              .filter((part) => part && String(part).trim())
              .join(' ')
              .trim() || user.email || `User #${user.id}`;
            return (
              <li key={user.id}>
                <Link
                  to={`/dashboard/admin/user/${user.id}`}
                  className="group flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-brand/5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{fullName}</p>
                    {user.email && (
                      <p className="text-xs text-ink-tertiary truncate">{user.email}</p>
                    )}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-ink-tertiary shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-brand rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Teaching analytics — sourced from /api/v1/enseignements with year scope.
  const [teachingItems, setTeachingItems] = useState([]);
  const [teachingYears, setTeachingYears] = useState([]);
  const [teachingYearFilter, setTeachingYearFilter] = useState('');
  const [teachingLoading, setTeachingLoading] = useState(true);

  const charts = useMemo(() => {
    if (!data) return null;

    const userRolesData = [
      { name: 'Students', value: data.users.students, fill: '#2563eb' },
      { name: 'Teachers', value: data.users.teachers, fill: '#16a34a' },
      { name: 'Other',    value: Math.max(0, data.users.total - data.users.students - data.users.teachers), fill: '#7c3aed' },
    ].filter((d) => d.value > 0);

    const userStatusData = [
      { name: 'Active',    value: data.users.active,    fill: '#16a34a' },
      { name: 'Inactive',  value: data.users.inactive,  fill: '#9ca3af' },
      { name: 'Suspended', value: data.users.suspended, fill: '#ef4444' },
    ].filter((d) => d.value > 0);

    const activityPipelineData = [
      {
        category: 'Reclamations',
        Pending:  data.reclamations.pending,
        Approved: data.reclamations.approved,
        Rejected: data.reclamations.rejected,
      },
      {
        category: 'Justifications',
        Pending:  data.justifications.pending,
        Approved: data.justifications.approved,
        Rejected: data.justifications.rejected,
      },
      {
        category: 'Documents',
        Pending:  (data.documents?.pending ?? 0) + (data.documents?.processing ?? 0),
        Approved: data.documents?.approved ?? 0,
        Rejected: data.documents?.rejected ?? 0,
      },
    ];

    const disciplineData = [
      { name: 'Open',   value: data.discipline.openCases,   fill: '#f59e0b' },
      { name: 'Closed', value: data.discipline.closedCases, fill: '#6b7280' },
    ].filter((d) => d.value > 0);

    return { userRolesData, userStatusData, activityPipelineData, disciplineData };
  }, [data]);

  // Aggregations for the Teaching section. All client-side because the
  // /api/v1/enseignements payload is small (one row per assignment) — no
  // need for an extra dedicated endpoint per "ONLY reuse existing endpoints".
  const teaching = useMemo(() => {
    const distinctTeachers = new Set();
    const distinctModules = new Set();
    const typeCounts = { cours: 0, td: 0, tp: 0, online: 0 };
    const promoCounts = new Map(); // promoLabel → distinct module count
    const promoModuleSets = new Map(); // promoLabel → Set<moduleId>
    const teacherCounts = new Map(); // teacherLabel → enseignement count

    for (const item of teachingItems) {
      if (item.enseignant?.id) distinctTeachers.add(item.enseignant.id);
      if (item.module?.id) distinctModules.add(item.module.id);

      const t = String(item.type || '').toLowerCase();
      if (typeCounts[t] !== undefined) typeCounts[t] += 1;

      const promoLabel = item.promo?.nom_ar || item.promo?.nom_en
        ? `${item.promo?.nom_ar || item.promo?.nom_en}${item.promo?.section ? ` · ${item.promo.section}` : ''}`
        : 'Unassigned';
      if (!promoModuleSets.has(promoLabel)) promoModuleSets.set(promoLabel, new Set());
      if (item.module?.id) promoModuleSets.get(promoLabel).add(item.module.id);

      const teacherLabel = item.enseignant?.user
        ? `${item.enseignant.user.prenom || ''} ${item.enseignant.user.nom || ''}`.trim() || item.enseignant.user.email
        : item.enseignant?.id
          ? `Teacher ${item.enseignant.id}`
          : 'Unassigned';
      teacherCounts.set(teacherLabel, (teacherCounts.get(teacherLabel) || 0) + 1);
    }

    for (const [label, set] of promoModuleSets.entries()) {
      promoCounts.set(label, set.size);
    }

    const modulesPerPromo = Array.from(promoCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const typeDistribution = [
      { name: 'COURS', value: typeCounts.cours, fill: TEACHING_TYPE_FILL.cours },
      { name: 'TD', value: typeCounts.td, fill: TEACHING_TYPE_FILL.td },
      { name: 'TP', value: typeCounts.tp, fill: TEACHING_TYPE_FILL.tp },
      { name: 'ONLINE', value: typeCounts.online, fill: TEACHING_TYPE_FILL.online },
    ].filter((d) => d.value > 0);

    // Top 10 teachers by workload (rest collapse into "Others") so the chart
    // stays readable even with 100+ teachers in the system.
    const allTeacherEntries = Array.from(teacherCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const topTeachers = allTeacherEntries.slice(0, 10);
    const restTotal = allTeacherEntries.slice(10).reduce((sum, e) => sum + e.value, 0);
    const teacherWorkload = restTotal > 0
      ? [...topTeachers, { name: `Others (${allTeacherEntries.length - 10})`, value: restTotal }]
      : topTeachers;

    return {
      stats: {
        total: teachingItems.length,
        teachers: distinctTeachers.size,
        modules: distinctModules.size,
      },
      modulesPerPromo,
      typeDistribution,
      teacherWorkload,
    };
  }, [teachingItems]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await adminPanelAPI.getAnalytics();
        if (!cancelled) setData(response?.data || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Year list for the teaching year selector — load once.
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

  // Teaching items — refetch when the year filter changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTeachingLoading(true);
        const filter =
          teachingYearFilter === 'all'
            ? { academicYearId: 'all' }
            : teachingYearFilter
              ? { academicYearId: Number(teachingYearFilter) }
              : {}; // empty => server defaults to active year
        const res = await academicAPI.listEnseignements(filter);
        if (!cancelled) setTeachingItems(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (!cancelled) setTeachingItems([]);
      } finally {
        if (!cancelled) setTeachingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [teachingYearFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setUsersLoading(true);
        const [studentsRes, teachersRes] = await Promise.all([
          adminPanelAPI.getUsers({ role: 'etudiant', limit: 20 }),
          adminPanelAPI.getUsers({ role: 'enseignant', limit: 20 }),
        ]);
        if (!cancelled) {
          setStudents(
            Array.isArray(studentsRes?.data?.items)
              ? studentsRes.data.items
              : Array.isArray(studentsRes?.data)
                ? studentsRes.data
                : []
          );
          setTeachers(
            Array.isArray(teachersRes?.data?.items)
              ? teachersRes.data.items
              : Array.isArray(teachersRes?.data)
                ? teachersRes.data
                : []
          );
        }
      } catch {
        if (!cancelled) {
          setStudents([]);
          setTeachers([]);
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const generatedAtLabel = data.generatedAt
    ? new Date(data.generatedAt).toLocaleString()
    : '';

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-brand/5 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Administration
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            System Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            Global view of the platform — aggregated from the same data sources
            used by student and teacher dashboards.
          </p>
          {generatedAtLabel && (
            <p className="mt-2 text-xs text-ink-tertiary">
              Refreshed at {generatedAtLabel}
            </p>
          )}
        </div>
      </header>

      <section>
        <SectionHeader
          title="People"
          description="User base across roles and account states."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total users"
            value={data.users.total}
            subtitle={`${data.users.active} active`}
            icon={Users}
            accent="brand"
          />
          <StatCard
            title="Students"
            value={data.users.students}
            subtitle="Enrolled accounts"
            icon={GraduationCap}
            accent="success"
          />
          <StatCard
            title="Teachers"
            value={data.users.teachers}
            subtitle="Active faculty"
            icon={UserCog}
            accent="ink"
          />
          <StatCard
            title="Suspended"
            value={data.users.suspended}
            subtitle={`${data.users.inactive} inactive`}
            icon={ShieldAlert}
            accent="warning"
          />
        </div>
      </section>

      {charts && (
        <section>
          <SectionHeader
            title="Visual Overview"
            description="At-a-glance charts derived from the figures above."
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Users by Role">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={charts.userRolesData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={76}
                    paddingAngle={3}
                  >
                    {charts.userRolesData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Account Status">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={charts.userStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={76}
                    paddingAngle={3}
                  >
                    {charts.userStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Discipline Cases">
              {charts.disciplineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={charts.disciplineData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={76}
                      paddingAngle={3}
                    >
                      {charts.disciplineData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-ink-tertiary">
                  No disciplinary cases
                </div>
              )}
            </ChartCard>
          </div>

          <div className="mt-4">
            <ChartCard title="Activity Pipeline — Pending / Approved / Rejected">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={charts.activityPipelineData}
                  margin={{ top: 4, right: 16, left: -10, bottom: 0 }}
                  barGap={4}
                  barCategoryGap="35%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e6e8eb)" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12, fill: 'var(--color-ink-secondary, #4b5160)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary, #7c8294)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Pending"  fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Approved" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          title="Activity"
          description="Requests, announcements, and academic content."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total requests"
            value={data.reclamations.total}
            subtitle={`${data.reclamations.pending} pending`}
            icon={FileText}
            accent="brand"
          />
          <StatCard
            title="Pending requests"
            value={data.reclamations.pending}
            subtitle="Awaiting response"
            icon={FileText}
            accent="warning"
          />
          <StatCard
            title="Total justifications"
            value={data.justifications.total}
            subtitle={`${data.justifications.pending} pending`}
            icon={BookOpenCheck}
            accent="emerald"
          />
          <StatCard
            title="Pending justifications"
            value={data.justifications.pending}
            subtitle="Under review"
            icon={BookOpenCheck}
            accent="warning"
          />
          <StatCard
            title="Announcements"
            value={data.announcements.total}
            subtitle={`${data.announcements.active} active`}
            icon={Megaphone}
            accent="success"
          />
          <StatCard
            title="Promos / Modules"
            value={`${data.academic.promos} / ${data.academic.modules}`}
            subtitle="Academic catalog"
            icon={Building2}
            accent="ink"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Document Requests"
          description="Requests submitted by teachers for official documents."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total requests"
            value={data.documents?.total ?? 0}
            subtitle={`${data.documents?.pending ?? 0} pending`}
            icon={FileText}
            accent="brand"
          />
          <StatCard
            title="Pending"
            value={data.documents?.pending ?? 0}
            subtitle="Awaiting processing"
            icon={FileText}
            accent="warning"
          />
          <StatCard
            title="Approved"
            value={data.documents?.approved ?? 0}
            subtitle="Documents delivered"
            icon={FileText}
            accent="success"
          />
          <StatCard
            title="Rejected"
            value={data.documents?.rejected ?? 0}
            subtitle="Requests declined"
            icon={FileText}
            accent="danger"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="PFE System"
          description="Final-year projects, supervision, and assignments."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="PFE subjects"
            value={data.pfe.totalSubjects}
            subtitle="Proposed themes"
            icon={BookOpenCheck}
            accent="brand"
          />
          <StatCard
            title="Active PFE groups"
            value={data.pfe.activeGroups}
            subtitle={`${data.pfe.studentsInPfeGroup} students engaged`}
            icon={Layers}
            accent="success"
          />
          <StatCard
            title="Supervisors"
            value={data.pfe.totalSupervisors}
            subtitle="Teachers with PFE load"
            icon={UserCog}
            accent="ink"
          />
          <StatCard
            title="Avg. load"
            value={data.pfe.averageStudentsPerSupervisor}
            subtitle="Students per supervisor"
            icon={Rocket}
            accent="warning"
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Teaching</h2>
            <p className="mt-1 text-sm text-ink-tertiary">
              Enseignement assignments across teachers, modules, and promos.
              Filter by academic year — the default view shows the active year.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">Year</span>
            <select
              value={teachingYearFilter}
              onChange={(e) => setTeachingYearFilter(e.target.value)}
              className="rounded-md border border-edge bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Active year</option>
              <option value="all">All years</option>
              {teachingYears.map((y) => (
                <option key={`an-y-${y.id}`} value={y.id}>{y.name}{y.isActive ? ' (active)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total enseignements"
            value={teaching.stats.total}
            subtitle={teachingLoading ? 'Loading…' : `For the selected scope`}
            icon={BookOpenCheck}
            accent="brand"
          />
          <StatCard
            title="Teachers involved"
            value={teaching.stats.teachers}
            subtitle="Distinct teaching staff"
            icon={UserCog}
            accent="success"
          />
          <StatCard
            title="Modules used"
            value={teaching.stats.modules}
            subtitle="Distinct modules taught"
            icon={Layers}
            accent="ink"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Modules per Promo">
            {teaching.modulesPerPromo.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-ink-tertiary">
                {teachingLoading ? 'Loading…' : 'No data for this scope'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, teaching.modulesPerPromo.length * 26)}>
                <BarChart
                  layout="vertical"
                  data={teaching.modulesPerPromo}
                  margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e6e8eb)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary, #7c8294)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: 'var(--color-ink-secondary, #4b5160)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Bar dataKey="value" name="Modules" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Teaching Type Distribution">
            {teaching.typeDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-ink-tertiary">
                {teachingLoading ? 'Loading…' : 'No data for this scope'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={teaching.typeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {teaching.typeDistribution.map((entry, i) => (
                      <Cell key={`tt-${i}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="mt-4">
          <ChartCard title="Teacher Workload — Enseignements per Teacher (Top 10)">
            {teaching.teacherWorkload.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-ink-tertiary">
                {teachingLoading ? 'Loading…' : 'No data for this scope'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, teaching.teacherWorkload.length * 32)}>
                <BarChart
                  layout="vertical"
                  data={teaching.teacherWorkload}
                  margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e6e8eb)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary, #7c8294)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11, fill: 'var(--color-ink-secondary, #4b5160)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Bar dataKey="value" name="Assignments" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricTable
          title="Request pipeline"
          rows={[
            { label: 'Total', value: data.reclamations.total },
            { label: 'Pending', value: data.reclamations.pending },
            { label: 'Approved', value: data.reclamations.approved },
            { label: 'Rejected', value: data.reclamations.rejected },
          ]}
        />
        <MetricTable
          title="Disciplinary cases"
          rows={[
            { label: 'Open', value: data.discipline.openCases },
            { label: 'Closed', value: data.discipline.closedCases },
            { label: 'Minor', value: data.discipline.byGravity.faible ?? 0 },
            { label: 'Medium', value: data.discipline.byGravity.moyenne ?? 0 },
            { label: 'Grave', value: data.discipline.byGravity.grave ?? 0 },
          ]}
        />
      </section>

      <section>
        <MetricTable
          title="Affectation campaigns"
          rows={[
            { label: 'Total', value: data.campaigns.total },
            { label: 'Draft', value: data.campaigns.draft },
            { label: 'Open', value: data.campaigns.open },
            { label: 'Closed', value: data.campaigns.closed },
            { label: 'Finalized', value: data.campaigns.finalized },
          ]}
        />
      </section>

      <section>
        <SectionHeader
          title="Inspect a user"
          description="Click any name to view their dashboard exactly as they see it (read-only)."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UserListCard
            title="Students"
            icon={GraduationCap}
            users={students}
            loading={usersLoading}
            emptyMessage="No students found."
          />
          <UserListCard
            title="Teachers"
            icon={UserCog}
            users={teachers}
            loading={usersLoading}
            emptyMessage="No teachers found."
          />
        </div>
      </section>
    </div>
  );
}
