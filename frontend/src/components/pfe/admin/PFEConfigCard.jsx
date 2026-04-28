import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { pfeAdminAPI } from '../../../services/pfe';

const SWITCH_BASE = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors';
const SWITCH_KNOB = 'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform';

const buildToast = (type, message) => ({ id: Date.now(), type, message });

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.type === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-xs font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  loading,
  onToggle,
  statusLabel,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-surface px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink-tertiary">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${enabled ? 'text-emerald-600' : 'text-rose-600'}`}>
          {statusLabel}
        </span>
        <button
          type="button"
          onClick={onToggle}
          disabled={loading}
          className={`${SWITCH_BASE} ${enabled ? 'bg-emerald-500' : 'bg-slate-300'} ${loading ? 'opacity-60' : ''}`}
          aria-pressed={enabled}
        >
          <span className={`${SWITCH_KNOB} ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-tertiary" />}
      </div>
    </div>
  );
}

export default function PFEConfigCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ submission: false, visibility: false });
  const [config, setConfig] = useState({ submissionOpen: false, studentVisibilityOpen: true });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const statusText = useMemo(() => ({
    submission: config.submissionOpen ? 'Enabled' : 'Disabled',
    visibility: config.studentVisibilityOpen ? 'Enabled' : 'Disabled',
  }), [config]);

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
    const isSubmission = key === 'submissionOpen';
    setSaving((prev) => ({ ...prev, [isSubmission ? 'submission' : 'visibility']: true }));
    setError('');
    try {
      const next = !config[key];
      if (isSubmission) {
        const res = await pfeAdminAPI.setSubmissionFlag(next);
        setConfig((prev) => ({ ...prev, submissionOpen: Boolean(res?.data?.isSubmissionOpen ?? next) }));
        setToast(buildToast('success', `Subject submission ${next ? 'enabled' : 'disabled'}.`));
      } else {
        const res = await pfeAdminAPI.setStudentVisibilityFlag(next);
        setConfig((prev) => ({ ...prev, studentVisibilityOpen: Boolean(res?.data?.isStudentVisibilityOpen ?? next) }));
        setToast(buildToast('success', `Student visibility ${next ? 'enabled' : 'disabled'}.`));
      }
    } catch (err) {
      setToast(buildToast('error', err?.message || 'Update failed.'));
    } finally {
      setSaving((prev) => ({ ...prev, [isSubmission ? 'submission' : 'visibility']: false }));
    }
  };

  return (
    <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">PFE Configuration</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">Visibility and workflow</h2>
          <p className="text-xs text-ink-tertiary">Instant toggles for PFE access windows.</p>
        </div>
      </div>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading configuration...
        </div>
      ) : (
        <div className="space-y-3">
          <ToggleRow
            label="Enable subject submission"
            description="Teachers can create PFE subjects."
            enabled={config.submissionOpen}
            loading={saving.submission}
            onToggle={() => handleToggle('submissionOpen')}
            statusLabel={statusText.submission}
          />
          <ToggleRow
            label="Enable student visibility"
            description="Students can browse and select subjects."
            enabled={config.studentVisibilityOpen}
            loading={saving.visibility}
            onToggle={() => handleToggle('studentVisibilityOpen')}
            statusLabel={statusText.visibility}
          />
        </div>
      )}
    </section>
  );
}
