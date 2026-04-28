import React, { useMemo } from 'react';
import { BookOpen, Users, CalendarDays, CheckCircle2 } from 'lucide-react';
import {
  SectionHeader,
  Shimmer,
  EmptyState,
  ErrorBanner,
  CapacityBar,
  getUserDisplayName,
  LeftNav,
  PageHeader,
} from './SharedPFEUI';

const STUDENT_TABS = [
  { id: 'subjects', label: 'Available Subjects', Icon: BookOpen, hint: 'Browse topics' },
  { id: 'groups', label: 'My Group', Icon: Users, hint: 'Your PFE group' },
  { id: 'defense', label: 'Defense Info', Icon: CalendarDays, hint: 'Defense details' },
];

function StudentSubjectGallery({ subjects, loading, error, onRetry, myGroup }) {
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
              {myGroup.groupMembers.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-surface-100 p-2 rounded-lg border border-edge-subtle">
                   <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-semibold text-brand">
                     {(m?.user?.prenom?.[0] || m?.prenom?.[0] || '?').toUpperCase()}
                   </div>
                   <div>
                     <p className="text-sm font-medium text-ink">
                       {getUserDisplayName(m?.user || m)}
                     </p>
                     <p className="text-xs text-ink-tertiary capitalize">
                       {m.role === 'chef_groupe' ? 'Group Leader' : 'Member'}
                     </p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DefensePanel() {
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
    if (activeTab === 'subjects') {
      return (
        <StudentSubjectGallery
          subjects={subjects}
          loading={loading}
          error={error}
          onRetry={retryActiveTab}
          myGroup={myGroup}
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
      return <DefensePanel />;
    }
    return null;
  };

  const tabCounts = {
    subjects: subjects.length || undefined,
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
