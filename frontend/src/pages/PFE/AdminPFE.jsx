import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Users,
  CalendarDays,
  Settings2,
  CheckCircle2,
  XCircle,
  Plus,
  Filter,
  Loader2,
  Pencil,
  LayoutDashboard,
  Gavel,
  BarChart3,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  BookOpen,
} from 'lucide-react';
import {
  SectionHeader, Shimmer, EmptyState, ErrorBanner, CapacityBar, StatusBadge,
  getUserDisplayName, LeftNav, PageHeader, SUBJECT_STATUS, normalizeApiError, FilterPills, StatCard,
  EditSubjectModal, EditGroupModal, AssignSubjectModal,
} from './SharedPFEUI';
import request from '../../services/api';
import PFEConfigCard from '../../components/pfe/admin/PFEConfigCard';

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard, hint: 'Overview' },
  { id: 'subjects', label: 'Subjects', Icon: FileText, hint: 'Review proposals' },
  { id: 'groups', label: 'Groups', Icon: Users, hint: 'Manage PFE groups' },
  { id: 'jury', label: 'Jury', Icon: Gavel, hint: 'Compose panels' },
  { id: 'defense', label: 'Defenses', Icon: CalendarDays, hint: 'Defense schedule' },
  { id: 'config', label: 'Configuration', Icon: Settings2, hint: 'System settings' },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3, hint: 'PFE insights' },
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

function AdminDashboardPanel({ subjects, groups, loading }) {
  const subjectList = Array.isArray(subjects) ? subjects : [];
  const groupList = Array.isArray(groups) ? groups : [];
  const pendingSubjects = subjectList.filter((s) => s.status === 'propose').length;
  const scheduledDefenses = groupList.filter((g) => g.dateSoutenance).length;
  const juryAssigned = groupList.filter((g) => (g.pfeJury || []).length > 0).length;

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Unified PFE"
        title="Admin Dashboard"
        subtitle="Cross-module KPIs for subjects, groups, and defenses."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          icon={FileText}
          label="Total subjects"
          value={subjectList.length}
          colorCls="bg-brand/10 text-brand"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Pending approval"
          value={pendingSubjects}
          colorCls="bg-warning/10 text-warning"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Total groups"
          value={groupList.length}
          colorCls="bg-success/10 text-success"
          loading={loading}
        />
        <StatCard
          icon={Gavel}
          label="Jury assigned"
          value={juryAssigned}
          colorCls="bg-surface-200 text-ink"
          loading={loading}
        />
        <StatCard
          icon={CalendarDays}
          label="Defenses scheduled"
          value={scheduledDefenses}
          colorCls="bg-brand/5 text-brand"
          loading={loading}
        />
      </div>
    </div>
  );
}

