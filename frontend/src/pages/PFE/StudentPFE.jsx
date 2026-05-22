import React, { useMemo, useState } from 'react';
import { BookOpen, Users, CalendarDays, CheckCircle2, LayoutDashboard } from 'lucide-react';
import request from '../../services/api';
import {
  SectionHeader,
  Shimmer,
  EmptyState,
  ErrorBanner,
  CapacityBar,
  getUserDisplayName,
  StatCard,
  LeftNav,
  PageHeader,
} from './SharedPFEUI';

const STUDENT_TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard, hint: 'Overview' },
  { id: 'subjects', label: 'Available Subjects', Icon: BookOpen, hint: 'Browse topics' },
  { id: 'groups', label: 'My Group', Icon: Users, hint: 'Your PFE group' },
  { id: 'defense', label: 'Defense Info', Icon: CalendarDays, hint: 'Defense details' },
];

function StudentDashboardPanel({ subjects, myGroup, loading }) {
  const validated = (Array.isArray(subjects) ? subjects : []).filter((s) => s.status === 'valide');
  const hasGroup = Boolean(myGroup);
  const hasSubject = Boolean(myGroup?.sujetFinalId || myGroup?.sujetFinal?.id);
  const defenseScheduled = Boolean(myGroup?.dateSoutenance);

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="PFE Overview"
        title="Student Dashboard"
        subtitle="Your project status and available subjects."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Validated subjects"
          value={validated.length}
          colorCls="bg-brand/10 text-brand"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Group assigned"
          value={hasGroup ? 1 : 0}
          colorCls="bg-success/10 text-success"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Subject locked"
          value={hasSubject ? 1 : 0}
          colorCls="bg-warning/10 text-warning"
          loading={loading}
        />
        <StatCard
          icon={CalendarDays}
          label="Defense scheduled"
          value={defenseScheduled ? 1 : 0}
          colorCls="bg-surface-200 text-ink"
          loading={loading}
        />
      </div>
    </div>
  );
}

