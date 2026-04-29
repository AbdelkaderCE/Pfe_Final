import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Unlock,
  Users,
  Download,
  X,
  XCircle,
} from 'lucide-react';
import { affectationAPI, authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const NIVEAUX_SOURCE = ['L1', 'L2', 'L3', 'M1', 'M2'];
const NIVEAUX_CIBLE = ['L2', 'L3', 'M1', 'M2', 'D1'];

const STATUS_META = {
  brouillon: { label: 'Draft', className: 'bg-ink-tertiary/10 text-ink-tertiary border border-ink-tertiary/30' },
  ouverte: { label: 'Open', className: 'bg-success/10 text-success border border-success/30' },
  fermee: { label: 'Closed', className: 'bg-warning/10 text-warning border border-warning/30' },
  terminee: { label: 'Completed', className: 'bg-brand/10 text-brand border border-brand/30' },
};

const VOEU_STATUS_META = {
  accepte: { label: 'Accepted', Icon: CheckCircle2, className: 'text-success' },
  refuse: { label: 'Refused', Icon: XCircle, className: 'text-danger' },
  en_attente: { label: 'Pending', Icon: Clock, className: 'text-warning' },
};

const inputClass =
  'w-full rounded-md border border-control-border bg-control-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30';

function specialiteLabel(specialite) {
  if (!specialite) return '—';
  return specialite.nom_en || specialite.nom_ar || `Specialite #${specialite.id}`;
}

function campaignLabel(c) {
  if (!c) return '—';
  return c.nom_en || c.nom_ar || `Campaign #${c.id}`;
}

function hasAdminRole(roles) {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => String(r || '').toLowerCase() === 'admin');
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.brouillon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function VoeuStatusIcon({ status }) {
  const meta = VOEU_STATUS_META[status] || VOEU_STATUS_META.en_attente;
  const { Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {meta.label}
    </span>
  );
}

function Banner({ kind, children, onDismiss }) {
  if (!children) return null;
  const palette =
    kind === 'error'
      ? 'border-danger/30 bg-danger/5 text-danger'
      : kind === 'success'
      ? 'border-success/30 bg-success/5 text-success'
      : 'border-warning/30 bg-warning/5 text-warning';
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${palette}`}>
      <div>{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-current opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

function StatCard({ Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-edge bg-canvas/40 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-tertiary">
        <Icon className={`h-4 w-4 ${accent || 'text-brand'}`} strokeWidth={2} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function CampaignList({ campaigns, loading, selectedId, onSelect, onRefresh }) {
  return (
    <aside className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Campaigns</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded p-1.5 text-ink-tertiary transition-colors hover:bg-brand/5 hover:text-brand disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {loading && campaigns.length === 0 ? (
          <li className="rounded-lg border border-edge bg-canvas/40 p-3 text-xs text-ink-tertiary">Loading…</li>
        ) : campaigns.length === 0 ? (
          <li className="rounded-lg border border-dashed border-edge bg-canvas/40 p-3 text-xs text-ink-tertiary">
            No campaigns yet. Create one below.
          </li>
        ) : (
          campaigns.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-start justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  Number(selectedId) === Number(c.id)
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-edge bg-canvas hover:border-brand/40 hover:bg-brand/5'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{campaignLabel(c)}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {c.anneeUniversitaire} · {c.niveauSource}→{c.niveauCible}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 pt-0.5">
                  <StatusBadge status={c.status} />
                  <ChevronRight className="h-4 w-4 text-ink-tertiary rtl:rotate-180" strokeWidth={2} />
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

function CreateCampaignForm({ onCreated, onError }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom_ar: '',
    nom_en: '',
    anneeUniversitaire: '',
    dateDebut: '',
    dateFin: '',
    niveauSource: 'L3',
    niveauCible: 'M1',
  });

  const reset = () => {
    setForm({
      nom_ar: '',
      nom_en: '',
      anneeUniversitaire: '',
      dateDebut: '',
      dateFin: '',
      niveauSource: 'L3',
      niveauCible: 'M1',
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nom_ar: form.nom_ar.trim(),
        nom_en: form.nom_en.trim() || null,
        anneeUniversitaire: form.anneeUniversitaire.trim(),
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        niveauSource: form.niveauSource,
        niveauCible: form.niveauCible,
      };
      const res = await affectationAPI.createCampaign(payload);
      const createdId = res?.data?.id;
      reset();
      setExpanded(false);
      onCreated?.(createdId);
    } catch (err) {
      onError?.(err?.message || 'Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-ink"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4 text-brand" strokeWidth={2} />
          New campaign
        </span>
        <span className="text-xs text-ink-tertiary">{expanded ? 'Hide' : 'Expand'}</span>
      </button>

      {expanded ? (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-secondary">Name (AR)</span>
            <input
              className={inputClass}
              required
              value={form.nom_ar}
              onChange={(e) => setForm((prev) => ({ ...prev, nom_ar: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-secondary">Name (EN)</span>
            <input
              className={inputClass}
              value={form.nom_en}
              onChange={(e) => setForm((prev) => ({ ...prev, nom_en: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-secondary">Academic year</span>
            <input
              className={inputClass}
              placeholder="2025-2026"
              required
              value={form.anneeUniversitaire}
              onChange={(e) => setForm((prev) => ({ ...prev, anneeUniversitaire: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-secondary">From</span>
              <select
                className={inputClass}
                value={form.niveauSource}
                onChange={(e) => setForm((prev) => ({ ...prev, niveauSource: e.target.value }))}
              >
                {NIVEAUX_SOURCE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-ink-secondary">To</span>
              <select
                className={inputClass}
                value={form.niveauCible}
                onChange={(e) => setForm((prev) => ({ ...prev, niveauCible: e.target.value }))}
              >
                {NIVEAUX_CIBLE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-secondary">Start date</span>
            <input
              className={inputClass}
              type="date"
              required
              value={form.dateDebut}
              onChange={(e) => setForm((prev) => ({ ...prev, dateDebut: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-ink-secondary">End date</span>
            <input
              className={inputClass}
              type="date"
              required
              value={form.dateFin}
              onChange={(e) => setForm((prev) => ({ ...prev, dateFin: e.target.value }))}
            />
          </label>

          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setExpanded(false);
              }}
              className="rounded-md border border-edge bg-canvas px-4 py-2 text-sm text-ink-secondary hover:bg-brand/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-surface disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create campaign'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function LinkSpecialiteForm({ campaignId, existingSpecialiteIds, allSpecialites, onLinked, onError, disabled }) {
  const [specialiteId, setSpecialiteId] = useState('');
  const [quota, setQuota] = useState('');
  const [saving, setSaving] = useState(false);

  const available = useMemo(
    () => allSpecialites.filter((s) => !existingSpecialiteIds.includes(Number(s.id))),
    [allSpecialites, existingSpecialiteIds]
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!specialiteId) return;
    setSaving(true);
    try {
      await affectationAPI.linkSpecialite(campaignId, {
        specialiteId: Number(specialiteId),
        quota: quota === '' ? null : Number(quota),
      });
      setSpecialiteId('');
      setQuota('');
      onLinked?.();
    } catch (err) {
      onError?.(err?.message || 'Failed to link specialite.');
    } finally {
      setSaving(false);
    }
  };

  if (disabled) return null;

  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
      <select
        className={inputClass}
        value={specialiteId}
        onChange={(e) => setSpecialiteId(e.target.value)}
      >
        <option value="">Select specialite…</option>
        {available.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nom_en || s.nom_ar || `#${s.id}`}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        type="number"
        min="0"
        placeholder="Quota"
        value={quota}
        onChange={(e) => setQuota(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving || !specialiteId}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-surface disabled:opacity-60"
      >
        {saving ? 'Linking…' : 'Link'}
      </button>
    </form>
  );
}

function LinkedSpecialitesTable({ campaign, onUpdateQuota, onUnlink, disabled }) {
  const links = campaign?.campagneSpecialites || [];
  if (!links.length) {
    return (
      <div className="rounded-lg border border-dashed border-edge bg-canvas/40 p-4 text-sm text-ink-tertiary">
        No specialites linked yet. Add at least one before opening the campaign.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-edge">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge-subtle bg-canvas/40">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Specialite</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Quota</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Occupied</th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge-subtle">
          {links.map((link) => (
            <LinkedSpecialiteRow
              key={link.id}
              link={link}
              onUpdateQuota={onUpdateQuota}
              onUnlink={onUnlink}
              disabled={disabled}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinkedSpecialiteRow({ link, onUpdateQuota, onUnlink, disabled }) {
  const [quotaDraft, setQuotaDraft] = useState(link.quota ?? '');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setQuotaDraft(link.quota ?? '');
  }, [link.quota]);

  const dirty = String(quotaDraft) !== String(link.quota ?? '');

  const save = async () => {
    setSaving(true);
    try {
      await onUpdateQuota(link.id, quotaDraft === '' ? null : Number(quotaDraft));
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td className="px-3 py-2 text-ink">{specialiteLabel(link.specialite)}</td>
      <td className="px-3 py-2 text-center">
        <input
          type="number"
          min="0"
          value={quotaDraft}
          onChange={(e) => setQuotaDraft(e.target.value)}
          disabled={disabled}
          className="w-20 rounded-md border border-edge bg-control-bg px-2 py-1 text-center text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
          placeholder="∞"
        />
      </td>
      <td className="px-3 py-2 text-center text-ink-secondary">{link.placesOccupees ?? 0}</td>
      <td className="px-3 py-2 text-right">
        {dirty ? (
          <button
            type="button"
            onClick={save}
            disabled={saving || disabled}
            className="mr-1 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-surface disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => onUnlink(link.id)}
              disabled={disabled}
              className="rounded-md bg-danger px-2.5 py-1 text-xs font-semibold text-surface disabled:opacity-60"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="ml-1 rounded-md border border-edge bg-canvas px-2.5 py-1 text-xs text-ink-secondary"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={disabled}
            className="rounded-md border border-edge bg-canvas px-2.5 py-1 text-xs text-ink-tertiary hover:text-danger disabled:opacity-60"
            aria-label="Unlink"
          >
            <Trash2 className="inline h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </td>
    </tr>
  );
}

function ResultsTable({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-edge bg-canvas/40 p-4 text-sm text-ink-tertiary">
        Results are published once the algorithm has been run and the campaign is closed.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-edge">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge-subtle bg-canvas/40">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Student</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Email</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Average</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Specialite</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Ordre</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge-subtle">
          {results.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 text-ink">
                {row.etudiant?.user?.prenom} {row.etudiant?.user?.nom}
              </td>
              <td className="px-3 py-2 text-ink-secondary">{row.etudiant?.user?.email || '—'}</td>
              <td className="px-3 py-2 text-center text-ink font-semibold">{row.etudiant?.moyenne || '—'}</td>
              <td className="px-3 py-2 text-ink">{specialiteLabel(row.specialite)}</td>
              <td className="px-3 py-2 text-center text-ink">{row.ordre}</td>
              <td className="px-3 py-2 text-center">
                <VoeuStatusIcon status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportAveragesModal({ isOpen, onClose, onImported }) {
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!csv.trim()) {
      setError('Please paste CSV data first.');
      return;
    }
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await affectationAPI.importAverages({ csv });
      setResults(res?.data);
      if (res?.data?.successCount > 0) {
        onImported();
      }
    } catch (err) {
      setError(err?.message || 'Failed to import averages.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-edge bg-surface p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink">Import Student Averages</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-canvas/80 text-ink-tertiary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!results ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-secondary">
              Paste CSV data with columns: <code className="bg-canvas px-1.5 py-0.5 rounded text-brand">email,average</code>
            </p>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="student@univ.dz,14.50&#10;another@univ.dz,12.75"
              className="h-64 w-full rounded-xl border border-edge bg-canvas/40 p-4 text-sm font-mono text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            {error && <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</div>}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-edge px-5 py-2 text-sm font-medium text-ink hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2 text-sm font-bold text-surface transition-all hover:bg-brand-hover disabled:opacity-60"
              >
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                {loading ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-2xl bg-canvas p-4">
                <p className="text-xs font-semibold text-ink-tertiary uppercase">Total</p>
                <p className="text-2xl font-bold text-ink">{results.total}</p>
              </div>
              <div className="rounded-2xl bg-success/10 p-4">
                <p className="text-xs font-semibold text-success uppercase">Success</p>
                <p className="text-2xl font-bold text-success">{results.successCount}</p>
              </div>
              <div className="rounded-2xl bg-danger/10 p-4">
                <p className="text-xs font-semibold text-danger uppercase">Failed</p>
                <p className="text-2xl font-bold text-danger">{results.errorCount}</p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-edge bg-canvas/20">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-canvas/80 backdrop-blur-sm">
                  <tr className="border-b border-edge">
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-subtle">
                  {results.results.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-ink-secondary">{r.email || `Row ${r.row}`}</td>
                      <td className="px-3 py-2">
                        {r.status === 'success' ? (
                          <span className="text-success font-medium">✓ Success ({r.updatedAverage})</span>
                        ) : (
                          <span className="text-danger">{r.message}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl bg-ink px-6 py-2 text-sm font-bold text-surface hover:bg-ink/90"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAffectationPage() {
  const { user, loading: authLoading } = useAuth();
  const canAccess = hasAdminRole(user?.roles);

  const [campaigns, setCampaigns] = useState([]);
  const [allSpecialites, setAllSpecialites] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);

  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExportPdf = async () => {
    if (!selectedId) return;
    setBusyAction('export-pdf');
    try {
      const url = affectationAPI.exportCampaignResultsPdf(selectedId);
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('pfe_access_token') || ''}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`Export failed: ${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `affectation-results-${selectedId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setSuccess('PDF exported successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to export PDF.');
    } finally {
      setBusyAction(null);
    }
  };

  const selectCampaign = useCallback((id) => {
    setSelectedId(id);
    setDeleteConfirming(false);
  }, []);

  const loadList = useCallback(
    async ({ autoSelect = false } = {}) => {
      setListLoading(true);
      setError('');
      try {
        const res = await affectationAPI.listCampaigns();
        const loaded = Array.isArray(res?.data) ? res.data : [];
        setCampaigns(loaded);
        if (autoSelect && loaded.length > 0) {
          setSelectedId((prev) => prev ?? loaded[0].id);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load campaigns.');
      } finally {
        setListLoading(false);
      }
    },
    []
  );

  const loadSpecialites = useCallback(async () => {
    try {
      const res = await authAPI.adminGetAcademicOptions();
      const payload = res?.data || {};
      setAllSpecialites(Array.isArray(payload.specialites) ? payload.specialites : []);
    } catch (err) {
      setError(err?.message || 'Failed to load specialites.');
    }
  }, []);

  const loadDetail = useCallback(
    async (id) => {
      if (!id) {
        setSelectedCampaign(null);
        setStats(null);
        setResults([]);
        return;
      }
      setDetailLoading(true);
      try {
        const campaignRes = await affectationAPI.getCampaign(id);
        const campaign = campaignRes?.data;
        setSelectedCampaign(campaign || null);

        const statsRes = await affectationAPI.getCampaignStats(id).catch(() => null);
        setStats(statsRes?.data || null);

        if (campaign && ['fermee', 'terminee'].includes(campaign.status)) {
          const resultsRes = await affectationAPI.getCampaignResults(id).catch(() => null);
          setResults(Array.isArray(resultsRes?.data) ? resultsRes.data : []);
        } else {
          setResults([]);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load campaign detail.');
        setSelectedCampaign(null);
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!canAccess) return;
    loadList({ autoSelect: true });
    loadSpecialites();
  }, [canAccess, loadList, loadSpecialites]);

  useEffect(() => {
    if (!canAccess || !selectedId) {
      setSelectedCampaign(null);
      return;
    }
    loadDetail(selectedId);
  }, [canAccess, selectedId, loadDetail]);

  const refreshAll = useCallback(async () => {
    await loadList();
    if (selectedId) await loadDetail(selectedId);
  }, [loadList, loadDetail, selectedId]);

  const handleCreated = useCallback(
    async (newId) => {
      setSuccess('Campaign created in draft mode.');
      await loadList();
      if (newId) setSelectedId(newId);
    },
    [loadList]
  );

  const runAction = async (key, promise, okMessage) => {
    setBusyAction(key);
    setError('');
    setSuccess('');
    try {
      await promise;
      if (okMessage) setSuccess(okMessage);
      await refreshAll();
    } catch (err) {
      setError(err?.message || 'Action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpen = () =>
    runAction('open', affectationAPI.openCampaign(selectedId), 'Campaign opened and students were notified.');
  const handleClose = () =>
    runAction('close', affectationAPI.closeCampaign(selectedId), 'Campaign closed.');
  const handleDelete = () =>
    runAction('delete', affectationAPI.deleteCampaign(selectedId), 'Campaign deleted.').then(() => {
      setSelectedId(null);
    });
  const handleLinked = () => {
    setSuccess('Specialite linked.');
    loadDetail(selectedId);
  };
  const handleUpdateQuota = async (linkId, quota) => {
    try {
      await affectationAPI.updateSpecialiteQuota(linkId, quota);
      setSuccess('Quota updated.');
      await loadDetail(selectedId);
    } catch (err) {
      setError(err?.message || 'Failed to update quota.');
    }
  };
  const handleUnlink = async (linkId) => {
    try {
      await affectationAPI.unlinkSpecialite(linkId);
      setSuccess('Specialite unlinked.');
      await loadDetail(selectedId);
    } catch (err) {
      setError(err?.message || 'Failed to unlink specialite.');
    }
  };
  const handleRun = async () => {
    setRunning(true);
    setError('');
    setSuccess('');
    try {
      const res = await affectationAPI.runAlgorithm(selectedId);
      const data = res?.data;
      const summary = data
        ? `Algorithm done — ${data.totalAffected}/${data.totalStudents} students affected.`
        : 'Algorithm finished.';
      setSuccess(summary);
      await refreshAll();
    } catch (err) {
      setError(err?.message || 'Algorithm failed.');
    } finally {
      setRunning(false);
    }
  };

  if (authLoading) {
    return <div className="rounded-2xl border border-edge bg-surface p-6">Loading…</div>;
  }
  if (!canAccess) {
    return <div className="rounded-2xl border border-edge-strong bg-danger/10 p-6 text-danger">Restricted area.</div>;
  }

  const canMutate =
    selectedCampaign && ['brouillon', 'ouverte', 'fermee'].includes(selectedCampaign.status);
  const canEditLinks =
    selectedCampaign && ['brouillon', 'fermee'].includes(selectedCampaign.status);
  const canOpen = selectedCampaign?.status === 'brouillon';
  const canClose = selectedCampaign?.status === 'ouverte';
  const canRun =
    selectedCampaign && ['fermee', 'ouverte'].includes(selectedCampaign.status);
  const canDelete = selectedCampaign?.status === 'brouillon';

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Affectation</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
              Create campaigns, set specialite quotas, collect student voeux, and run the affectation algorithm.
              Students are notified automatically when a campaign opens and when results are published.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={listLoading || detailLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${listLoading || detailLoading ? 'animate-spin' : ''}`}
              strokeWidth={2}
            />
            Refresh
          </button>
        </div>
      </section>

      <Banner kind="error" onDismiss={() => setError('')}>
        {error}
      </Banner>
      <Banner kind="success" onDismiss={() => setSuccess('')}>
        {success}
      </Banner>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <CampaignList
            campaigns={campaigns}
            loading={listLoading}
            selectedId={selectedId}
            onSelect={selectCampaign}
            onRefresh={refreshAll}
          />
          <CreateCampaignForm
            onCreated={handleCreated}
            onError={(msg) => setError(msg)}
          />
        </div>

        <div className="space-y-4">
          {!selectedId || !selectedCampaign ? (
            <div className="rounded-2xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-tertiary">
              Select a campaign in the left column or create a new one to get started.
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-ink">{campaignLabel(selectedCampaign)}</h2>
                      <StatusBadge status={selectedCampaign.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {selectedCampaign.anneeUniversitaire} · {selectedCampaign.niveauSource} → {selectedCampaign.niveauCible}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      <Calendar className="mr-1 inline h-3.5 w-3.5" strokeWidth={2} />
                      {new Date(selectedCampaign.dateDebut).toLocaleDateString()} →{' '}
                      {new Date(selectedCampaign.dateFin).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canOpen ? (
                      <button
                        type="button"
                        onClick={handleOpen}
                        disabled={busyAction !== null}
                        className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-60"
                      >
                        <Unlock className="h-4 w-4" strokeWidth={2} />
                        {busyAction === 'open' ? 'Opening…' : 'Open'}
                      </button>
                    ) : null}
                    {canClose ? (
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={busyAction !== null}
                        className="inline-flex items-center gap-1.5 rounded-md bg-warning px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-60"
                      >
                        {busyAction === 'close' ? 'Closing…' : 'Close'}
                      </button>
                    ) : null}
                    {canRun ? (
                      <button
                        type="button"
                        onClick={handleRun}
                        disabled={running || busyAction !== null}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-60"
                      >
                        <Play className="h-4 w-4" strokeWidth={2} />
                        {running ? 'Running…' : 'Run algorithm'}
                      </button>
                    ) : null}
                    {canDelete ? (
                      deleteConfirming ? (
                        <>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={busyAction !== null}
                            className="inline-flex items-center gap-1.5 rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-60"
                          >
                            <AlertCircle className="h-4 w-4" strokeWidth={2} />
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirming(false)}
                            className="rounded-md border border-edge bg-canvas px-3 py-1.5 text-sm text-ink-secondary hover:bg-brand/5"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirming(true)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-ink-tertiary hover:border-danger/40 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                          Delete
                        </button>
                      )
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    Icon={Users}
                    label="Students with voeux"
                    value={stats?.studentsWithVoeux ?? '—'}
                    accent="text-brand"
                  />
                  <StatCard
                    Icon={Layers}
                    label="Total voeux"
                    value={stats?.total ?? '—'}
                    accent="text-brand"
                  />
                  <StatCard
                    Icon={CheckCircle2}
                    label="Accepted"
                    value={stats?.accepted ?? '—'}
                    accent="text-success"
                  />
                  <StatCard
                    Icon={Activity}
                    label="Pending"
                    value={stats?.pending ?? '—'}
                    accent="text-warning"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-ink">Linked specialites & quotas</h3>
                  {!canEditLinks && selectedCampaign.status !== 'ouverte' ? (
                    <span className="text-xs text-ink-tertiary">Locked — campaign is completed</span>
                  ) : null}
                  {selectedCampaign.status === 'ouverte' ? (
                    <span className="text-xs text-ink-tertiary">Campaign is open — close it to change specialites</span>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3">
                  <LinkSpecialiteForm
                    campaignId={selectedId}
                    existingSpecialiteIds={(selectedCampaign.campagneSpecialites || []).map((link) =>
                      Number(link.specialite?.id ?? link.specialiteId)
                    )}
                    allSpecialites={allSpecialites}
                    onLinked={handleLinked}
                    onError={(msg) => setError(msg)}
                    disabled={!canEditLinks}
                  />
                  <LinkedSpecialitesTable
                    campaign={selectedCampaign}
                    onUpdateQuota={handleUpdateQuota}
                    onUnlink={handleUnlink}
                    disabled={!canMutate || selectedCampaign.status === 'ouverte'}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-ink">Results</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={!results || results.length === 0 || busyAction === 'export-pdf'}
                      className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:border-brand/40 hover:text-brand transition-all disabled:opacity-50"
                    >
                      {busyAction === 'export-pdf' ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      {busyAction === 'export-pdf' ? 'Exporting...' : 'Export PDF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:border-brand/40 hover:text-brand transition-all"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Import Averages
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-tertiary">
                  The algorithm assigns each student to their highest-ordre specialite that still has quota,
                  ranking students by moyenne DESC. Run it after the voeux window closes.
                </p>
                <div className="mt-4">
                  <ResultsTable results={results} />
                </div>
                <ImportAveragesModal
                  isOpen={showImportModal}
                  onClose={() => setShowImportModal(false)}
                  onImported={() => {
                    if (selectedId) loadDetail(selectedId);
                  }}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