function AdminAnalyticsPanel({ subjects, groups }) {
  const subjectList = Array.isArray(subjects) ? subjects : [];
  const groupList = Array.isArray(groups) ? groups : [];

  const subjectStatus = useMemo(() => {
    const counts = new Map();
    subjectList.forEach((subject) => {
      const key = String(subject?.status || 'unknown');
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [subjectList]);

  const groupStatus = useMemo(() => {
    const counts = { pending: 0, partial: 0, full: 0, scheduled: 0, completed: 0 };
    groupList.forEach((group) => {
      const status = resolveGroupStatus(group);
      counts[status] += 1;
    });
    return counts;
  }, [groupList]);

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="PFE Analytics"
        title="Status breakdown"
        subtitle="Quick insight into subject and defense states."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Subjects by status</p>
          <div className="mt-3 space-y-2 text-sm">
            {subjectStatus.length === 0 ? (
              <span className="text-ink-tertiary">No subjects found.</span>
            ) : (
              subjectStatus.map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-ink-secondary">{row.label}</span>
                  <span className="font-semibold text-ink">{row.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Groups by defense status</p>
          <div className="mt-3 space-y-2 text-sm">
            {Object.entries(groupStatus).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-ink-secondary">{GROUP_STATUS_CONFIG[key]?.label || key}</span>
                <span className="font-semibold text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminValidationQueue({ subjects, loading, error, onValidate, onReject, onRetry }) {
  const [editingSubject, setEditingSubject] = useState(null);
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
                          <div className="flex gap-2 flex-shrink-0">
                            {/* Admin can edit any subject at any status */}
                            <button
                              type="button"
                              onClick={() => setEditingSubject(subject)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-200"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            {isPending && (
                              <>
                                <button type="button" onClick={() => onValidate(subject.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button type="button" onClick={() => onReject(subject.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90">
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Edit modal — admin can edit any subject at any status */}
      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
          onSaved={async () => { if (onRetry) await onRetry(); }}
        />
      )}
    </div>
  );
}

function GroupDetailsModal({ group, onClose }) {
  if (!group) return null;
  const subject = group.sujetFinal;
  const members = group.groupMembers || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-edge animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-edge flex items-center justify-between bg-surface-200/50">
          <div>
            <h3 className="text-xl font-bold text-ink">{group.nom_ar || group.nom_en || `Group #${group.id}`}</h3>
            <p className="text-sm text-ink-tertiary">Administrative group & subject overview</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-300 transition-colors">
            <XCircle className="w-6 h-6 text-ink-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Subject Details */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-brand">
              <FileText className="w-5 h-5" />
              <h4 className="font-bold uppercase tracking-wider text-xs">Project Subject</h4>
            </div>
            <div className="rounded-2xl border border-edge bg-surface-200/30 p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Titles</p>
                <p className="text-base font-bold text-ink leading-relaxed">{subject?.titre_ar}</p>
                {subject?.titre_en && <p className="text-sm text-ink-secondary mt-1">{subject.titre_en}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 border-y border-edge-subtle my-2">
                <div>
                  <p className="text-[10px] font-bold text-ink-muted uppercase mb-0.5">Encadrant (Teacher)</p>
                  <p className="text-sm font-semibold text-ink">{getUserDisplayName(subject?.enseignant?.user)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink-muted uppercase mb-0.5">Project Type</p>
                  <span className="text-xs font-semibold text-brand capitalize">{subject?.typeProjet || 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Description</p>
                <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap italic">
                  {subject?.description_ar || 'No description provided.'}
                </p>
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
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.role === 'chef_groupe' ? 'bg-brand/10 text-brand' : 'bg-surface-300 text-ink-tertiary'}`}>
                        {m.role === 'chef_groupe' ? 'Team Lead' : 'Member'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-ink-secondary">{m?.etudiant?.matricule || 'N/A'}</p>
                    <p className="text-[10px] uppercase tracking-tighter text-ink-muted">Matricule</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 bg-surface-200/50 border-t border-edge flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-xl bg-ink text-surface font-bold text-sm shadow-lg hover:opacity-90 transition-all">
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}

const GROUP_STATUS_CONFIG = {
  no_subject:{ label: 'No Subject', cls: 'bg-danger/10 text-danger border-danger/20' },
  pending:   { label: 'No Jury',    cls: 'bg-surface-200 text-ink-secondary border-edge' },
  partial:   { label: 'Partial',    cls: 'bg-warning/10 text-warning border-warning/20' },
  full:      { label: 'Full Jury',  cls: 'bg-brand/10 text-brand border-brand/20' },
  scheduled: { label: 'Scheduled',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed',  cls: 'bg-success/10 text-success border-success/20' },
};

const DEFAULT_MAX_EXAMINERS = 2;

const resolveGroupStatus = (group) => {
  if (group?.validationFinale || group?.note != null) return 'completed';
  if (!group?.sujetFinalId) return 'no_subject';
  const jury = Array.isArray(group?.pfeJury) ? group.pfeJury : [];
  const hasPresident = jury.some(j => j.role === 'president');
  const examinerCount = jury.filter(j => j.role === 'examinateur').length;
  if (jury.length === 0) return 'pending';
  if (hasPresident && examinerCount >= DEFAULT_MAX_EXAMINERS) {
    return group?.dateSoutenance ? 'scheduled' : 'full';
  }
  return 'partial';
};

const groupTitle = (group) => group?.nom_ar || group?.nom_en || `Group #${group?.id}`;
const subjectTitle = (subject) => subject?.titre_ar || subject?.titre_en || `Subject #${subject?.id}`;
const promoLabel = (promo) => promo?.nom_ar || promo?.nom_en || promo?.nom || (promo?.id ? `Promo ${promo.id}` : '—');

const formatDefenseDate = (value) => {
  if (!value) return { date: '—', time: '' };
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return { date: '—', time: '' };
  return {
    date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
};

function AdminGroupsOverview({ groups, subjects, loading, error, onRetry }) {
  const [showModal, setShowModal] = useState(false);
  const [assigningGroup, setAssigningGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ nom_ar: '', nom_en: '', coEncadrantId: '', sujetFinalId: '', members: [{ etudiantId: '', role: 'chef_groupe' }] });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [users, setUsers] = useState({ teachers: [], students: [] });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [promoFilter, setPromoFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const list = Array.isArray(groups) ? groups : [];

  const statusCounts = useMemo(() => {
    const counts = { all: list.length, no_subject: 0, pending: 0, partial: 0, full: 0, scheduled: 0, completed: 0 };
    list.forEach((group) => {
      const status = resolveGroupStatus(group);
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return counts;
  }, [list]);

  const promoOptions = useMemo(() => {
    const map = new Map();
    list.forEach((group) => {
      const promo = group?.sujetFinal?.promo || null;
      if (promo?.id && !map.has(String(promo.id))) {
        map.set(String(promo.id), promo);
      }
    });
    return Array.from(map.values());
  }, [list]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.filter((group) => {
      const status = resolveGroupStatus(group);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (promoFilter !== 'all') {
        const groupPromoId = group?.sujetFinal?.promo?.id;
        if (!groupPromoId || String(groupPromoId) !== promoFilter) return false;
      }

      if (!term) return true;

      const subject = group?.sujetFinal;
      const supervisor = group?.coEncadrant?.user;
      const memberNames = (group?.groupMembers || [])
        .map((m) => getUserDisplayName(m?.etudiant?.user))
        .join(' ');

      const haystack = [
        groupTitle(group),
        subjectTitle(subject),
        getUserDisplayName(supervisor),
        promoLabel(subject?.promo),
        memberNames,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [list, promoFilter, search, statusFilter]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const [tRes, sRes] = await Promise.all([
        request('/api/v1/admin/users?role=enseignant&limit=1000'),
        request('/api/v1/admin/users?role=etudiant&limit=1000'),
      ]);
      setUsers({
        teachers: tRes?.data?.users || tRes?.data || [],
        students: sRes?.data?.users || sRes?.data || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenModal = () => { setShowModal(true); fetchUsers(); };
  const handleCloseModal = () => { setShowModal(false); setFormData({ nom_ar: '', nom_en: '', coEncadrantId: '', sujetFinalId: '', members: [{ etudiantId: '', role: 'chef_groupe' }] }); setSubmitError(null); };

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

  const toggleExpanded = (groupId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="PFE Groups"
        title="All Groups"
        subtitle={`${list.length} PFE group${list.length !== 1 ? 's' : ''} in the system`}
        action={(
          <button type="button" onClick={handleOpenModal} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-surface hover:bg-brand-hover">
            <Plus className="w-4 h-4" /> Create Group
          </button>
        )}
      />

      {loading ? (
        <SkeletonList count={2} />
      ) : error ? (
        <ErrorBanner error={error} onRetry={onRetry} />
      ) : list.length === 0 ? (
        <EmptyState icon={Users} title="No groups found" hint="Groups will appear here once formed." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-edge bg-surface p-4 shadow-card">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search group, subject, or member"
                className="w-full rounded-xl border border-edge-subtle bg-control-bg pl-9 pr-3 py-2 text-sm text-ink outline-none focus:border-brand"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="all">All statuses ({statusCounts.all})</option>
              <option value="no_subject">No Subject ({statusCounts.no_subject})</option>
              <option value="pending">No Jury ({statusCounts.pending})</option>
              <option value="partial">Partial ({statusCounts.partial})</option>
              <option value="full">Full Jury ({statusCounts.full})</option>
              <option value="scheduled">Scheduled ({statusCounts.scheduled})</option>
              <option value="completed">Completed ({statusCounts.completed})</option>
            </select>
            <select
              value={promoFilter}
              onChange={(event) => setPromoFilter(event.target.value)}
              className="rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="all">All promos</option>
              {promoOptions.map((promo) => (
                <option key={promo.id} value={String(promo.id)}>
                  {promoLabel(promo)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-card">
            <table className="min-w-full divide-y divide-edge text-sm">
              <thead className="bg-surface-200 text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Group</th>
                  <th className="px-4 py-3 text-left font-semibold">Subject</th>
                  <th className="px-4 py-3 text-left font-semibold">Supervisor</th>
                  <th className="px-4 py-3 text-left font-semibold">Jury</th>
                  <th className="px-4 py-3 text-left font-semibold">Defense</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle bg-surface">
                {filteredGroups.map((group) => {
                  const subject = group?.sujetFinal;
                  const supervisor = group?.coEncadrant?.user || subject?.enseignant?.user;
                  const juryEntries = Array.isArray(group?.pfeJury) ? group.pfeJury : [];
                  const president = juryEntries.find((j) => j.role === 'president');
                  const members = juryEntries.filter((j) => j.role !== 'president');
                  const statusKey = resolveGroupStatus(group);
                  const statusCfg = GROUP_STATUS_CONFIG[statusKey] || GROUP_STATUS_CONFIG.pending;
                  const defense = formatDefenseDate(group?.dateSoutenance);
                  const isExpanded = expandedIds.has(group.id);

                  return (
                    <React.Fragment key={group.id}>
                      <tr className="hover:bg-surface-200/40">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-ink">{groupTitle(group)}</div>
                          <div className="text-xs text-ink-tertiary">{promoLabel(subject?.promo)}</div>
                        </td>
                        <td className="px-4 py-4 text-ink">
                          <div className="font-medium">{subjectTitle(subject)}</div>
                          <div className="text-xs text-ink-tertiary">{subject?.typeProjet || '—'}</div>
                        </td>
                        <td className="px-4 py-4 text-ink-secondary">
                          {getUserDisplayName(supervisor)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-ink">{president ? getUserDisplayName(president.enseignant?.user) : 'Unassigned'}</div>
                          <div className="text-xs text-ink-tertiary">Members: {members.length}</div>
                        </td>
                        <td className="px-4 py-4 text-ink-secondary">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-ink-tertiary" />
                            <span>{defense.date}</span>
                          </div>
                          <div className="text-xs text-ink-tertiary flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {group?.salleSoutenance || 'TBD'} {defense.time ? `· ${defense.time}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAssigningGroup(group)}
                              className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-200"
                            >
                              <BookOpen className="w-3.5 h-3.5" /> Assign
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpanded(group.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-200"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingGroup(group)}
                              className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-200"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-surface-200/50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Members</p>
                                <div className="mt-2 space-y-1">
                                  {(group.groupMembers || []).length === 0 ? (
                                    <span className="text-ink-tertiary">No members yet.</span>
                                  ) : (
                                    (group.groupMembers || []).map((m) => (
                                      <div key={m.id || m.etudiantId} className="text-ink">
                                        {getUserDisplayName(m?.etudiant?.user)} <span className="text-xs text-ink-tertiary">({m.role})</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Jury panel</p>
                                <div className="mt-2 space-y-1">
                                  {juryEntries.length === 0 ? (
                                    <span className="text-ink-tertiary">No jury assigned.</span>
                                  ) : (
                                    juryEntries.map((entry) => (
                                      <div key={entry.id} className="text-ink">
                                        {getUserDisplayName(entry?.enseignant?.user)} <span className="text-xs text-ink-tertiary">({entry.role})</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Defense details</p>
                                <div className="mt-2 text-ink-secondary">
                                  <div>Date: {defense.date}</div>
                                  <div>Time: {defense.time || '—'}</div>
                                  <div>Room: {group?.salleSoutenance || 'TBD'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {filteredGroups.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-ink-tertiary">
                No groups match the current filters.
              </div>
            )}
          </div>
        </>
      )}

      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSaved={async () => { if (onRetry) await onRetry(); }}
        />
      )}

      {assigningGroup && (
        <AssignSubjectModal
          group={assigningGroup}
          subjects={subjects}
          onClose={() => setAssigningGroup(null)}
          onAssigned={async () => { if (onRetry) await onRetry(); }}
        />
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
                  <label className="block text-xs font-semibold text-ink-secondary mb-1.5 uppercase">Assigned Subject (Optional)</label>
                  <select value={formData.sujetFinalId} onChange={e => setFormData({...formData, sujetFinalId: e.target.value})} className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand">
                    <option value="">No subject</option>
                    {(subjects || []).filter(s => s.status === 'valide' && (s.groupsPfe?.length || 0) < (s.maxGrps || 1)).map(s => (
                      <option key={s.id} value={s.id}>{s.titre_ar || s.titre_en}</option>
                    ))}
                  </select>
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

function JuryPanel({ groups }) {
  const [teachers, setTeachers] = useState([]);
  const [juryData, setJuryData] = useState({});
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({ presidentId: '', members: [], date: '', time: '', room: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const groupList = Array.isArray(groups) ? groups : [];

  // Fetch teachers + existing jury data
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingTeachers(true);
      try {
        const [teachersRes, juryRes] = await Promise.all([
          request('/api/v1/admin/users?role=enseignant&limit=1000'),
          request('/api/v1/pfe/jury'),
        ]);
        if (!alive) return;
        setTeachers(teachersRes?.data?.users || teachersRes?.data || []);
        // Group jury by groupId
        const jMap = {};
        for (const j of (juryRes?.data || [])) {
          if (!j.groupId) continue;
          if (!jMap[j.groupId]) jMap[j.groupId] = [];
          jMap[j.groupId].push(j);
        }
        setJuryData(jMap);
      } catch { /* swallow */ }
      finally { if (alive) setLoadingTeachers(false); }
    })();
    return () => { alive = false; };
  }, []);

  const openGroup = (group) => {
    setSelectedGroup(group);
    setError('');
    setSuccess('');
    const existing = juryData[group.id] || [];
    const president = existing.find(j => j.role === 'president');
    const members = existing.filter(j => j.role !== 'president');
    setFormData({
      presidentId: president?.enseignant?.id ? String(president.enseignant.id) : '',
      members: members.map(m => ({ enseignantId: String(m.enseignant?.id || ''), role: m.role || 'examinateur' })),
      date: group.dateSoutenance ? new Date(group.dateSoutenance).toISOString().split('T')[0] : '',
      time: group.dateSoutenance ? new Date(group.dateSoutenance).toISOString().slice(11, 16) : '',
      room: group.salleSoutenance || '',
    });
  };

  const handleAddMember = () => {
    setFormData(p => ({ ...p, members: [...p.members, { enseignantId: '', role: 'examinateur' }] }));
  };

  const handleRemoveMember = (idx) => {
    setFormData(p => ({ ...p, members: p.members.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!selectedGroup || !formData.presidentId) {
      setError('President is required.');
      return;
    }
    // Defense scheduling fields are mandatory at compose time so the
    // student/teacher views never end up rendering "Unscheduled / TBD"
    // for a jury that has been assigned. Admins who want to defer the
    // schedule should leave the jury for later instead of saving early.
    if (!formData.date || !formData.time) {
      setError('Defense date and time are required.');
      return;
    }
    if (!formData.room || !formData.room.trim()) {
      setError('Defense room is required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await request(`/api/v1/pfe/admin/groups/${selectedGroup.id}/jury/compose`, {
        method: 'PUT',
        body: JSON.stringify({
          presidentId: Number(formData.presidentId),
          members: formData.members.filter(m => m.enseignantId).map(m => ({
            enseignantId: Number(m.enseignantId),
            role: m.role,
          })),
          date: formData.date,
          time: formData.time,
          room: formData.room.trim(),
        }),
      });
      // Refresh jury data
      const juryRes = await request('/api/v1/pfe/jury');
      const jMap = {};
      for (const j of (juryRes?.data || [])) {
        if (!j.groupId) continue;
        if (!jMap[j.groupId]) jMap[j.groupId] = [];
        jMap[j.groupId].push(j);
      }
      setJuryData(jMap);
      setSuccess('Jury composed successfully! Alerts sent to students and jury members.');
    } catch (err) {
      setError(err?.message || 'Failed to compose jury.');
    } finally {
      setSaving(false);
    }
  };

  const getTeacherLabel = (t) => `${t.prenom || ''} ${t.nom || ''}`.trim() || t.email || `#${t.id}`;

  const statusCounts = useMemo(() => {
    const counts = { all: groupList.length, pending: 0, partial: 0, full: 0, scheduled: 0, completed: 0 };
    groupList.forEach((group) => {
      const status = resolveGroupStatus(group);
      counts[status] += 1;
    });
    return counts;
  }, [groupList]);

  const juryRows = useMemo(() => {
    return groupList.map((group) => {
      const entries = (juryData[group.id] && juryData[group.id].length)
        ? juryData[group.id]
        : Array.isArray(group?.pfeJury) ? group.pfeJury : [];
      const president = entries.find((entry) => entry.role === 'president');
      const members = entries.filter((entry) => entry.role !== 'president');
      const defense = formatDefenseDate(group?.dateSoutenance);
      const statusKey = resolveGroupStatus(group);
      return { group, entries, president, members, defense, statusKey };
    });
  }, [groupList, juryData]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return juryRows.filter((row) => {
      if (statusFilter !== 'all' && row.statusKey !== statusFilter) return false;
      if (!term) return true;
      const subject = row.group?.sujetFinal;
      const promo = subject?.promo;
      const memberNames = row.members.map((m) => getUserDisplayName(m?.enseignant?.user)).join(' ');
      const haystack = [
        groupTitle(row.group),
        subjectTitle(subject),
        promoLabel(promo),
        getUserDisplayName(row.president?.enseignant?.user),
        memberNames,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [juryRows, search, statusFilter]);

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Defense Planning"
        title="Jury Management"
        subtitle="Assign jury members and schedule defenses for each PFE group"
      />

      {groupList.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No groups found" hint="Create PFE groups first, then assign juries." />
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-edge bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search group, subject, or jury member"
                  className="w-full rounded-xl border border-edge-subtle bg-control-bg pl-9 pr-3 py-2 text-sm text-ink outline-none focus:border-brand"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none"
              >
                <option value="all">All statuses ({statusCounts.all})</option>
                <option value="pending">No Jury ({statusCounts.pending})</option>
                <option value="partial">Partial ({statusCounts.partial})</option>
                <option value="full">Full Jury ({statusCounts.full})</option>
                <option value="scheduled">Scheduled ({statusCounts.scheduled})</option>
                <option value="completed">Completed ({statusCounts.completed})</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-edge">
              <table className="min-w-full divide-y divide-edge text-sm">
                <thead className="bg-surface-200 text-ink-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Group</th>
                    <th className="px-4 py-3 text-left font-semibold">Subject</th>
                    <th className="px-4 py-3 text-left font-semibold">President</th>
                    <th className="px-4 py-3 text-left font-semibold">Members</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Room</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-subtle bg-surface">
                  {filteredRows.map((row) => {
                    const subject = row.group?.sujetFinal;
                    const statusCfg = GROUP_STATUS_CONFIG[row.statusKey] || GROUP_STATUS_CONFIG.pending;
                    return (
                      <tr key={row.group.id} className="hover:bg-surface-200/40">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-ink">{groupTitle(row.group)}</div>
                          <div className="text-xs text-ink-tertiary">{promoLabel(subject?.promo)}</div>
                        </td>
                        <td className="px-4 py-4 text-ink">{subjectTitle(subject)}</td>
                        <td className="px-4 py-4 text-ink-secondary">
                          {row.president ? getUserDisplayName(row.president.enseignant?.user) : '—'}
                        </td>
                        <td className="px-4 py-4 text-ink-secondary">
                          {row.members.length > 0
                            ? row.members.map((m) => getUserDisplayName(m?.enseignant?.user)).join(', ')
                            : '—'}
                        </td>
                        <td className="px-4 py-4 text-ink-secondary">
                          {row.defense.date}
                        </td>
                        <td className="px-4 py-4 text-ink-secondary">
                          {row.group?.salleSoutenance || 'TBD'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openGroup(row.group)}
                            disabled={loadingTeachers}
                            className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-200 disabled:opacity-50"
                          >
                            <Gavel className="h-3.5 w-3.5" /> Compose
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRows.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-ink-tertiary">
                  No juries match the current filters.
                </div>
              )}
            </div>
          </div>

          {selectedGroup ? (
            <div className="rounded-2xl border border-edge bg-surface p-6 shadow-card space-y-5">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {selectedGroup.nom_ar || selectedGroup.nom_en || `Group #${selectedGroup.id}`}
                </h3>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  Subject: {selectedGroup.sujetFinal?.titre_ar || selectedGroup.sujetFinal?.titre_en || 'None'}
                </p>
              </div>

              {error && <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">{error}</div>}
              {success && <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-2.5 text-sm text-success">{success}</div>}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-secondary uppercase">President (Required) *</label>
                <select
                  value={formData.presidentId}
                  onChange={e => setFormData(p => ({ ...p, presidentId: e.target.value }))}
                  className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2"
                >
                  <option value="">Select president...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.enseignant?.id || t.id}>{getTeacherLabel(t)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink-secondary uppercase">Jury Members</label>
                  <button type="button" onClick={handleAddMember} className="text-xs font-semibold text-brand hover:text-brand-hover">+ Add Member</button>
                </div>
                {formData.members.map((m, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={m.enseignantId}
                      onChange={e => {
                        const members = [...formData.members];
                        members[idx] = { ...members[idx], enseignantId: e.target.value };
                        setFormData(p => ({ ...p, members }));
                      }}
                      className="flex-1 rounded-xl border border-edge-subtle bg-control-bg px-2.5 py-2 text-sm text-ink outline-none focus:border-brand"
                    >
                      <option value="">Select teacher...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.enseignant?.id || t.id}>{getTeacherLabel(t)}</option>
                      ))}
                    </select>
                    <select
                      value={m.role}
                      onChange={e => {
                        const members = [...formData.members];
                        members[idx] = { ...members[idx], role: e.target.value };
                        setFormData(p => ({ ...p, members }));
                      }}
                      className="w-36 rounded-xl border border-edge-subtle bg-control-bg px-2.5 py-2 text-sm text-ink outline-none focus:border-brand"
                    >
                      <option value="examinateur">Examinateur</option>
                      <option value="rapporteur">Rapporteur</option>
                    </select>
                    <button type="button" onClick={() => handleRemoveMember(idx)} className="text-danger p-1 hover:bg-danger/10 rounded-lg">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-secondary uppercase">
                    Defense Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-secondary uppercase">
                    Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                    className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-secondary uppercase">
                    Room <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amphi A"
                    value={formData.room}
                    onChange={e => setFormData(p => ({ ...p, room: e.target.value }))}
                    className="w-full rounded-xl border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-edge-subtle">
                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-edge bg-surface text-ink hover:bg-surface-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saving
                    || !formData.presidentId
                    || !formData.date
                    || !formData.time
                    || !formData.room
                    || !formData.room.trim()
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-brand text-surface hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Jury & Schedule'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-edge bg-surface p-8 flex items-center justify-center">
              <p className="text-sm text-ink-tertiary">Select a group to compose its jury.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DefenseSchedulePanel({ groups }) {
  const list = Array.isArray(groups) ? groups : [];
  const rows = useMemo(() => {
    return list
      .map((group) => {
        const defense = formatDefenseDate(group?.dateSoutenance);
        return { group, defense, statusKey: resolveGroupStatus(group) };
      })
      .sort((a, b) => {
        const aDate = a.group?.dateSoutenance ? new Date(a.group.dateSoutenance).getTime() : Infinity;
        const bDate = b.group?.dateSoutenance ? new Date(b.group.dateSoutenance).getTime() : Infinity;
        return aDate - bDate;
      });
  }, [list]);

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Defense Planning"
        title="Defense Schedule"
        subtitle="Upcoming and completed defenses across all PFE groups."
      />

      {rows.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No defenses scheduled" hint="Assign juries and set dates to populate the schedule." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-card">
          <table className="min-w-full divide-y divide-edge text-sm">
            <thead className="bg-surface-200 text-ink-tertiary">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Group</th>
                <th className="px-4 py-3 text-left font-semibold">Subject</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Room</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle bg-surface">
              {rows.map((row) => {
                const subject = row.group?.sujetFinal;
                const statusCfg = GROUP_STATUS_CONFIG[row.statusKey] || GROUP_STATUS_CONFIG.pending;
                return (
                  <tr key={row.group.id} className="hover:bg-surface-200/40">
                    <td className="px-4 py-4 text-ink font-semibold">{groupTitle(row.group)}</td>
                    <td className="px-4 py-4 text-ink-secondary">{subjectTitle(subject)}</td>
                    <td className="px-4 py-4 text-ink-secondary">{row.defense.date} {row.defense.time ? `· ${row.defense.time}` : ''}</td>
                    <td className="px-4 py-4 text-ink-secondary">{row.group?.salleSoutenance || 'TBD'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
    if (activeTab === 'dashboard') return <AdminDashboardPanel subjects={subjects} groups={groups} loading={loading} />;
    if (activeTab === 'subjects') return <AdminValidationQueue subjects={subjects} loading={loading} error={error} onValidate={handleValidate} onReject={handleReject} onRetry={retryActiveTab} />;
    if (activeTab === 'groups') return <AdminGroupsOverview groups={groups} subjects={subjects} loading={loading} error={error} onRetry={retryActiveTab} />;
    if (activeTab === 'jury') return <JuryPanel groups={groups} />;
    if (activeTab === 'defense') return <DefenseSchedulePanel groups={groups} />;
    if (activeTab === 'config') return <PFEConfigCard />;
    if (activeTab === 'analytics') return <AdminAnalyticsPanel subjects={subjects} groups={groups} />;
    return null;
  };

  const tabCounts = {
    subjects: subjects.length || undefined,
    groups: groups.length || undefined,
    jury: (Array.isArray(groups) ? groups.filter((g) => (g.pfeJury || []).length > 0).length : undefined),
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
