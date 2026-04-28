import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MAIN_SECTIONS = [
  {
    key: 'users',
    title: 'User Management',
    to: '/dashboard/admin/users',
    icon: Users,
  },
  {
    key: 'students',
    title: 'Student Management',
    to: '/dashboard/admin/users',
    icon: GraduationCap,
  },
  {
    key: 'teachers',
    title: 'Teacher Management',
    to: '/dashboard/admin/users',
    icon: UserCog,
  },
  {
    key: 'academic-assignment',
    title: 'Academic Assignment',
    to: '/dashboard/admin/academic/assignments',
    icon: Settings2,
  },
  {
    key: 'pfe-management',
    title: 'PFE Management',
    to: '/dashboard/admin/pfe',
    icon: BookOpen,
  },
  {
    key: 'affectation',
    title: 'Affectation Campaigns',
    to: '/dashboard/admin/affectation',
    icon: Shuffle,
  },
  {
    key: 'disciplinary',
    title: 'Disciplinary Management',
    to: '/dashboard/disciplinary',
    icon: ShieldAlert,
  },
  {
    key: 'analytics',
    title: 'System Analytics',
    to: '/dashboard/admin/analytics',
    icon: BarChart3,
  },
  {
    key: 'user-history',
    title: 'User Activity History',
    to: '/dashboard/admin/history',
    icon: History,
  },
];

function AdminSectionButton({ to, title, Icon }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-xl border border-edge bg-surface px-4 py-3 text-sm font-medium text-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand group-hover:bg-brand/15">
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <span>{title}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 text-ink-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        strokeWidth={2}
      />
    </Link>
  );
}

export default function AdminPanelPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-brand/5 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Admin Control Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-secondary">
            Manage your system efficiently with a modern, centralized control panel.
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            Signed in as {user?.prenom} {user?.nom}
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-edge bg-surface p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">Main Sections</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Choose a section to continue administration tasks.
            </p>
          </div>
          <Link
            to="/dashboard/admin/site-settings"
            className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            <Settings2 className="h-4 w-4" strokeWidth={2} />
            Site Configuration
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MAIN_SECTIONS.map((section) => (
            <AdminSectionButton
              key={section.key}
              to={section.to}
              title={section.title}
              Icon={section.icon}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
