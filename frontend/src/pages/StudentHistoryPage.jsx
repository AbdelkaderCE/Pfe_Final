/*
  StudentHistoryPage — Student self-view of their activity history.
  Sections: Disciplinary councils, Reclamations, Justifications.
  Data: GET /api/v1/history/student/me
*/

import React, { useEffect, useMemo, useState } from 'react';
import request from '../services/api';

const TABS = [
  { id: 'disciplinary', label: 'Disciplinary councils' },
  { id: 'reclamations', label: 'Reclamations' },
  { id: 'justifications', label: 'Justifications' },
];

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-ink-tertiary/10 text-ink-tertiary border border-edge-subtle',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger:  'bg-danger/10 text-danger border border-danger/20',
    info:    'bg-brand/10 text-brand border border-brand/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tones[tone] || tones.neutral}`}>
      {children}
    </span>
  );
}

function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (['traitee', 'valide', 'approved', 'resolved'].includes(s)) return 'success';
  if (['refusee', 'refuse', 'rejected'].includes(s)) return 'danger';
  if (['en_cours', 'en_verification', 'en_instruction', 'jugement', 'pending'].includes(s)) return 'warning';
  return 'info';
}

export default function StudentHistoryPage({ endpoint = '/api/v1/history/student/me' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('disciplinary');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await request(endpoint);
        if (!cancelled) setData(res?.data || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const counts = useMemo(() => ({
    disciplinary: data?.disciplinaryCouncils?.length || 0,
    reclamations: data?.reclamations?.length || 0,
    justifications: data?.justifications?.length || 0,
  }), [data]);

  if (loading) {
    return <div className="p-6 text-sm text-ink-tertiary">Loading history…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-danger">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">My History</h1>
        <p className="text-sm text-ink-tertiary mt-1">
          {data?.user?.prenom} {data?.user?.nom}
          {data?.user?.matricule ? ` · ${data.user.matricule}` : ''}
        </p>
      </header>

      <nav className="flex gap-2 border-b border-edge">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-all duration-200 ${
              tab === t.id
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-tertiary hover:text-ink'
            }`}
          >
            {t.label} <span className="ml-1 text-[10px] font-bold opacity-60">({counts[t.id]})</span>
          </button>
        ))}
      </nav>

      <section>
        {tab === 'disciplinary' && (
          <DisciplinaryList items={data?.disciplinaryCouncils || []} />
        )}
        {tab === 'reclamations' && <ReclamationsList items={data?.reclamations || []} />}
        {tab === 'justifications' && <JustificationsList items={data?.justifications || []} />}
      </section>
    </div>
  );
}

function EmptyRow({ label }) {
  return <div className="text-sm text-ink-tertiary italic py-6">No {label} yet.</div>;
}

function DisciplinaryList({ items }) {
  if (!items.length) return <EmptyRow label="disciplinary cases" />;
  return (
    <ul className="divide-y divide-edge-subtle rounded-lg border border-edge bg-surface">
      {items.map((d) => (
        <li key={d.id} className="p-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ink">
                {d.infraction?.nom_en || d.infraction?.nom_ar || 'Infraction'}
              </p>
              <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              {d.infraction?.gravite && (
                <Badge tone="neutral">severity: {d.infraction.gravite}</Badge>
              )}
            </div>
            <p className="text-xs text-ink-tertiary mt-1">
              Reported: {formatDate(d.dateSignal)}
              {d.reportedBy?.name ? ` · by ${d.reportedBy.name}` : ''}
            </p>
            {d.decision && (
              <p className="text-xs text-ink-tertiary">
                Decision: {d.decision.nom_en || d.decision.nom_ar}
                {d.decision.niveauSanction ? ` (${d.decision.niveauSanction})` : ''}
                {d.dateDecision ? ` · ${formatDate(d.dateDecision)}` : ''}
              </p>
            )}
          </div>
          {d.conseil && (
            <div className="text-right text-xs text-ink-tertiary">
              Council: {formatDate(d.conseil.dateReunion)}
              <br />
              {d.conseil.lieu || ''}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ReclamationsList({ items }) {
  if (!items.length) return <EmptyRow label="reclamations" />;
  return (
    <ul className="divide-y divide-edge-subtle rounded-lg border border-edge bg-surface">
      {items.map((r) => (
        <li key={r.id} className="p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">
              {r.objet_en || r.objet_ar || 'Reclamation'}
            </p>
            <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            {r.type && (
              <Badge tone="info">{r.type.nom_en || r.type.nom_ar}</Badge>
            )}
          </div>
          <p className="text-xs text-ink-tertiary mt-1">Submitted: {formatDate(r.createdAt)}</p>
          <p className="text-sm text-ink-secondary mt-2 line-clamp-3">
            {r.description_en || r.description_ar || ''}
          </p>
        </li>
      ))}
    </ul>
  );
}

function JustificationsList({ items }) {
  if (!items.length) return <EmptyRow label="justifications" />;
  return (
    <ul className="divide-y divide-edge-subtle rounded-lg border border-edge bg-surface">
      {items.map((j) => (
        <li key={j.id} className="p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">
              {j.motif_en || j.motif_ar || 'Absence'}
            </p>
            <Badge tone={statusTone(j.status)}>{j.status}</Badge>
            {j.type && <Badge tone="info">{j.type.nom_en || j.type.nom_ar}</Badge>}
          </div>
          <p className="text-xs text-ink-tertiary mt-1">
            Absence date: {formatDate(j.dateAbsence)} · Submitted: {formatDate(j.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
