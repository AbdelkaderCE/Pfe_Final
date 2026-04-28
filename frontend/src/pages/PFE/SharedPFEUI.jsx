import React from 'react';
import { WifiOff, Lock, AlertTriangle, RefreshCcw, Shield, ChevronRight, FileText, BarChart3, Clock, CheckCircle2, Users, Activity, Zap, TrendingUp } from 'lucide-react';

export const getUserDisplayName = (user) => {
  if (!user) return 'N/A';
  return `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'N/A';
};

export function normalizeApiError(err) {
  if (!err) return { kind: 'unknown', message: 'Unknown error' };
  if (err.code === 'NETWORK_ERROR' || err.status === 0)
    return { kind: 'network', message: 'Server unreachable. Start the backend on http://localhost:5000.' };
  if (err.status === 401)
    return { kind: 'auth', message: 'Session expired. Please sign in again.' };
  if (err.status === 403)
    return { kind: 'forbidden', message: err.message || 'Access denied.' };
  if (err.status >= 500)
    return { kind: 'server', message: err.message || 'Server error. Please try again.' };
  return { kind: 'client', message: err.message || 'Something went wrong.' };
}

export const fmt = (n) => (n ?? 0).toString();

export const SUBJECT_STATUS = {
  propose: { label: 'Pending', bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning', border: 'border-edge', ring: 'ring-warning/20' },
  valide: { label: 'Validated', bg: 'bg-success/10', text: 'text-success', dot: 'bg-success', border: 'border-edge', ring: 'ring-success/20' },
  reserve: { label: 'Reserved', bg: 'bg-brand/10', text: 'text-brand', dot: 'bg-brand', border: 'border-edge', ring: 'ring-brand/20' },
  affecte: { label: 'Assigned', bg: 'bg-surface-200', text: 'text-ink-secondary', dot: 'bg-ink-muted', border: 'border-edge-subtle', ring: 'ring-edge/20' },
  termine: { label: 'Completed', bg: 'bg-surface-300', text: 'text-ink-tertiary', dot: 'bg-ink-muted', border: 'border-edge-subtle', ring: 'ring-edge/10' },
};

export function Shimmer({ className }) {
  return <div className={`animate-pulse rounded bg-surface-300 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Shimmer className="h-5 w-3/4" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-2/3" />
          <div className="flex gap-2 pt-1">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-3 w-16" />
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Shimmer className="h-9 w-20 rounded-lg" />
          <Shimmer className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Shimmer className="h-8 w-24 rounded-full" />
        <Shimmer className="h-8 w-24 rounded-full" />
        <Shimmer className="h-8 w-24 rounded-full" />
      </div>
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function StatusBadge({ status }) {
  const cfg = SUBJECT_STATUS[status] || { label: status || 'Unknown', bg: 'bg-surface-200', text: 'text-ink-secondary', dot: 'bg-ink-muted' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function CapacityBar({ used, max }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const isFull = used >= max;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-surface-300 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${isFull ? 'bg-danger' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-ink-tertiary whitespace-nowrap">{used}/{max}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = FileText, title, hint, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-edge bg-surface p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-200">
        <Icon className="w-6 h-6 text-ink-muted" />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-tertiary max-w-xs mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  const MAP = {
    network: { Icon: WifiOff, cls: 'border-warning/30 bg-warning/10', icon: 'text-warning', title: 'Backend unreachable' },
    auth: { Icon: Lock, cls: 'border-warning/30 bg-warning/10', icon: 'text-warning', title: 'Session expired' },
    forbidden: { Icon: Lock, cls: 'border-danger/30 bg-danger/10', icon: 'text-danger', title: 'Access denied' },
    server: { Icon: AlertTriangle, cls: 'border-danger/30 bg-danger/10', icon: 'text-danger', title: 'Server error' },
  };
  const cfg = MAP[error.kind] || MAP.server;
  const { Icon } = cfg;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border ${cfg.cls} p-4`} role="alert">
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{cfg.title}</p>
        <p className="mt-0.5 text-sm text-ink-secondary">{error.message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-200 transition-colors flex-shrink-0">
          <RefreshCcw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

const ROLE_CFG = {
  admin: { label: 'Administrator', cls: 'bg-brand/10 text-brand border-brand/20' },
  enseignant: { label: 'Teacher', cls: 'bg-success/10 text-success border-success/20' },
  etudiant: { label: 'Student', cls: 'bg-warning/10 text-warning border-warning/20' },
};

export function PageHeader({ role, onRefresh, loading }) {
  const rc = ROLE_CFG[role] || { label: 'User', cls: 'bg-surface-200 text-ink-secondary border-edge' };
  const subtitle = {
    admin: 'Oversee subjects, groups, jury planning, and system configuration.',
    enseignant: 'Manage your research proposals and track assigned groups.',
    etudiant: 'Browse validated subjects and check your group assignment.',
  }[role] || '';

  return (
    <header className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">PFE Workspace</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${rc.cls}`}>
              <Shield className="w-3 h-3" /> {rc.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">PFE Configuration</h1>
          <p className="mt-1 text-sm text-ink-secondary max-w-xl">{subtitle}</p>
        </div>
        <button onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-200 px-4 py-2 text-sm font-medium text-ink-secondary transition-all hover:bg-surface-300 hover:text-ink disabled:opacity-50">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
    </header>
  );
}

export function NavItem({ tab, isActive, onClick, count }) {
  const { Icon } = tab;
  return (
    <button type="button" onClick={onClick} className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-brand text-surface shadow-md' : 'text-ink-secondary hover:bg-surface-200 hover:text-ink'}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left leading-none">{tab.label}</span>
      {count != null && count > 0 && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-brand/10 text-brand'}`}>{count}</span>}
      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${isActive ? 'opacity-40' : 'opacity-0 group-hover:opacity-30'}`} />
    </button>
  );
}

export function LeftNav({ tabs, activeTab, onTabChange, counts }) {
  return (
    <nav className="rounded-2xl border border-edge bg-surface p-3 shadow-card space-y-0.5">
      <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Workspace</p>
      {tabs.map((tab) => (
        <NavItem key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={() => onTabChange(tab.id)} count={counts[tab.id]} />
      ))}
    </nav>
  );
}

export function StatCard({ icon: Icon, label, value, colorCls, loading: statLoading }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4 transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-ink-tertiary">{label}</p>
        <div className={`rounded-lg p-1.5 ${colorCls}`}><Icon className="w-3.5 h-3.5" /></div>
      </div>
      {statLoading ? <Shimmer className="h-7 w-10" /> : <p className="text-2xl font-bold tracking-tight text-ink">{value}</p>}
    </div>
  );
}

export function SystemDot({ status }) {
  const MAP = {
    online: { dot: 'bg-success', label: 'Online', text: 'text-success' },
    degraded: { dot: 'bg-warning animate-pulse', label: 'Degraded', text: 'text-warning' },
    offline: { dot: 'bg-danger animate-pulse', label: 'Offline', text: 'text-danger' },
  };
  const c = MAP[status] || MAP.online;
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={`text-xs font-medium ${c.text}`}>{c.label}</span>
    </div>
  );
}

export function FilterPills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${value === opt.value ? 'bg-brand text-surface shadow-sm' : 'bg-surface-200 text-ink-secondary hover:bg-surface-300 hover:text-ink'}`}>
          {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${value === opt.value ? 'bg-surface/60' : opt.dot}`} />}
          {opt.label}
          {opt.count != null && <span className={`rounded-full px-1.5 text-[10px] font-bold ${value === opt.value ? 'bg-white/20' : 'bg-surface-300'}`}>{opt.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-1.5">{eyebrow}</p>}
          <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
