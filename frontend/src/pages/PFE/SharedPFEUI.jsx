import React, { useState } from 'react';
import { WifiOff, Lock, AlertTriangle, RefreshCcw, Shield, ChevronRight, FileText, BarChart3, Clock, CheckCircle2, Users, Activity, Zap, TrendingUp, X, Loader2, Save } from 'lucide-react';
import request from '../../services/api';

export const getUserDisplayName = (user) => {
  if (!user) return 'Unassigned';
  const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
  return fullName || user.email || 'Unassigned';
};

/* ── EditSubjectModal — shared between Admin & Teacher ──────────────── */
export function EditSubjectModal({ subject, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    titre_ar:       subject?.titre_ar       || '',
    titre_en:       subject?.titre_en       || '',
    description_ar: subject?.description_ar || '',
    description_en: subject?.description_en || '',
    typeProjet:     subject?.typeProjet     || 'application',
    maxGrps:        subject?.maxGrps        || 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!subject) return null;

  const handleSave = async () => {
    setError(null);
    if (!formData.titre_ar?.trim() && !formData.titre_en?.trim()) {
      setError('At least one title (Arabic or English) is required.');
      return;
    }
    setSaving(true);
    try {
      await request(`/api/v1/pfe/sujets/${subject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titre_ar:       formData.titre_ar.trim(),
          titre_en:       formData.titre_en.trim() || null,
          description_ar: formData.description_ar.trim(),
          description_en: formData.description_en.trim() || null,
          typeProjet:     formData.typeProjet,
          maxGrps:        Number(formData.maxGrps) || 1,
        }),
      });
      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-edge"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-edge flex items-center justify-between bg-surface-200/50">
          <div>
            <h3 className="text-lg font-bold text-ink">Edit Subject</h3>
            <p className="text-xs text-ink-tertiary">Subject #{subject.id} · {subject.status}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl hover:bg-surface-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
                Title (Arabic)
              </label>
              <input
                type="text"
                value={formData.titre_ar}
                onChange={(e) => setFormData((p) => ({ ...p, titre_ar: e.target.value }))}
                className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
                Title (English)
              </label>
              <input
                type="text"
                value={formData.titre_en}
                onChange={(e) => setFormData((p) => ({ ...p, titre_en: e.target.value }))}
                className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
                Description (Arabic)
              </label>
              <textarea
                rows={4}
                value={formData.description_ar}
                onChange={(e) => setFormData((p) => ({ ...p, description_ar: e.target.value }))}
                className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
                Description (English)
              </label>
              <textarea
                rows={4}
                value={formData.description_en}
                onChange={(e) => setFormData((p) => ({ ...p, description_en: e.target.value }))}
                className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
                Project Type
              </label>
              <select
                value={formData.typeProjet}
                onChange={(e) => setFormData((p) => ({ ...p, typeProjet: e.target.value }))}
                className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="application">Application</option>
                <option value="recherche">Recherche</option>
                <option value="etude">Étude</option>
                <option value="innovation">Innovation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
                Max Groups
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.maxGrps}
                onChange={(e) => setFormData((p) => ({ ...p, maxGrps: e.target.value }))}
                className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-edge-subtle flex justify-end gap-2 bg-surface-200/30">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-edge bg-surface text-ink hover:bg-surface-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-brand text-surface hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── EditGroupModal — admin only, edits any group at any time ──────────── */
export function EditGroupModal({ group, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    nom_ar: group?.nom_ar || '',
    nom_en: group?.nom_en || '',
    coEncadrantId: group?.coEncadrantId ? String(group.coEncadrantId) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!group) return null;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        nom_ar: formData.nom_ar.trim(),
        nom_en: formData.nom_en.trim(),
      };
      // coEncadrantId: empty string → set to null (clear). Otherwise → number.
      if (formData.coEncadrantId === '') {
        payload.coEncadrantId = null;
      } else if (!Number.isNaN(Number(formData.coEncadrantId))) {
        payload.coEncadrantId = Number(formData.coEncadrantId);
      }

      await request(`/api/v1/pfe/groupes/${group.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-edge"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-edge flex items-center justify-between bg-surface-200/50">
          <div>
            <h3 className="text-lg font-bold text-ink">Edit Group</h3>
            <p className="text-xs text-ink-tertiary">Group #{group.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl hover:bg-surface-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
              Group name (Arabic)
            </label>
            <input
              type="text"
              value={formData.nom_ar}
              onChange={(e) => setFormData((p) => ({ ...p, nom_ar: e.target.value }))}
              className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
              Group name (English)
            </label>
            <input
              type="text"
              value={formData.nom_en}
              onChange={(e) => setFormData((p) => ({ ...p, nom_en: e.target.value }))}
              className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary uppercase mb-1.5">
              Co-supervisor ID <span className="font-normal text-ink-muted normal-case">(leave empty to clear)</span>
            </label>
            <input
              type="number"
              placeholder="Teacher ID, e.g. 12"
              value={formData.coEncadrantId}
              onChange={(e) => setFormData((p) => ({ ...p, coEncadrantId: e.target.value }))}
              className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        <div className="p-4 border-t border-edge-subtle flex justify-end gap-2 bg-surface-200/30">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-edge bg-surface text-ink hover:bg-surface-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-brand text-surface hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

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

/* ── AssignSubjectModal — for assigning subjects directly ──────── */
export function AssignSubjectModal({ group, subjects, onClose, onAssigned }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!group) return null;

  const handleSave = async () => {
    if (!selectedSubjectId) return setError('Please select a subject.');
    setError(null);
    setSaving(true);
    try {
      await request(`/api/v1/pfe/groupes/${group.id}/assign-sujet`, {
        method: 'POST',
        body: JSON.stringify({ sujetId: Number(selectedSubjectId) }),
      });
      if (onAssigned) await onAssigned();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to assign subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setError(null);
    setSaving(true);
    try {
      await request(`/api/v1/pfe/groupes/${group.id}/unassign-sujet`, {
        method: 'POST',
      });
      if (onAssigned) await onAssigned();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to unassign subject.');
    } finally {
      setSaving(false);
    }
  };

  const groupPromoId = group?.sujetFinal?.promoId || group?.groupMembers?.[0]?.etudiant?.promoId;
  const filteredSubjects = (subjects || []).filter((s) => {
    if (s.status !== 'valide') return false;
    if (groupPromoId && s.promoId !== groupPromoId) return false;
    const currentCount = s.groupsPfe?.length || 0;
    if (currentCount >= (s.maxGrps || 1)) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-edge"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-edge flex items-center justify-between bg-surface-200/50">
          <div>
            <h3 className="text-lg font-bold text-ink">Assign Subject</h3>
            <p className="text-xs text-ink-tertiary">Group #{group.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl hover:bg-surface-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          
          {group.sujetFinalId && (
             <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 mb-4">
               <h4 className="text-xs font-semibold uppercase text-brand mb-2">Current Subject</h4>
               <p className="text-sm font-bold text-ink mb-1">{group.sujetFinal?.titre_ar || group.sujetFinal?.titre_en}</p>
               <button onClick={handleUnassign} disabled={saving} className="mt-2 text-xs font-semibold text-danger hover:underline">
                 Unassign Subject
               </button>
             </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-secondary uppercase mb-2">
              Available Subjects ({filteredSubjects.length})
            </label>
            {filteredSubjects.length === 0 ? (
              <div className="p-4 rounded-xl border border-edge bg-surface-200 text-center text-sm text-ink-secondary">
                No available subjects found for this promo.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSubjects.map((s) => (
                  <label key={s.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedSubjectId === String(s.id) ? 'border-brand bg-brand/5' : 'border-edge bg-surface hover:bg-surface-200'}`}>
                    <input type="radio" name="subjectSelect" value={s.id} checked={selectedSubjectId === String(s.id)} onChange={(e) => setSelectedSubjectId(e.target.value)} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-ink leading-tight mb-1">{s.titre_ar || s.titre_en}</p>
                      <p className="text-xs text-ink-tertiary">Teacher: {getUserDisplayName(s.enseignant?.user)}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-edge-subtle flex justify-end gap-2 bg-surface-200/30">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-edge bg-surface text-ink hover:bg-surface-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedSubjectId}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-brand text-surface hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
