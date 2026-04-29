import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Settings2, Users, BookOpen, Scale, Eye } from 'lucide-react';
import { pfeAdminAPI } from '../../../services/pfe';

const SWITCH_BASE = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer';
const SWITCH_KNOB = 'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform';

const buildToast = (type, message) => ({ id: Date.now(), type, message });

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.type === 'error'
    ? 'border-danger/30 bg-danger/5 text-danger'
    : 'border-success/30 bg-success/5 text-success';
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{toast.message}</span>
        <button type="button" onClick={onClose} className="rounded-full px-2 text-xs font-semibold">Close</button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, loading, onToggle, Icon }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-canvas/40 px-5 py-4 transition-colors hover:bg-canvas/70">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg ${enabled ? 'bg-success/10 text-success' : 'bg-ink-tertiary/10 text-ink-tertiary'}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-ink-tertiary mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${enabled ? 'text-success' : 'text-ink-muted'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
        <button
          type="button"
          onClick={onToggle}
          disabled={loading}
          className={`${SWITCH_BASE} ${enabled ? 'bg-success' : 'bg-ink-tertiary/30'} ${loading ? 'opacity-60' : ''}`}
          aria-pressed={enabled}
        >
          <span className={`${SWITCH_KNOB} ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-tertiary" />}
      </div>
    </div>
  );
}

function NumberRow({ label, description, value, onChange, loading, min = 1, max = 20, Icon }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-canvas/40 px-5 py-4 transition-colors hover:bg-canvas/70">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-ink-tertiary mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={loading}
          className="w-20 rounded-xl border border-edge bg-control-bg px-3 py-2 text-center text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-tertiary" />}
      </div>
    </div>
  );
}

export default function PFEConfigCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [config, setConfig] = useState({
    submissionOpen: false,
    studentVisibilityOpen: true,
    maxSubjectsPerTeacher: 3,
    allowStudentSelection: false,
    juryEnabled: true,
  });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await pfeAdminAPI.getConfigSnapshot();
        const data = response?.data || {};
        if (!alive) return;
        setConfig({
          submissionOpen: Boolean(data.submissionOpen),
          studentVisibilityOpen: Boolean(data.studentVisibilityOpen),
          maxSubjectsPerTeacher: Number(data.maxSubjectsPerTeacher) || 3,
          allowStudentSelection: Boolean(data.allowStudentSelection),
          juryEnabled: data.juryEnabled !== false,
        });
      } catch (err) {
        if (!alive) return;
        setError(err?.message || 'Failed to load PFE configuration.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleToggle = async (key) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    setError('');
    try {
      const next = !config[key];
      const res = await pfeAdminAPI.updateConfig({ [key]: next });
      const data = res?.data || {};
      setConfig((prev) => ({ ...prev, ...data }));
      const labels = {
        submissionOpen: 'Subject submission',
        studentVisibilityOpen: 'Student visibility',
        allowStudentSelection: 'Student selection',
        juryEnabled: 'Jury system',
      };
      setToast(buildToast('success', `${labels[key] || key} ${next ? 'enabled' : 'disabled'}.`));
    } catch (err) {
      setToast(buildToast('error', err?.message || 'Update failed.'));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleNumberChange = async (key, value) => {
    const sanitized = Math.max(1, Math.min(20, Math.round(value)));
    setConfig((prev) => ({ ...prev, [key]: sanitized }));
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await pfeAdminAPI.updateConfig({ [key]: sanitized });
      const data = res?.data || {};
      setConfig((prev) => ({ ...prev, ...data }));
      setToast(buildToast('success', `Max subjects per teacher set to ${sanitized}.`));
    } catch (err) {
      setToast(buildToast('error', err?.message || 'Update failed.'));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">PFE Configuration</p>
        <h2 className="mt-2 text-lg font-semibold text-ink">System Settings</h2>
        <p className="text-xs text-ink-tertiary mt-1">
          Control PFE workflows, visibility windows, and feature flags. Changes take effect immediately.
        </p>
      </div>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading configuration...
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Submission & Visibility ──────────────────────── */}
          <div className="pb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Submission & Visibility</p>
          </div>
          <ToggleRow
            Icon={BookOpen}
            label="Enable subject submission"
            description="Teachers can propose new PFE subjects."
            enabled={config.submissionOpen}
            loading={saving.submissionOpen}
            onToggle={() => handleToggle('submissionOpen')}
          />
          <ToggleRow
            Icon={Eye}
            label="Enable student visibility"
            description="Students can browse the list of available subjects."
            enabled={config.studentVisibilityOpen}
            loading={saving.studentVisibilityOpen}
            onToggle={() => handleToggle('studentVisibilityOpen')}
          />
          <ToggleRow
            Icon={Users}
            label="Allow student selection"
            description="Students can select and claim PFE subjects. When disabled, only admin can assign."
            enabled={config.allowStudentSelection}
            loading={saving.allowStudentSelection}
            onToggle={() => handleToggle('allowStudentSelection')}
          />

          {/* ── Limits ──────────────────────────────────────── */}
          <div className="pt-3 pb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Limits & Rules</p>
          </div>
          <NumberRow
            Icon={BookOpen}
            label="Max subjects per teacher"
            description="Maximum number of PFE subjects a teacher may propose per academic year."
            value={config.maxSubjectsPerTeacher}
            onChange={(v) => handleNumberChange('maxSubjectsPerTeacher', v)}
            loading={saving.maxSubjectsPerTeacher}
          />

          {/* ── Features ────────────────────────────────────── */}
          <div className="pt-3 pb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Features</p>
          </div>
          <ToggleRow
            Icon={Scale}
            label="Enable jury system"
            description="Allow jury assignment and defense scheduling."
            enabled={config.juryEnabled}
            loading={saving.juryEnabled}
            onToggle={() => handleToggle('juryEnabled')}
          />
        </div>
      )}
    </section>
  );
}
