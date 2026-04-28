import React, { useState } from 'react';
import { BookOpen, Users, CalendarDays, Plus, XCircle, Loader2, Pencil } from 'lucide-react';
import {
  SectionHeader,
  Shimmer,
  EmptyState,
  ErrorBanner,
  CapacityBar,
  StatusBadge,
  getUserDisplayName,
  LeftNav,
  PageHeader,
  SUBJECT_STATUS,
  normalizeApiError
} from './SharedPFEUI';
import request from '../../services/api';

const TEACHER_TABS = [
  { id: 'subjects', label: 'My Subjects', Icon: BookOpen, hint: 'Your proposals' },
  { id: 'groups', label: 'Groups', Icon: Users, hint: 'Groups on your topics' },
  { id: 'defense', label: 'Defense Plan', Icon: CalendarDays, hint: 'Defense schedule' },
];

function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
           <Shimmer className="h-5 w-3/4 mb-3" />
           <Shimmer className="h-4 w-full mb-3" />
           <Shimmer className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function TeacherSubjectsView({ subjects, loading, error, onRefresh, teacherProfileId, onRetry }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre_ar: '', titre_en: '', description_ar: '', description_en: '', typeProjet: 'application', maxGrps: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ── Submission lock state ───────────────────────────────────
  const [submissionOpen, setSubmissionOpen] = useState(null); // null = loading
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await request('/api/v1/pfe/admin/config/submission');
        if (!cancelled) setSubmissionOpen(res?.data?.isSubmissionOpen ?? true);
      } catch {
        // If the endpoint fails (e.g. not deployed yet), default to open
        if (!cancelled) setSubmissionOpen(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const canCreate = teacherProfileId && submissionOpen !== false;

  const resetForm = () => {
    setFormData({ titre_ar: '', titre_en: '', description_ar: '', description_en: '', typeProjet: 'application', maxGrps: 1 });
    setSubmitError(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!teacherProfileId) {
      setSubmitError({ kind: 'client', message: 'Teacher profile missing. Please re-login.' });
      return;
    }
    setSubmitting(true);
    try {
      await request('/api/v1/pfe/sujets', {
        method: 'POST',
        body: JSON.stringify({ ...formData, enseignantId: Number(teacherProfileId) }),
      });
      resetForm();
      onRefresh();
    } catch (err) {
      setSubmitError(normalizeApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const list = Array.isArray(subjects) ? subjects : [];

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Research Topics"
        title="My Subjects"
        subtitle={`${list.length} proposal${list.length !== 1 ? 's' : ''} submitted`}
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            disabled={!canCreate}
            title={submissionOpen === false ? 'Submission is currently closed by administration' : undefined}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-surface shadow-sm transition-all hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> New Subject
          </button>
        }
      />

      {/* Submission closed notice */}
      {submissionOpen === false && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <XCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="font-semibold text-warning">Submission is currently closed</p>
            <p className="text-ink-secondary text-xs mt-0.5">Subject submission has been disabled by the administration. You cannot create new proposals at this time.</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-edge bg-surface p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Propose New Subject</h3>
            <button type="button" onClick={resetForm} className="text-ink-muted hover:text-ink transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {submitError && <ErrorBanner error={submitError} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-secondary uppercase">Title (Arabic) *</label>
              <input required type="text" value={formData.titre_ar} onChange={e => setFormData(p => ({ ...p, titre_ar: e.target.value }))} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-secondary uppercase">Title (English)</label>
              <input type="text" value={formData.titre_en} onChange={e => setFormData(p => ({ ...p, titre_en: e.target.value }))} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-secondary uppercase">Description (Arabic) *</label>
              <textarea required rows={3} value={formData.description_ar} onChange={e => setFormData(p => ({ ...p, description_ar: e.target.value }))} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-secondary uppercase">Description (English)</label>
              <textarea rows={3} value={formData.description_en} onChange={e => setFormData(p => ({ ...p, description_en: e.target.value }))} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 resize-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="block text-xs font-semibold text-ink-secondary uppercase">Project Type</label>
               <select value={formData.typeProjet} onChange={e => setFormData(p => ({...p, typeProjet: e.target.value}))} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2">
                 <option value="application">Application</option>
                 <option value="research">Research</option>
                 <option value="hybrid">Hybrid</option>
               </select>
             </div>
             <div className="space-y-1.5">
               <label className="block text-xs font-semibold text-ink-secondary uppercase">Max Groups</label>
               <input type="number" min={1} max={5} value={formData.maxGrps} onChange={e => setFormData(p => ({...p, maxGrps: parseInt(e.target.value, 10)}))} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2" />
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-edge-subtle">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium rounded-xl border border-edge bg-surface text-ink hover:bg-surface-200">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-brand text-surface hover:opacity-90 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Subject
            </button>
          </div>
        </form>
      )}

      {loading ? <SkeletonList count={3} /> : error ? <ErrorBanner error={error} onRetry={onRetry} /> : list.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" hint="Create your first research topic proposal." />
      ) : (
        <div className="rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
          <div className="border-b border-edge-subtle bg-surface-200/60 px-5 py-3 grid grid-cols-[1fr_120px_80px_80px] gap-4 text-xs font-semibold uppercase text-ink-muted">
            <span>Subject</span><span>Status</span><span className="text-center">Groups</span><span>Actions</span>
          </div>
          <div className="divide-y divide-edge-subtle">
            {list.map(subject => (
              <div key={subject.id} className="grid grid-cols-[1fr_120px_80px_80px] items-center gap-4 px-5 py-4 hover:bg-surface-200/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{subject.titre_ar || subject.titre_en || `Subject #${subject.id}`}</p>
                  {subject.typeProjet && <span className="text-xs text-ink-tertiary capitalize">{subject.typeProjet}</span>}
                </div>
                <div><StatusBadge status={subject.status} /></div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-ink">{subject.groupsPfe?.length || 0}</span>
                  <span className="text-xs text-ink-tertiary">/{subject.maxGrps || 1}</span>
                </div>
                <div>
                  {subject.status === 'propose' && (
                    <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-brand/10 transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherGroupsOverview({ groups, loading, error, onRetry }) {
  const list = Array.isArray(groups) ? groups : [];
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="PFE Groups" title="Groups on My Subjects" subtitle="Groups that selected one of your research topics" />
      {loading ? <SkeletonList count={2} /> : error ? <ErrorBanner error={error} onRetry={onRetry} /> : list.length === 0 ? (
        <EmptyState icon={Users} title="No groups found" hint="Groups will appear here once formed." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map((group) => {
            const subject = group.sujetFinal;
            const memberCount = group.groupMembers?.length || 0;
            return (
              <div key={group.id} className="rounded-2xl border border-edge bg-surface p-5 shadow-card hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{group.nom_ar || group.nom_en || `Group #${group.id}`}</h3>
                    <p className="mt-0.5 text-xs text-ink-tertiary">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
                  </span>
                </div>
                <div className="rounded-xl bg-surface-200/60 px-3 py-2.5 mb-3">
                  <p className="text-xs font-medium text-ink-secondary mb-0.5">Subject</p>
                  <p className="text-sm text-ink font-medium truncate">{subject?.titre_ar || subject?.titre_en || 'No subject assigned'}</p>
                </div>
                {memberCount > 0 && (
                  <div className="flex items-center gap-1">
                    {(group.groupMembers || []).slice(0, 4).map((m, idx) => (
                      <div key={idx} className="w-7 h-7 rounded-full bg-brand/20 border-2 border-surface flex items-center justify-center text-xs font-semibold text-brand -ml-1 first:ml-0">
                        {(m?.user?.prenom?.[0] || m?.prenom?.[0] || '?').toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DefensePanel() {
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Defense Planning" title="Defense Schedule" subtitle="Oral defense sessions and jury assignments" />
      <EmptyState icon={CalendarDays} title="Defense planning coming soon" hint="This module is under development." />
    </div>
  );
}

export default function TeacherPFE({
  activeTab,
  setActiveTab,
  subjects,
  groups,
  loading,
  error,
  user,
  retryActiveTab,
}) {
  const teacherProfileId = user?.enseignant?.id ?? null;

  const renderCenter = () => {
    if (activeTab === 'subjects') {
      return <TeacherSubjectsView subjects={subjects} loading={loading} error={error} onRefresh={retryActiveTab} teacherProfileId={teacherProfileId} onRetry={retryActiveTab} />;
    }
    if (activeTab === 'groups') {
      // Filter groups to only show ones where teacher is encadrant or co-encadrant
      const myGroups = (Array.isArray(groups) ? groups : []).filter(g => 
        g.sujetFinal?.enseignantId === teacherProfileId || g.coEncadrantId === teacherProfileId
      );
      return <TeacherGroupsOverview groups={myGroups} loading={loading} error={error} onRetry={retryActiveTab} />;
    }
    if (activeTab === 'defense') return <DefensePanel />;
    return null;
  };

  const tabCounts = {
    subjects: subjects.length || undefined,
  };

  return (
    <div className="space-y-5 max-w-[1600px] min-w-0">
      <PageHeader role="enseignant" onRefresh={retryActiveTab} loading={loading} />
      <div className="lg:hidden overflow-x-auto">
        <div className="flex gap-1 rounded-2xl border border-edge bg-surface p-1.5 shadow-card w-max min-w-full">
          {TEACHER_TABS.map((tab) => {
            const { Icon } = tab;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive ? 'bg-brand text-surface shadow-sm' : 'text-ink-secondary hover:text-ink hover:bg-surface-200'}`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
        <div className="hidden lg:block lg:sticky lg:top-5">
          <LeftNav tabs={TEACHER_TABS} activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />
        </div>
        <main className="min-w-0">{renderCenter()}</main>
      </div>
    </div>
  );
}
