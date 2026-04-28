import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Trophy, X, XCircle } from 'lucide-react';
import { affectationAPI } from '../services/api';

const STATUS_META = {
  accepte: {
    label: 'Accepted',
    className: 'bg-success/10 text-success border border-success/30',
    Icon: CheckCircle2,
  },
  refuse: {
    label: 'Refused',
    className: 'bg-danger/10 text-danger border border-danger/30',
    Icon: XCircle,
  },
  en_attente: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning border border-warning/30',
    Icon: Clock,
  },
};

function specialiteLabel(specialite) {
  if (!specialite) return '—';
  return specialite.nom_en || specialite.nom_ar || `Specialite #${specialite.id}`;
}

function campaignLabel(campaign) {
  if (!campaign) return '';
  return campaign.nom_en || campaign.nom_ar || `Campaign #${campaign.id}`;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.en_attente;
  const { Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      <Icon className="h-3 w-3" strokeWidth={2} />
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

export default function StudentSpecialiteChoicePage({ role = 'student' }) {
  const canUseStudentApis = role === 'student';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [campagnes, setCampagnes] = useState([]);
  const [myVoeux, setMyVoeux] = useState([]);
  const [myAffectation, setMyAffectation] = useState(null);

  const [selectedCampagneId, setSelectedCampagneId] = useState('');
  const [rankedChoices, setRankedChoices] = useState([]);

  const selectedCampagne = useMemo(
    () => campagnes.find((c) => String(c.id) === String(selectedCampagneId)),
    [campagnes, selectedCampagneId]
  );

  const campaignSpecialites = useMemo(() => {
    if (!selectedCampagne?.campagneSpecialites) return [];
    return selectedCampagne.campagneSpecialites
      .map((link) => ({
        id: link.specialite?.id ?? link.specialiteId,
        nom_ar: link.specialite?.nom_ar,
        nom_en: link.specialite?.nom_en,
        quota: link.quota,
        placesOccupees: link.placesOccupees,
      }))
      .filter((spec) => Number.isInteger(spec.id));
  }, [selectedCampagne]);

  const availableSpecialites = useMemo(
    () => campaignSpecialites.filter((spec) => !rankedChoices.some((c) => c.id === spec.id)),
    [campaignSpecialites, rankedChoices]
  );

  const loadData = useCallback(async () => {
    if (!canUseStudentApis) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [campaignsRes, voeuxRes, affectationRes] = await Promise.all([
        affectationAPI.listOpenCampaignsForStudent(),
        affectationAPI.getMyVoeux(),
        affectationAPI.getMyAffectation(),
      ]);
      const loaded = Array.isArray(campaignsRes?.data) ? campaignsRes.data : [];
      setCampagnes(loaded);
      setMyVoeux(Array.isArray(voeuxRes?.data) ? voeuxRes.data : []);
      setMyAffectation(affectationRes?.data || null);
      if (loaded.length > 0 && !selectedCampagneId) {
        setSelectedCampagneId(String(loaded[0].id));
      }
    } catch (err) {
      setError(err?.message || 'Failed to load campaign data.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseStudentApis]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedCampagneId) {
      setRankedChoices([]);
      return;
    }
    const existing = myVoeux.filter(
      (v) => String(v.campagneId) === String(selectedCampagneId)
    );
    if (existing.length > 0) {
      const sorted = [...existing].sort((a, b) => a.ordre - b.ordre);
      setRankedChoices(
        sorted
          .map((v) => ({
            id: v.specialite?.id ?? v.specialiteId,
            nom_ar: v.specialite?.nom_ar,
            nom_en: v.specialite?.nom_en,
          }))
          .filter((c) => Number.isInteger(c.id))
      );
    } else {
      setRankedChoices([]);
    }
  }, [selectedCampagneId, myVoeux]);

  const addChoice = (specialite) => {
    if (rankedChoices.some((c) => c.id === specialite.id)) return;
    setRankedChoices((prev) => [...prev, specialite]);
    setSuccess('');
    setError('');
  };

  const removeChoice = (specialiteId) => {
    setRankedChoices((prev) => prev.filter((c) => c.id !== specialiteId));
    setSuccess('');
    setError('');
  };

  const moveChoice = (index, delta) => {
    setRankedChoices((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSuccess('');
    setError('');
  };

  const saveChoices = async () => {
    setSuccess('');
    setError('');

    if (!selectedCampagneId) {
      setError('Please select a campaign first.');
      return;
    }
    if (!rankedChoices.length) {
      setError('Please rank at least one specialite.');
      return;
    }

    setSaving(true);
    try {
      await affectationAPI.submitVoeux({
        campagneId: Number(selectedCampagneId),
        choices: rankedChoices.map((c, idx) => ({
          specialiteId: c.id,
          ordre: idx + 1,
        })),
      });
      setSuccess('Your voeux were saved successfully.');
      await loadData();
    } catch (err) {
      setError(err?.message || 'Failed to submit voeux.');
    } finally {
      setSaving(false);
    }
  };

  if (!canUseStudentApis) {
    return (
      <div className="space-y-4 max-w-5xl min-w-0">
        <h1 className="text-xl font-bold text-ink tracking-tight">Specialty Choice</h1>
        <div className="rounded-lg border border-edge bg-surface p-6 shadow-card">
          <p className="text-sm text-ink-secondary">This page is available for student accounts only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl min-w-0">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Affectation</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Specialty Choice</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            Rank your preferred specialites for an open affectation campaign. Your ranking is used by the algorithm,
            combined with your average, to assign you to a specialite within the available quotas.
          </p>
        </div>
      </section>

      <Banner kind="error" onDismiss={() => setError('')}>
        {error}
      </Banner>
      <Banner kind="success" onDismiss={() => setSuccess('')}>
        {success}
      </Banner>

      {myAffectation ? (
        <section className="rounded-2xl border border-success/30 bg-success/5 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <Trophy className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-success">Your final affectation</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{specialiteLabel(myAffectation.specialite)}</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Campaign: <span className="font-medium text-ink">{campaignLabel(myAffectation.campagne)}</span>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-edge bg-surface p-6 text-sm text-ink-secondary">Loading campaigns…</div>
      ) : campagnes.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-6 text-sm text-ink-secondary">
          No campaign is currently open for your level. You will be notified when one becomes available.
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
            <label className="block text-sm font-medium text-ink-secondary">Active campaign</label>
            <select
              value={selectedCampagneId}
              onChange={(e) => setSelectedCampagneId(e.target.value)}
              className="mt-2 w-full max-w-lg rounded-md border border-edge bg-canvas px-3 py-2.5 text-sm text-ink"
            >
              {campagnes.map((c) => (
                <option key={c.id} value={c.id}>
                  {campaignLabel(c)} ({c.anneeUniversitaire})
                </option>
              ))}
            </select>
            {selectedCampagne ? (
              <p className="mt-2 text-xs text-ink-muted">
                Open from {new Date(selectedCampagne.dateDebut).toLocaleDateString()} to{' '}
                {new Date(selectedCampagne.dateFin).toLocaleDateString()}
              </p>
            ) : null}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Available specialites</h2>
              <p className="mt-1 text-xs text-ink-muted">Click a specialite to append it to your ranked list.</p>

              {availableSpecialites.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-edge bg-canvas/40 p-4 text-sm text-ink-tertiary">
                  {campaignSpecialites.length === 0
                    ? 'This campaign has no linked specialites.'
                    : 'All specialites are already in your ranked list.'}
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {availableSpecialites.map((spec) => (
                    <li key={spec.id}>
                      <button
                        type="button"
                        onClick={() => addChoice(spec)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-edge bg-canvas px-4 py-3 text-left text-sm text-ink transition-colors hover:border-brand/40 hover:bg-brand/5"
                      >
                        <span className="font-medium">{specialiteLabel(spec)}</span>
                        {Number.isInteger(spec.quota) ? (
                          <span className="text-xs text-ink-muted">
                            Quota: {spec.placesOccupees ?? 0}/{spec.quota}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Your ranked choices</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Order matters — 1 is your top preference. Reorder with the arrows, remove with the X.
              </p>

              {rankedChoices.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-edge bg-canvas/40 p-4 text-sm text-ink-tertiary">
                  No choices ranked yet.
                </div>
              ) : (
                <ol className="mt-4 space-y-2">
                  {rankedChoices.map((c, idx) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg border border-edge bg-canvas px-4 py-3 text-sm"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-ink">{specialiteLabel(c)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveChoice(idx, -1)}
                          disabled={idx === 0}
                          className="rounded p-1 text-ink-tertiary transition-colors hover:text-brand disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveChoice(idx, +1)}
                          disabled={idx === rankedChoices.length - 1}
                          className="rounded p-1 text-ink-tertiary transition-colors hover:text-brand disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChoice(c.id)}
                          className="rounded p-1 text-ink-tertiary transition-colors hover:text-danger"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-ink-muted">
                  {rankedChoices.length} / {campaignSpecialites.length} ranked
                </p>
                <button
                  type="button"
                  onClick={saveChoices}
                  disabled={saving || !rankedChoices.length}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-surface disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Submit voeux'}
                </button>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-edge bg-surface p-5 shadow-sm overflow-x-auto">
            <h2 className="text-base font-semibold text-ink">My submitted voeux (all campaigns)</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-edge-subtle">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-tertiary">Campaign</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-tertiary">Specialite</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-ink-tertiary">Order</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-ink-tertiary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {myVoeux.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-ink-tertiary">
                      No voeux submitted yet.
                    </td>
                  </tr>
                ) : (
                  myVoeux.map((v) => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 text-ink">{campaignLabel(v.campagne)}</td>
                      <td className="px-3 py-2 text-ink">{specialiteLabel(v.specialite)}</td>
                      <td className="px-3 py-2 text-center text-ink">{v.ordre}</td>
                      <td className="px-3 py-2 text-center">
                        <StatusBadge status={v.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
