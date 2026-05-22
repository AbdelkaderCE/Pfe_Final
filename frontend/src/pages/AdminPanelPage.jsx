import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  History,
  ShieldAlert,
  Shuffle,
  Settings2,
  UserCog,
  Users,
  ArrowRight,
  FileText,
  Megaphone,
  Activity,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminPanelAPI } from '../services/api';
import { KpiCard, Walkthrough } from '../design-system/components';
import useFirstTimeTour from '../hooks/useFirstTimeTour';

const MAIN_SECTIONS = [
  { key: 'users',               title: 'User Management',       to: '/dashboard/admin/users',                  icon: Users,        hint: 'Roles, accounts, status' },
  { key: 'students',            title: 'Student Import',        to: '/dashboard/admin/students/import',       icon: GraduationCap, hint: 'CSV roster and credentials' },
  { key: 'teachers',            title: 'Teacher Import',        to: '/dashboard/admin/teachers/import',       icon: UserCog,       hint: 'CSV roster and credentials' },
  { key: 'academic-assignment', title: 'Academic Assignment',   to: '/dashboard/admin/academic/assignments',   icon: Settings2,     hint: 'Modules ↔ teachers ↔ promos' },
  { key: 'pfe-workspace',       title: 'PFE Workspace',         to: '/dashboard/pfe-workspace',               icon: BookOpen,      hint: 'Unified PFE hub' },
  { key: 'affectation',         title: 'Affectation Campaigns', to: '/dashboard/admin/affectation',            icon: Shuffle,       hint: 'Specialty assignment cycles' },
  { key: 'disciplinary',        title: 'Disciplinary Council',  to: '/dashboard/disciplinary',                 icon: ShieldAlert,   hint: 'Cases and sanctions' },
  { key: 'analytics',           title: 'System Analytics',      to: '/dashboard/admin/analytics',              icon: BarChart3,     hint: 'Charts and per-user drill-down' },
  { key: 'user-history',        title: 'User Activity History', to: '/dashboard/admin/history',                icon: History,       hint: 'Audit trail' },
];

function AdminSectionButton({ to, title, hint, Icon }) {
  return (
    <Link
      to={to}
      className="group flex items-start justify-between gap-3 rounded-xl border border-edge bg-surface px-4 py-3.5 text-sm font-medium text-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <span className="flex items-start gap-3 min-w-0">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand group-hover:bg-brand/15">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block leading-tight">{title}</span>
          {hint && <span className="block mt-0.5 text-xs font-normal text-ink-tertiary truncate">{hint}</span>}
        </span>
      </span>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        strokeWidth={2}
      />
    </Link>
  );
}

const ADMIN_TOUR_STEPS = [
  {
    Icon: Sparkles,
    title: 'Welcome to the Admin Center',
    body: "This is your home base. Live KPIs at the top, quick links to every administration area below — all driven by the same numbers students and teachers see.",
  },
  {
    Icon: Activity,
    title: 'At-a-glance KPIs',
    body: "Total users, the student/teacher split, pending workload (reclamations + justifications + documents + open disciplinary cases), and announcement count. Hover any number for the precise definition.",
  },
  {
    Icon: BookOpen,
    title: 'PFE Workspace',
    body: 'Subjects, groups, jury composition, and defense scheduling now live in a single PFE workspace with role-based views and shared data.',
  },
  {
    Icon: BarChart3,
    title: 'System Analytics',
    body: 'Need deeper drill-downs? Open Analytics for charts and a per-user inspector. The search box there opens any dashboard exactly as that user sees it.',
  },
];

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const tour = useFirstTimeTour({
    userId: user?.id,
    tourId: 'admin-panel-v1',
    ready: Boolean(user?.id),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAnalyticsLoading(true);
        const res = await adminPanelAPI.getAnalytics();
        if (!cancelled) setAnalytics(res?.data || null);
      } catch {
        if (!cancelled) setAnalytics(null);
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const usersTotal     = analytics?.users?.total ?? 0;
  const usersActive    = analytics?.users?.active ?? 0;
  const usersStudents  = analytics?.users?.students ?? 0;
  const usersTeachers  = analytics?.users?.teachers ?? 0;
  const reclamationsPending  = analytics?.reclamations?.pending ?? 0;
  const justificationsPending = analytics?.justifications?.pending ?? 0;
  const documentsPending = analytics?.documents?.pending ?? 0;
  const disciplineOpen   = analytics?.discipline?.openCases ?? 0;
  const announcementsTotal = analytics?.announcements?.total ?? 0;

  const totalPendingWork = reclamationsPending + justificationsPending + documentsPending + disciplineOpen;

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-brand/5 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Administration
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Admin Control Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            System-wide overview and quick access to administration tasks.
          </p>
          {user && (
            <p className="mt-1 text-xs text-ink-tertiary">
              Signed in as {user.prenom} {user.nom}
            </p>
          )}
          <button
            type="button"
            onClick={tour.replay}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Replay tour
          </button>
        </div>
      </header>

      <Walkthrough
        open={tour.open}
        title="Admin Center · Tour"
        steps={ADMIN_TOUR_STEPS}
        onClose={tour.dismiss}
        onFinish={tour.markSeen}
      />

      {/* ── KPI row ──────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-tertiary">At a glance</h2>
          <Link
            to="/dashboard/admin/analytics"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover"
          >
            Open analytics
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total users"
            value={analyticsLoading ? '…' : usersTotal.toLocaleString()}
            hint={`${usersActive} active accounts`}
            Icon={Users}
            tone="brand"
            tooltip="Every account regardless of role"
          />
          <KpiCard
            label="Students / Teachers"
            value={analyticsLoading ? '…' : `${usersStudents} / ${usersTeachers}`}
            hint="Enrolled vs. faculty"
            Icon={GraduationCap}
            tone="success"
            tooltip="Counts of users with the etudiant and enseignant roles"
          />
          <KpiCard
            label="Pending workload"
            value={analyticsLoading ? '…' : totalPendingWork}
            hint={`${reclamationsPending} reclamations · ${justificationsPending} justifications`}
            Icon={Activity}
            tone="warning"
            tooltip="Reclamations + justifications + document requests + open disciplinary cases"
          />
          <KpiCard
            label="Announcements"
            value={analyticsLoading ? '…' : announcementsTotal}
            hint={`${disciplineOpen} disciplinary cases open`}
            Icon={Megaphone}
            tone="ink"
            tooltip="Total announcements ever published"
          />
        </div>
      </section>

      {/* ── Quick actions ────────────────────────────────── */}
      <section className="rounded-2xl border border-edge bg-surface p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">Main sections</h2>
            <p className="mt-0.5 text-sm text-ink-secondary">
              Choose a section to continue administration tasks.
            </p>
          </div>
          <Link
            to="/dashboard/admin/site-settings"
            className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            <Settings2 className="h-4 w-4" strokeWidth={2} />
            Site configuration
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MAIN_SECTIONS.map((section) => (
            <AdminSectionButton
              key={section.key}
              to={section.to}
              title={section.title}
              hint={section.hint}
              Icon={section.icon}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
