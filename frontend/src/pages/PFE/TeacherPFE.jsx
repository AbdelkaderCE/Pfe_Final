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
import { pfeAdminAPI } from '../../services/pfe';

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
    titre_ar: '', titre_en: '', description_ar: '', description_en: '', typeProjet: 'application', maxGrps: 1, promoId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [teacherPromos, setTeacherPromos] = useState([]);

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

  // ── Fetch allowed promos for dropdown ───────────────────────
  React.useEffect(() => {
    if (!teacherProfileId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await request(`/api/v1/pfe/teacher/${teacherProfileId}/promos`);
        if (!cancelled && res?.data) {
          setTeacherPromos(res.data);
          // Auto-select first promo if only one
          if (res.data.length === 1) {
            setFormData(p => ({ ...p, promoId: String(res.data[0].id) }));
          }
        }
      } catch {
        if (!cancelled) setTeacherPromos([]);
      }
    })();
    return () => { cancelled = true; };
  }, [teacherProfileId]);

  const canCreate = teacherProfileId && submissionOpen !== false;

  const resetForm = () => {
    setFormData({ titre_ar: '', titre_en: '', description_ar: '', description_en: '', typeProjet: 'application', maxGrps: 1, promoId: teacherPromos.length === 1 ? String(teacherPromos[0].id) : '' });
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
        body: JSON.stringify({
          ...formData,
          enseignantId: Number(teacherProfileId),
          promoId: formData.promoId ? Number(formData.promoId) : undefined,
        }),
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
             <div className="space-y-1.5">
               <label className="block text-xs font-semibold text-ink-secondary uppercase">Promo *</label>
               <select required value={formData.promoId} onChange={e => setFormData(p => ({...p, promoId: e.target.value}))} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2">
                 {teacherPromos.length === 0 ? (
                   <option value="">No promo assigned</option>
                 ) : (
                   <>
                     <option value="">Select promo...</option>
                     {teacherPromos.map(p => (
                       <option key={p.id} value={p.id}>
                         {p.nom_en || p.nom_ar}{p.specialite ? ` — ${p.specialite.nom_en || p.specialite.nom_ar}` : ''}
                       </option>
                     ))}
                   </>
                 )}
               </select>
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

function GroupDetailsModal({ group, onClose }) {
  if (!group) return null;
  const subject = group.sujetFinal;
  const members = group.groupMembers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-edge animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-edge flex items-center justify-between bg-surface-200/50">
          <div>
            <h3 className="text-xl font-bold text-ink">{group.nom_ar || group.nom_en || `Group #${group.id}`}</h3>
            <p className="text-sm text-ink-tertiary">Detailed group & subject overview</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-300 transition-colors">
            <XCircle className="w-6 h-6 text-ink-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Subject Details */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-brand">
              <BookOpen className="w-5 h-5" />
              <h4 className="font-bold uppercase tracking-wider text-xs">Project Subject</h4>
            </div>
            <div className="rounded-2xl border border-edge bg-surface-200/30 p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Titles</p>
                <p className="text-base font-bold text-ink leading-relaxed">{subject?.titre_ar}</p>
                {subject?.titre_en && <p className="text-sm text-ink-secondary mt-1">{subject.titre_en}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Description</p>
                <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
                  {subject?.description_ar || 'No description provided.'}
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <div>
                  <p className="text-[10px] font-bold text-ink-muted uppercase">Type</p>
                  <span className="text-xs font-semibold text-brand capitalize">{subject?.typeProjet || 'N/A'}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink-muted uppercase">Status</p>
                  <StatusBadge status={subject?.status} />
                </div>
              </div>
            </div>
          </section>

          {/* Members Details */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-success">
              <Users className="w-5 h-5" />
              <h4 className="font-bold uppercase tracking-wider text-xs">Group Members ({members.length})</h4>
            </div>
            <div className="divide-y divide-edge border border-edge rounded-2xl overflow-hidden">
              {members.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-surface hover:bg-surface-200/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand border border-brand/20">
                      {(m?.etudiant?.user?.prenom?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {m?.etudiant?.user?.prenom} {m?.etudiant?.user?.nom}
                      </p>
                      <p className="text-xs text-ink-tertiary">Student</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-ink-secondary">{m?.etudiant?.matricule || 'No Matricule'}</p>
                    <p className="text-[10px] uppercase tracking-tighter text-ink-muted">Matricule</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 bg-surface-200/50 border-t border-edge flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-xl bg-brand text-surface font-bold text-sm shadow-lg shadow-brand/20 hover:opacity-90 transition-all">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherGroupsOverview({ groups, loading, error, onRetry }) {
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const list = Array.isArray(groups) ? groups : [];

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="PFE Groups" title="Groups on My Subjects" subtitle="Groups that selected one of your research topics" />
      {loading ? <SkeletonList count={2} /> : error ? <ErrorBanner error={error} onRetry={onRetry} /> : list.length === 0 ? (
        <EmptyState icon={Users} title="No groups found" hint="Groups will appear here once formed." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {list.map((group) => {
              const subject = group.sujetFinal;
              const memberCount = group.groupMembers?.length || 0;
              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className="group rounded-2xl border border-edge bg-surface p-5 shadow-card hover:shadow-card-hover hover:border-brand/40 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-ink group-hover:text-brand transition-colors">
                        {group.nom_ar || group.nom_en || `Group #${group.id}`}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-tertiary">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
                    </span>
                  </div>
                  <div className="rounded-xl bg-surface-200/60 px-3 py-2.5 mb-3 group-hover:bg-brand/5 transition-colors">
                    <p className="text-xs font-medium text-ink-secondary mb-0.5">Subject</p>
                    <p className="text-sm text-ink font-medium truncate">{subject?.titre_ar || subject?.titre_en || 'No subject assigned'}</p>
                  </div>
                  {memberCount > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {(group.groupMembers || []).slice(0, 4).map((m, idx) => (
                          <div key={idx} className="w-7 h-7 rounded-full bg-brand/20 border-2 border-surface flex items-center justify-center text-xs font-semibold text-brand -ml-1 first:ml-0">
                            {(m?.etudiant?.user?.prenom?.[0] || '?').toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-brand opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">Click to view details →</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <GroupDetailsModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
        </>
      )}
    </div>
  );
}

function DefensePanel({ teacherId }) {
  const [myJuries, setMyJuries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!teacherId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await pfeAdminAPI.myJuryAssignments();
        if (!alive) return;
        setMyJuries(res?.data || []);
      } catch (err) {
        if (alive) setError('Failed to load defense schedule.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teacherId]);

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Defense Planning" title="My Defense Schedule" subtitle="Your assigned jury roles and oral defense sessions" />

      {loading ? (
        <SkeletonList count={2} />
      ) : error ? (
        <ErrorBanner error={{ message: error }} />
      ) : myJuries.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No defense sessions" hint="You are not assigned to any jury yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myJuries.map((j) => (
            <div key={j.id} className="rounded-2xl border border-edge bg-surface p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${j.role === 'president' ? 'bg-brand/10 text-brand' : 'bg-success/10 text-success'}`}>
                    {j.role}
                  </span>
                  <h3 className="text-base font-bold text-ink mt-1">
                    {j.group?.nom_ar || j.group?.nom_en || `Group #${j.groupId}`}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{j.group?.salleSoutenance || 'TBD'}</p>
                  <p className="text-xs text-ink-tertiary">Room</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-surface-200/50 p-3">
                  <p className="text-xs font-semibold text-ink-tertiary uppercase mb-1">Subject</p>
                  <p className="text-sm font-medium text-ink line-clamp-2">
                    {j.group?.sujetFinal?.titre_ar || j.group?.sujetFinal?.titre_en || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-brand/5 p-2 text-brand">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-ink-tertiary uppercase leading-none">Date</p>
                      <p className="text-sm font-bold text-ink">
                        {j.group?.dateSoutenance ? new Date(j.group.dateSoutenance).toLocaleDateString() : 'Unscheduled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-warning/5 p-2 text-warning">
                      <Loader2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-ink-tertiary uppercase leading-none">Time</p>
                      <p className="text-sm font-bold text-ink">
                        {j.group?.dateSoutenance ? new Date(j.group.dateSoutenance).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    if (activeTab === 'defense') return <DefensePanel teacherId={teacherProfileId} />;
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
