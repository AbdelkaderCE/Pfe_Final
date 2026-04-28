/*
  StudentDashboard — read-only home for students.

  Header + alerts + KPIs + profile/promo grid + PFE info + charts.
  No courses, modules, or groupe/section data — those concepts were removed
  from the student-facing role.
*/

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileCard from '../../components/dashboard/student/ProfileCard';
import PromoCard from '../../components/dashboard/student/PromoCard';
import KPICards from '../../components/dashboard/student/KPICards';
import AlertsList from '../../components/dashboard/student/AlertsList';
import DashboardCharts from '../../components/dashboard/student/Charts';
import PfeInfoCard from '../../components/dashboard/student/PfeInfoCard';
import { studentDashboardService } from '../../services/studentDashboard';
import { academicAPI } from '../../services/api';

const MODULE_TYPE_TONE = {
  cours: 'bg-indigo-100 text-indigo-700',
  td: 'bg-emerald-100 text-emerald-700',
  tp: 'bg-amber-100 text-amber-700',
  online: 'bg-sky-100 text-sky-700',
};

function teacherDisplay(enseignant) {
  if (!enseignant) return 'Not assigned';
  const u = enseignant.user;
  if (!u) return `Teacher ${enseignant.id}`;
  return `${u.prenom || ''} ${u.nom || ''}`.trim() || u.email || `Teacher ${enseignant.id}`;
}

function moduleDisplay(mod) {
  if (!mod) return '—';
  const name = mod.nom_ar || mod.nom_en || '';
  return mod.code ? `${mod.code} — ${name}` : name;
}

function MyModulesSection({ items, loading }) {
  // Group by semester so the student sees S1 / S2 cleanly. Items with no
  // recorded semester fall into a separate "Unassigned" bucket so we don't
  // silently drop them.
  const bySemester = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const sem = item.module?.semestre ?? null;
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem).push(item);
    }
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      return Number(a[0]) - Number(b[0]);
    });
  }, [items]);

  return (
    <section className="bg-surface rounded-lg border border-edge shadow-card overflow-hidden">
      <header className="p-6 border-b border-edge">
        <h2 className="text-lg font-bold text-ink">My Modules</h2>
        <p className="text-sm text-ink-tertiary">Modules of your promo for the active academic year, grouped by semester.</p>
      </header>

      {loading ? (
        <div className="p-8 text-center text-sm text-ink-tertiary">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-ink-tertiary">
          No modules assigned yet for your promo. Ask the admin if this looks wrong.
        </div>
      ) : (
        bySemester.map(([sem, rows]) => (
          <div key={`sem-${sem ?? 'none'}`}>
            <div className="bg-edge/10 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {sem !== null ? `Semestre ${sem}` : 'Unassigned semester'}
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-edge/20 text-ink-secondary text-xs">
                <tr>
                  <th className="p-3 border-b border-edge font-medium">Module</th>
                  <th className="p-3 border-b border-edge font-medium">Teacher</th>
                  <th className="p-3 border-b border-edge font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.map((row) => (
                  <tr key={`stu-mod-${row.id}`} className="hover:bg-edge/10 border-b border-edge last:border-b-0">
                    <td className="p-3 font-medium text-ink">{moduleDisplay(row.module)}</td>
                    <td className="p-3 text-ink-secondary">{teacherDisplay(row.enseignant)}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${MODULE_TYPE_TONE[row.type] || 'bg-edge/20 text-ink-secondary'}`}>
                        {String(row.type || '').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </section>
  );
}

const PFE_STATUS_TO_CHART_LABEL = {
  draft: 'Not selected',
  assigned: 'Pending approval',
  finalized: 'Approved',
};

function deriveStats(summary, pfe) {
  if (!summary) return null;

  const complaintsTotal = summary.reclamations ?? 0;
  const complaintsPending = summary.pendingReclamations ?? 0;
  const complaintsTreated = Math.max(0, complaintsTotal - complaintsPending);

  const justificationsTotal = summary.justifications ?? 0;
  const justificationsPending = summary.pendingJustifications ?? 0;
  const justificationsTreated = summary.treatedJustifications ?? 0;

  const disciplineOpen = summary.disciplineOpenCases ?? 0;
  const disciplineClosed = summary.disciplineClosedCases ?? 0;
  
  const hasDiscipline = disciplineOpen > 0 || disciplineClosed > 0;
  const disciplineStatus = hasDiscipline 
    ? (disciplineOpen > 0 ? 'Under Review' : 'Sanctioned')
    : 'Clean';

  const pfeChartLabel = pfe?.hasPfe
    ? PFE_STATUS_TO_CHART_LABEL[pfe.assignmentStatus] || 'Not selected'
    : 'Not selected';

  return {
    kpis: {
      justifications: { 
        total: justificationsTotal, 
        treated: justificationsTreated, 
        pending: justificationsPending 
      },
      complaints: {
        total: complaintsTotal,
        treated: complaintsTreated,
        pending: complaintsPending,
      },
    },
    charts: {
      pfeStatus: pfeChartLabel,
      disciplineStatus: disciplineStatus,
      disciplineCounts: { 
        underReview: disciplineOpen, 
        sanctioned: disciplineClosed 
      },
    },
  };
}

function deriveAlerts(summary) {
  if (!summary) return [];
  const alerts = [];
  const pending = summary.pendingReclamations ?? 0;
  if (pending > 0) {
    alerts.push({
      type: 'warning',
      message: `You have ${pending} pending request${pending === 1 ? '' : 's'} awaiting review.`,
    });
  }
  return alerts;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await studentDashboardService.getOverview();
        if (!cancelled) setData(response?.data || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load your dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Modules visible to the student — server defaults to active year per spec.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setModulesLoading(true);
        const res = await academicAPI.myStudentEnseignements();
        if (!cancelled) setModules(Array.isArray(res?.data) ? res.data : []);
      } catch {
        // Modules section degrades gracefully — surface empty state, not an error.
        if (!cancelled) setModules([]);
      } finally {
        if (!cancelled) setModulesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary ?? null;
  const pfe = data?.pfe ?? null;
  const stats = useMemo(() => deriveStats(summary, pfe), [summary, pfe]);
  const alerts = useMemo(() => deriveAlerts(summary), [summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-edge-strong border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const profile = data?.profile;
  const greetingName = profile?.prenom || user?.prenom || 'Student';

  return (
    <div className="space-y-6">
      <header className="bg-surface rounded-lg border border-edge shadow-card p-6">
        <h1 className="text-xl font-bold text-ink tracking-tight">
          Welcome, {greetingName}
        </h1>
        <p className="mt-2 text-sm text-ink-tertiary">
          Your personal dashboard — read-only overview of your academic profile.
        </p>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <AlertsList alerts={alerts} />

      <KPICards stats={stats} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProfileCard profile={profile} />
        <PromoCard promo={profile?.promo} />
      </section>

      <PfeInfoCard pfe={pfe} />

      <MyModulesSection items={modules} loading={modulesLoading} />

      <section>
        <DashboardCharts stats={stats} />
      </section>
    </div>
  );
}