function StudentSubjectGallery({ subjects, loading, error, onRetry, myGroup, user }) {
  const validated = (Array.isArray(subjects) ? subjects : []).filter((s) => s.status === 'valide');
  const assignedSubjectId = myGroup?.sujetFinalId;
  const assignedSubject = assignedSubjectId ? validated.find(s => s.id === assignedSubjectId) || myGroup?.sujetFinal : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <SectionHeader eyebrow="PFE Topics" title="Subjects" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
              <div className="space-y-3">
                <Shimmer className="h-5 w-3/4" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <SectionHeader eyebrow="PFE Topics" title="Subjects" />
        <ErrorBanner error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (assignedSubject) {
    return (
      <div className="space-y-4">
        <SectionHeader
          eyebrow="Assigned Topic"
          title="My PFE Subject"
          subtitle="Your group has been assigned the following subject."
        />
        <div className="rounded-2xl border-2 border-brand bg-brand/5 p-5 shadow-card-hover">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-ink leading-snug">
              {assignedSubject.titre_ar || assignedSubject.titre_en || `Subject #${assignedSubject.id}`}
            </h3>
            <CheckCircle2 className="w-6 h-6 text-brand flex-shrink-0" />
          </div>
          <p className="text-sm text-ink-secondary mb-4">
            {assignedSubject.description_ar || assignedSubject.description_en || '—'}
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-ink-tertiary">
              <span className="font-medium text-ink-secondary">
                Supervised by: {getUserDisplayName(assignedSubject.enseignant?.user)}
              </span>
              {assignedSubject.typeProjet && (
                <span className="rounded-md bg-surface-200 px-2 py-0.5 capitalize font-medium">
                  {assignedSubject.typeProjet}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Available Topics"
        title="Subjects available for your promo"
        subtitle={`${validated.length} validated topic${validated.length !== 1 ? 's' : ''} to browse`}
      />

      {validated.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No validated subjects yet"
          hint="Check back after the administration approves new proposals."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {validated.map((subject) => {
            const isFull = (subject.groupsPfe?.length || 0) >= (subject.maxGrps || 1);
            return (
              <div
                key={subject.id}
                className={`rounded-2xl border p-5 transition-all duration-200 ${
                  isFull
                    ? 'border-edge bg-surface-200/50 opacity-70'
                    : 'border-edge bg-surface shadow-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-ink leading-snug">
                    {subject.titre_ar || subject.titre_en || `Subject #${subject.id}`}
                  </h3>
                </div>
                <p className="text-sm text-ink-secondary line-clamp-3 mb-4">
                  {subject.description_ar || subject.description_en || '—'}
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-ink-tertiary">
                    <span>by {getUserDisplayName(subject.enseignant?.user)}</span>
                    {subject.typeProjet && (
                      <span className="rounded-md bg-surface-200 px-2 py-0.5 capitalize font-medium">
                        {subject.typeProjet}
                      </span>
                    )}
                  </div>
                  <CapacityBar
                    used={subject.groupsPfe?.length || 0}
                    max={subject.maxGrps || 1}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GroupsOverviewStudent({ myGroup, loading, error, onRetry }) {
  const memberCount = myGroup?.groupMembers?.length || 0;
  
  return (
    <div className="space-y-4">
      <SectionHeader 
        eyebrow="PFE Groups" 
        title="My Group" 
        subtitle="Your assigned PFE group and members" 
      />

      {loading ? (
        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card space-y-3">
          <Shimmer className="h-5 w-2/3" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-3/4" />
        </div>
      ) : error ? (
        <ErrorBanner error={error} onRetry={onRetry} />
      ) : !myGroup ? (
        <EmptyState icon={Users} title="No group assigned" hint="You are not part of any group yet." />
      ) : (
        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {myGroup.nom_ar || myGroup.nom_en || `Group #${myGroup.id}`}
              </h3>
              <p className="mt-0.5 text-xs text-ink-tertiary">
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Active
            </span>
          </div>

          <div className="rounded-xl bg-surface-200/60 px-3 py-2.5 mb-3">
            <p className="text-xs font-medium text-ink-secondary mb-0.5">Assigned Subject</p>
            <p className="text-sm text-ink font-medium truncate">
              {myGroup.sujetFinal?.titre_ar || myGroup.sujetFinal?.titre_en || 'No subject assigned'}
            </p>
            {myGroup.sujetFinal?.enseignant?.user && (
              <p className="text-xs text-ink-tertiary mt-0.5">
                {getUserDisplayName(myGroup.sujetFinal.enseignant.user)}
              </p>
            )}
          </div>

          {memberCount > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-medium text-ink-secondary mb-2">Members</p>
              {myGroup.groupMembers.map((m, idx) => {
                // Backend payload nests user under etudiant: m.etudiant.user.
                // Older includes flattened to m.user, and admin-created rows
                // sometimes inline the fields on m. Try all three.
                const memberUser = m?.etudiant?.user || m?.user || m;
                const initial =
                  String(memberUser?.prenom || memberUser?.nom || '?').trim().charAt(0).toUpperCase() || '?';
                return (
                  <div key={idx} className="flex items-center gap-3 bg-surface-100 p-2 rounded-lg border border-edge-subtle">
                    <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-semibold text-brand">
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {getUserDisplayName(memberUser)}
                      </p>
                      <p className="text-xs text-ink-tertiary capitalize">
                        {m.role === 'chef_groupe' ? 'Group Leader' : 'Member'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DefensePanel({ myGroup }) {
  const jury = Array.isArray(myGroup?.pfeJury) ? myGroup.pfeJury : [];
  const hasJury = jury.length > 0;
  const isScheduled = !!myGroup?.dateSoutenance;

  if (!hasJury && !isScheduled) {
    return (
      <div className="space-y-4">
        <SectionHeader
          eyebrow="Defense Planning"
          title="Defense Schedule"
          subtitle="Oral defense sessions and jury assignments"
        />
        <EmptyState
          icon={CalendarDays}
          title="Defense planning not ready"
          hint="You will be able to see your defense schedule here once the administration validates it."
        />
      </div>
    );
  }

  const formatDefenseDate = (value) => {
    if (!value) return { date: '—', time: '' };
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return { date: '—', time: '' };
    return {
      date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };
  const parsed = formatDefenseDate(myGroup?.dateSoutenance);

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Defense Planning"
        title="Defense Schedule"
        subtitle="Oral defense sessions and jury assignments"
      />
      
      <div className="rounded-2xl border border-edge bg-surface shadow-card overflow-hidden">
        <div className="p-5 border-b border-edge bg-surface-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand/10 text-brand rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {isScheduled ? parsed.date : 'Not Scheduled Yet'}
              </p>
              <p className="text-xs text-ink-tertiary">
                {isScheduled ? `at ${parsed.time}` : 'Date and time pending'}
              </p>
            </div>
          </div>
          {myGroup?.salleSoutenance && (
             <div className="text-right">
                <p className="text-sm font-semibold text-ink">{myGroup.salleSoutenance}</p>
                <p className="text-xs text-ink-tertiary uppercase tracking-wider">Room</p>
             </div>
          )}
        </div>

        {hasJury && (
          <div className="p-5">
            <h3 className="text-sm font-bold text-ink mb-4">Jury Members</h3>
            <div className="space-y-3">
              {jury.map((member, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-edge-subtle bg-surface-100">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-surface-300 flex items-center justify-center text-xs font-bold text-ink">
                         {(member.enseignant?.user?.prenom?.[0] || '?').toUpperCase()}
                       </div>
                       <div>
                          <p className="text-sm font-medium text-ink">{member.enseignant?.user?.prenom} {member.enseignant?.user?.nom}</p>
                          <p className="text-xs text-ink-tertiary capitalize">{member.role}</p>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentPFE({
  activeTab,
  setActiveTab,
  subjects,
  groups,
  loading,
  error,
  user,
  retryActiveTab,
}) {
  const myGroup = useMemo(() => {
    return (Array.isArray(groups) ? groups : []).find(g => 
      g.groupMembers?.some(m => m.etudiantId === user?.etudiant?.id)
    );
  }, [groups, user]);

  const renderCenter = () => {
    if (activeTab === 'dashboard') {
      return (
        <StudentDashboardPanel
          subjects={subjects}
          myGroup={myGroup}
          loading={loading}
        />
      );
    }
    if (activeTab === 'subjects') {
      return (
        <StudentSubjectGallery
          subjects={subjects}
          loading={loading}
          error={error}
          onRetry={retryActiveTab}
          myGroup={myGroup}
          user={user}
        />
      );
    }
    if (activeTab === 'groups') {
      return (
        <GroupsOverviewStudent
          myGroup={myGroup}
          loading={loading}
          error={error}
          onRetry={retryActiveTab}
        />
      );
    }
    if (activeTab === 'defense') {
      return <DefensePanel myGroup={myGroup} />;
    }
    return null;
  };

  const tabCounts = {
    subjects: subjects.length || undefined,
    groups: myGroup ? 1 : undefined,
  };

  return (
    <div className="space-y-5 max-w-[1600px] min-w-0">
      <PageHeader role="etudiant" onRefresh={retryActiveTab} loading={loading} />

      <div className="lg:hidden overflow-x-auto">
        <div className="flex gap-1 rounded-2xl border border-edge bg-surface p-1.5 shadow-card w-max min-w-full">
          {STUDENT_TABS.map((tab) => {
            const { Icon } = tab;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive ? 'bg-brand text-surface shadow-sm' : 'text-ink-secondary hover:text-ink hover:bg-surface-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
        <div className="hidden lg:block lg:sticky lg:top-5">
          <LeftNav
            tabs={STUDENT_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={tabCounts}
          />
        </div>

        <main className="min-w-0">{renderCenter()}</main>
      </div>
    </div>
  );
}
