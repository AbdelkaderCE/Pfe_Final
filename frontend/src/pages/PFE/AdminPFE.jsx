import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Users, CalendarDays, Settings2, CheckCircle2, XCircle, Plus, Filter, Loader2,
} from 'lucide-react';
import {
  SectionHeader, Shimmer, EmptyState, ErrorBanner, CapacityBar, StatusBadge,
  getUserDisplayName, LeftNav, PageHeader, SUBJECT_STATUS, normalizeApiError, FilterPills
} from './SharedPFEUI';
import request from '../../services/api';
import PFEConfigCard from '../../components/pfe/admin/PFEConfigCard';

const ADMIN_TABS = [
  { id: 'subjects', label: 'Validation Queue', Icon: FileText, hint: 'Review proposals' },
  { id: 'groups', label: 'Groups', Icon: Users, hint: 'Manage PFE groups' },
  { id: 'defense', label: 'Defense Plan', Icon: CalendarDays, hint: 'Schedule defenses' },
  { id: 'config', label: 'Configuration', Icon: Settings2, hint: 'System settings' },
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

function AdminValidationQueue({ subjects, loading, error, onValidate, onReject, onRetry }) {
  const [filter, setFilter] = useState('all');

  const allSubjects = Array.isArray(subjects) ? subjects : [];

  const counts = useMemo(
    () => ({
      all: allSubjects.length,
      propose: allSubjects.filter((s) => s.status === 'propose').length,
      valide: allSubjects.filter((s) => s.status === 'valide').length,
      rejected: allSubjects.filter((s) => !['propose', 'valide'].includes(s.status)).length,
    }),
    [allSubjects]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return allSubjects;
    if (filter === 'rejected') return allSubjects.filter((s) => !['propose', 'valide'].includes(s.status));
    return allSubjects.filter((s) => s.status === filter);
  }, [allSubjects, filter]);

  const filterOptions = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'propose', label: 'Pending', count: counts.propose, dot: 'bg-warning' },
    { value: 'valide', label: 'Validated', count: counts.valide, dot: 'bg-success' },
    { value: 'rejected', label: 'Other', count: counts.rejected, dot: 'bg-ink-muted' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Admin Tools"
        title="Subjects Oversight"
        subtitle={`Review and validate ${allSubjects.length} subject proposal${allSubjects.length !== 1 ? 's' : ''}`}
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <ErrorBanner error={error} onRetry={onRetry} />
      ) : allSubjects.length === 0 ? (
        <EmptyState icon={FileText} title="No subjects yet" hint="Teachers haven't submitted any proposals yet." />
      ) : (
        <>
          <FilterPills options={filterOptions} value={filter} onChange={setFilter} />
          {filtered.length === 0 ? (
            <EmptyState icon={Filter} title={`No ${filter} subjects`} hint="Try a different filter." />
          ) : (
            <div className="space-y-3">
              {filtered.map((subject) => {
                const cfg = SUBJECT_STATUS[subject.status] || SUBJECT_STATUS.affecte;
                const isPending = subject.status === 'propose';
                return (
                  <div key={subject.id} className={`group rounded-2xl border ${cfg.border} bg-surface p-5 shadow-card hover:shadow-card-hover`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <h3 className="text-sm font-semibold text-ink truncate">{subject.titre_ar || subject.titre_en || `Subject #${subject.id}`}</h3>
                            <StatusBadge status={subject.status} />
                          </div>
                          {isPending && (
                            <div className="flex gap-2 flex-shrink-0">
                              <button type="button" onClick={() => onValidate(subject.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button type="button" onClick={() => onReject(subject.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90">
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-ink-secondary line-clamp-2 mb-3">{subject.description_ar || subject.description_en || 'No description provided.'}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-tertiary">
                          <span><span className="font-medium text-ink-secondary">Teacher:</span> {getUserDisplayName(subject.enseignant?.user)}</span>
                          {subject.typeProjet && <span className="rounded-md bg-surface-200 px-2 py-0.5 font-medium capitalize">{subject.typeProjet}</span>}
                          <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                            <span className="font-medium text-ink-secondary">Capacity:</span>
                            <div className="flex-1"><CapacityBar used={subject.groupsPfe?.length || 0} max={subject.maxGrps || 1} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdminGroupsOverview({ groups, loading, error, onRetry }) {
  const list = Array.isArray(groups) ? groups : [];
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState({ teachers: [], students: [] });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    nom_ar: '', nom_en: '', coEncadrantId: '', members: [{ etudiantId: '', role: 'chef_groupe' }]
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const [teachersRes, studentsRes] = await Promise.all([
        request('/api/v1/admin/users?role=enseignant&limit=1000'),
        request('/api/v1/admin/users?role=etudiant&limit=1000')
      ]);
      setUsers({
        teachers: teachersRes?.data?.users || teachersRes?.data || [],
        students: studentsRes?.data?.users || studentsRes?.data || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenModal = () => { setShowModal(true); fetchUsers(); };
  const handleCloseModal = () => { setShowModal(false); setFormData({ nom_ar: '', nom_en: '', coEncadrantId: '', members: [{ etudiantId: '', role: 'chef_groupe' }] }); setSubmitError(null); };
  
  const handleAddMember = () => { if (formData.members.length < 3) setFormData(p => ({ ...p, members: [...p.members, { etudiantId: '', role: 'membre' }] })); };
  const handleRemoveMember = (idx) => setFormData(p => ({ ...p, members: p.members.filter((_, i) => i !== idx) }));
  const handleMemberChange = (idx, field, value) => setFormData(p => {
    const newMembers = [...p.members];
    newMembers[idx] = { ...newMembers[idx], [field]: value };
    if (field === 'role' && value === 'chef_groupe') newMembers.forEach((m, i) => { if (i !== idx) m.role = 'membre'; });
    return { ...p, members: newMembers };
  });

  const handleSubmitGroup = async (e) => {
    e.preventDefault(); setSubmitError(null); setSubmitting(true);
    try {
      await request('/api/v1/pfe/groupes/manual', {
        method: 'POST', body: JSON.stringify({ ...formData, members: formData.members.filter(m => m.etudiantId !== '') })
      });
      handleCloseModal();
      onRetry();
    } catch (err) { setSubmitError(err.message || 'Failed to create group'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader 
        eyebrow="PFE Groups" 
        title="All Groups" 
        subtitle={`${list.length} PFE group${list.length !== 1 ? 's' : ''} in the system`}
        action={<button type="button" onClick={handleOpenModal} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-surface hover:bg-brand-hover"><Plus className="w-4 h-4" /> Create Group</button>}
      />

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
                  <p className="text-xs text-ink-tertiary mt-0.5">{getUserDisplayName(subject?.enseignant?.user)}</p>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-edge-subtle">
              <h2 className="text-lg font-bold text-ink">Create New Group</h2>
              <button onClick={handleCloseModal} className="text-ink-muted hover:text-ink"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              {submitError && <div className="mb-4 p-3 bg-danger/10 border border-danger/30 text-danger rounded-xl text-sm font-medium">{submitError}</div>}
              <form id="create-group-form" onSubmit={handleSubmitGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5 uppercase">Group Name (Arabic) *</label>
                  <input required type="text" value={formData.nom_ar} onChange={e => setFormData({...formData, nom_ar: e.target.value})} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5 uppercase">Group Name (English)</label>
                  <input type="text" value={formData.nom_en} onChange={e => setFormData({...formData, nom_en: e.target.value})} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5 uppercase">Co-encadrant (Teacher) *</label>
                  <select required value={formData.coEncadrantId} onChange={e => setFormData({...formData, coEncadrantId: e.target.value})} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand">
                    <option value="">Select a teacher...</option>
                    {users.teachers.map(t => <option key={t.id} value={t.enseignant?.id || t.id}>{t.prenom} {t.nom}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-ink-secondary uppercase">Members (Max 3) *</label>
                    {formData.members.length < 3 && <button type="button" onClick={handleAddMember} className="text-xs font-semibold text-brand hover:text-brand-hover">+ Add Member</button>}
                  </div>
                  <div className="space-y-2">
                    {formData.members.map((m, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select required value={m.etudiantId} onChange={e => handleMemberChange(idx, 'etudiantId', e.target.value)} className="flex-1 rounded-xl border border-edge-subtle bg-control-bg px-2 py-2 text-sm text-ink outline-none focus:border-brand">
                          <option value="">Select student...</option>
                          {users.students.map(s => <option key={s.id} value={s.etudiant?.id || s.id}>{s.prenom} {s.nom}</option>)}
                        </select>
                        <select required value={m.role} onChange={e => handleMemberChange(idx, 'role', e.target.value)} className="w-32 rounded-xl border border-edge-subtle bg-control-bg px-2 py-2 text-sm text-ink outline-none focus:border-brand">
                          <option value="membre">Membre</option>
                          <option value="chef_groupe">Chef Groupe</option>
                        </select>
                        {formData.members.length > 1 && <button type="button" onClick={() => handleRemoveMember(idx)} className="text-danger p-1"><XCircle className="w-5 h-5" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-edge-subtle flex justify-end gap-3 bg-surface-200/50 rounded-b-2xl">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-xl border border-edge bg-surface text-sm font-medium hover:bg-surface-200">Cancel</button>
              <button type="submit" form="create-group-form" disabled={submitting || loadingUsers} className="px-4 py-2 rounded-xl bg-brand text-surface text-sm font-medium hover:bg-brand-hover disabled:opacity-50 inline-flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {submitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
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

export default function AdminPFE({
  activeTab,
  setActiveTab,
  subjects,
  groups,
  loading,
  error,
  user,
  retryActiveTab,
  handleValidate,
  handleReject,
}) {
  const renderCenter = () => {
    if (activeTab === 'subjects') return <AdminValidationQueue subjects={subjects} loading={loading} error={error} onValidate={handleValidate} onReject={handleReject} onRetry={retryActiveTab} />;
    if (activeTab === 'groups') return <AdminGroupsOverview groups={groups} loading={loading} error={error} onRetry={retryActiveTab} />;
    if (activeTab === 'defense') return <DefensePanel />;
    if (activeTab === 'config') return <PFEConfigCard />;
    return null;
  };

  const tabCounts = {
    subjects: subjects.length || undefined,
    groups: groups.length || undefined,
  };

  return (
    <div className="space-y-5 max-w-[1600px] min-w-0">
      <PageHeader role="admin" onRefresh={retryActiveTab} loading={loading} />
      <div className="lg:hidden overflow-x-auto">
        <div className="flex gap-1 rounded-2xl border border-edge bg-surface p-1.5 shadow-card w-max min-w-full">
          {ADMIN_TABS.map((tab) => {
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
          <LeftNav tabs={ADMIN_TABS} activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />
        </div>
        <main className="min-w-0">{renderCenter()}</main>
      </div>
    </div>
  );
}
