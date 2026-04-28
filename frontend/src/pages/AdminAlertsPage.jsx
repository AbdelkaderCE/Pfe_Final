import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { alertsAPI } from '../services/api';

const inputClassName = 'w-full rounded-md border border-control-border bg-control-bg px-3 py-2.5 text-sm text-ink outline-none transition-all duration-150 placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50';
const selectClassName = inputClassName;
const textAreaClassName = `${inputClassName} min-h-[108px] resize-y`;
const primaryButtonClassName = 'inline-flex items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-hover active:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClassName = 'inline-flex items-center justify-center rounded-md border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-surface-200 active:bg-surface-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'etudiants', label: 'Students' },
  { value: 'enseignants', label: 'Teachers' },
  { value: 'admins', label: 'Admins' },
];

const LEVEL_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const LEVEL_CLASSNAME = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-red-50 text-red-800 border-red-200',
};

const EMPTY_FORM = {
  titre: '',
  message: '',
  audience: 'all',
  level: 'info',
  startsAt: '',
  endsAt: '',
  active: true,
};

function toDateTimeLocalValue(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toApiDate(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function normalizeAlertPayload(form) {
  return {
    titre: form.titre.trim(),
    message: form.message.trim(),
    audience: form.audience,
    level: form.level,
    startsAt: toApiDate(form.startsAt),
    endsAt: toApiDate(form.endsAt),
    active: Boolean(form.active),
  };
}

function validateForm(form) {
  if (!String(form.titre || '').trim()) {
    return 'Title is required.';
  }

  if (!String(form.message || '').trim()) {
    return 'Message is required.';
  }

  const startsAt = toApiDate(form.startsAt);
  const endsAt = toApiDate(form.endsAt);

  if (form.startsAt && !startsAt) {
    return 'Start date is invalid.';
  }

  if (form.endsAt && !endsAt) {
    return 'End date is invalid.';
  }

  if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
    return 'Start date must be earlier than end date.';
  }

  return '';
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString();
}

function audienceLabel(value) {
  const match = AUDIENCE_OPTIONS.find((option) => option.value === value);
  return match?.label || String(value || 'Unknown');
}

function levelLabel(value) {
  const match = LEVEL_OPTIONS.find((option) => option.value === value);
  return match?.label || String(value || 'Unknown');
}

function createdByLabel(alert) {
  const prenom = String(alert?.createdBy?.prenom || '').trim();
  const nom = String(alert?.createdBy?.nom || '').trim();
  const fullName = `${prenom} ${nom}`.trim();
  if (fullName) {
    return fullName;
  }
  return alert?.createdBy?.email || '-';
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rowActionId, setRowActionId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadAlerts = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await alertsAPI.list();
      setAlerts(Array.isArray(response?.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load alerts.');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setError('');
      try {
        const response = await alertsAPI.list();
        if (!cancelled) {
          setAlerts(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Failed to load alerts.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = useMemo(
    () => alerts.filter((alert) => Boolean(alert.active)).length,
    [alerts]
  );

  const clearFeedback = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    clearFeedback();

    const validationError = validateForm(createForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    try {
      await alertsAPI.create(normalizeAlertPayload(createForm));
      setCreateForm(EMPTY_FORM);
      setSuccessMessage('Alert created successfully.');
      await loadAlerts(false);
    } catch (createError) {
      setError(createError.message || 'Failed to create alert.');
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (alert) => {
    clearFeedback();
    setEditingId(alert.id);
    setEditForm({
      titre: alert.titre || '',
      message: alert.message || '',
      audience: alert.audience || 'all',
      level: alert.level || 'info',
      startsAt: toDateTimeLocalValue(alert.startsAt),
      endsAt: toDateTimeLocalValue(alert.endsAt),
      active: Boolean(alert.active),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    clearFeedback();

    const validationError = validateForm(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await alertsAPI.update(editingId, normalizeAlertPayload(editForm));
      setSuccessMessage('Alert updated successfully.');
      handleCancelEdit();
      await loadAlerts(false);
    } catch (saveError) {
      setError(saveError.message || 'Failed to update alert.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (alertId) => {
    clearFeedback();

    const confirmed = window.confirm('Delete this alert? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setRowActionId(alertId);
    try {
      await alertsAPI.remove(alertId);
      if (editingId === alertId) {
        handleCancelEdit();
      }
      setSuccessMessage('Alert deleted successfully.');
      await loadAlerts(false);
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete alert.');
    } finally {
      setRowActionId(null);
    }
  };

  const handleToggleActive = async (alert) => {
    clearFeedback();
    setRowActionId(alert.id);

    try {
      await alertsAPI.update(alert.id, { active: !alert.active });
      setSuccessMessage(alert.active ? 'Alert deactivated.' : 'Alert activated.');
      await loadAlerts(false);
    } catch (toggleError) {
      setError(toggleError.message || 'Failed to update alert status.');
    } finally {
      setRowActionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      <section className="rounded-lg border border-edge bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Administration</p>
            <h1 className="mt-2 text-2xl font-bold text-ink">Alert Center</h1>
            <p className="mt-2 text-sm text-ink-secondary">
              Publish short banner alerts to students, teachers, and admins.
            </p>
          </div>
          <Link to="/admin" className={secondaryButtonClassName}>
            Back to Admin Hub
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-edge bg-canvas px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-tertiary">Total alerts</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{alerts.length}</p>
          </div>
          <div className="rounded-md border border-success/30 bg-success/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-success">Active</p>
            <p className="mt-1 text-2xl font-semibold text-success">{activeCount}</p>
          </div>
          <div className="rounded-md border border-edge bg-canvas px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-tertiary">Inactive</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{Math.max(alerts.length - activeCount, 0)}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-edge-strong bg-danger/5 px-3 py-2.5 text-sm text-danger">{error}</div>
      ) : null}

      {successMessage ? (
        <div className="rounded-md border border-edge-strong bg-success/5 px-3 py-2.5 text-sm text-success">{successMessage}</div>
      ) : null}

      <section className="rounded-lg border border-edge bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold text-ink">Create alert</h2>
        <p className="mt-1 text-sm text-ink-secondary">Alert banners are visible to matching users on dashboard pages.</p>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Title</span>
              <input
                type="text"
                value={createForm.titre}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, titre: event.target.value }))}
                className={inputClassName}
                placeholder="System maintenance"
                disabled={creating || loading}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Audience</span>
              <select
                value={createForm.audience}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, audience: event.target.value }))}
                className={selectClassName}
                disabled={creating || loading}
              >
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Level</span>
              <select
                value={createForm.level}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, level: event.target.value }))}
                className={selectClassName}
                disabled={creating || loading}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Start at (optional)</span>
              <input
                type="datetime-local"
                value={createForm.startsAt}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                className={inputClassName}
                disabled={creating || loading}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">End at (optional)</span>
              <input
                type="datetime-local"
                value={createForm.endsAt}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                className={inputClassName}
                disabled={creating || loading}
              />
            </label>

            <label className="inline-flex items-center gap-2 pt-6 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={createForm.active}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, active: event.target.checked }))}
                className="h-4 w-4 rounded border-control-border text-brand focus:ring-brand/40"
                disabled={creating || loading}
              />
              Alert is active immediately
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Message</span>
            <textarea
              value={createForm.message}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, message: event.target.value }))}
              className={textAreaClassName}
              placeholder="The network may be unstable between 14:00 and 14:30."
              disabled={creating || loading}
            />
          </label>

          <div className="flex items-center justify-end">
            <button type="submit" className={primaryButtonClassName} disabled={creating || loading}>
              {creating ? 'Creating...' : 'Create alert'}
            </button>
          </div>
        </form>
      </section>

      {editingId ? (
        <section className="rounded-lg border border-brand/30 bg-brand/5 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Edit alert #{editingId}</h2>

          <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Title</span>
                <input
                  type="text"
                  value={editForm.titre}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, titre: event.target.value }))}
                  className={inputClassName}
                  disabled={saving}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Audience</span>
                <select
                  value={editForm.audience}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, audience: event.target.value }))}
                  className={selectClassName}
                  disabled={saving}
                >
                  {AUDIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Level</span>
                <select
                  value={editForm.level}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, level: event.target.value }))}
                  className={selectClassName}
                  disabled={saving}
                >
                  {LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Start at (optional)</span>
                <input
                  type="datetime-local"
                  value={editForm.startsAt}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                  className={inputClassName}
                  disabled={saving}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">End at (optional)</span>
                <input
                  type="datetime-local"
                  value={editForm.endsAt}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                  className={inputClassName}
                  disabled={saving}
                />
              </label>

              <label className="inline-flex items-center gap-2 pt-6 text-sm text-ink-secondary">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, active: event.target.checked }))}
                  className="h-4 w-4 rounded border-control-border text-brand focus:ring-brand/40"
                  disabled={saving}
                />
                Alert is active
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Message</span>
              <textarea
                value={editForm.message}
                onChange={(event) => setEditForm((prev) => ({ ...prev, message: event.target.value }))}
                className={textAreaClassName}
                disabled={saving}
              />
            </label>

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={handleCancelEdit} className={secondaryButtonClassName} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={primaryButtonClassName} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-lg border border-edge bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Existing alerts</h2>
            <p className="mt-1 text-sm text-ink-secondary">Newest alerts appear first. Critical alerts are prioritized.</p>
          </div>
          <button type="button" onClick={() => loadAlerts(false)} className={secondaryButtonClassName} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-4 rounded-md border border-edge bg-canvas px-4 py-6 text-sm text-ink-secondary">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="mt-4 rounded-md border border-edge bg-canvas px-4 py-6 text-sm text-ink-secondary">No alerts created yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-edge text-xs uppercase tracking-[0.12em] text-ink-tertiary">
                  <th className="py-2 pe-4">Title</th>
                  <th className="py-2 pe-4">Audience</th>
                  <th className="py-2 pe-4">Level</th>
                  <th className="py-2 pe-4">Window</th>
                  <th className="py-2 pe-4">Status</th>
                  <th className="py-2 pe-4">Created by</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const isBusy = rowActionId === alert.id;
                  const isEditing = editingId === alert.id;
                  return (
                    <tr key={alert.id} className={`border-b border-edge-subtle align-top ${isEditing ? 'bg-brand/5' : ''}`}>
                      <td className="py-3 pe-4">
                        <p className="font-semibold text-ink">{alert.titre}</p>
                        <p className="mt-1 max-w-xl whitespace-pre-wrap text-xs text-ink-secondary">{alert.message}</p>
                      </td>
                      <td className="py-3 pe-4 text-ink-secondary">{audienceLabel(alert.audience)}</td>
                      <td className="py-3 pe-4">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${LEVEL_CLASSNAME[alert.level] || LEVEL_CLASSNAME.info}`}>
                          {levelLabel(alert.level)}
                        </span>
                      </td>
                      <td className="py-3 pe-4 text-xs text-ink-secondary">
                        <p>From: {formatDateTime(alert.startsAt)}</p>
                        <p className="mt-1">To: {formatDateTime(alert.endsAt)}</p>
                      </td>
                      <td className="py-3 pe-4">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${alert.active ? 'border-success/30 bg-success/5 text-success' : 'border-edge bg-canvas text-ink-secondary'}`}>
                          {alert.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pe-4 text-xs text-ink-secondary">
                        <p>{createdByLabel(alert)}</p>
                        <p className="mt-1">{formatDateTime(alert.createdAt)}</p>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(alert)}
                            className={secondaryButtonClassName}
                            disabled={isBusy}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(alert)}
                            className={secondaryButtonClassName}
                            disabled={isBusy}
                          >
                            {isBusy ? 'Saving...' : alert.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(alert.id)}
                            className="inline-flex items-center justify-center rounded-md border border-danger/40 bg-danger/5 px-4 py-2.5 text-sm font-medium text-danger transition-all duration-150 hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isBusy}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}