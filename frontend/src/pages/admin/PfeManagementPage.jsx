import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  Gavel,
  Loader2,
  Users,
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { pfeAdminAPI } from '../../services/pfe';
import PFEConfigCard from '../../components/pfe/admin/PFEConfigCard';
import GroupBulkCreate from '../../components/pfe/admin/GroupBulkCreate';
import JuryManagement from '../../components/pfe/admin/JuryManagement';

const SUBJECT_STATUS_CLASS = {
  propose: 'bg-amber-100 text-amber-800 border border-amber-200',
  valide: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  reserve: 'bg-blue-100 text-blue-800 border border-blue-200',
  affecte: 'bg-violet-100 text-violet-800 border border-violet-200',
  rejete: 'bg-rose-100 text-rose-800 border border-rose-200',
};


const TABS = [
  { id: 'subjects', label: 'Subjects', Icon: GraduationCap },
  { id: 'groups', label: 'Groups', Icon: Users },
  { id: 'jury', label: 'Jury', Icon: Gavel },
];

const DEFAULT_SUBJECT_FORM = {
  titre: '',
  description: '',
  enseignantId: '',
  promoId: '',
  type_projet: 'application',
  max_grps: 1,
};

const normalizeRoles = (roles) =>
  Array.isArray(roles)
    ? roles.map((role) => String(role || '').toLowerCase())
    : [];

const getErrorMessage = (error, fallback) => {
  if (error && typeof error === 'object' && 'message' in error && error.message) {
    return String(error.message);
  }
  return fallback;
};

const getStatusClass = (status, map) => map[status] || 'bg-slate-100 text-slate-700 border border-slate-200';

const userLabel = (user) => `${user?.prenom || ''} ${user?.nom || ''} (${user?.email || 'no-email'})`.trim();

const promoLabel = (promo) => promo?.nom_ar || promo?.nom_en || promo?.nom || `Promo ${promo?.id}`;

const subjectLabel = (subject) => subject?.titre || subject?.titre_ar || subject?.titre_en || `Sujet ${subject?.id}`;

const groupLabel = (group) => group?.nom || group?.nom_ar || group?.nom_en || `Groupe ${group?.id}`;

export default function PfeManagementPage() {
  const [activeTab, setActiveTab] = useState('subjects');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [jury, setJury] = useState([]);

  const [promos, setPromos] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignmentStudents, setAssignmentStudents] = useState([]);
  const [assignmentTeachers, setAssignmentTeachers] = useState([]);

  const [subjectForm, setSubjectForm] = useState(DEFAULT_SUBJECT_FORM);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const teachers = useMemo(() => {
    if (assignmentTeachers.length > 0) return assignmentTeachers;
    return users
      .filter((user) => normalizeRoles(user.roles).includes('enseignant'))
      .map((user) => ({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      }));
  }, [assignmentTeachers, users]);

  const students = useMemo(() => {
    if (assignmentStudents.length > 0) return assignmentStudents;
    return users
      .filter((user) => normalizeRoles(user.roles).includes('etudiant'))
      .map((user) => ({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        promoId: null,
        promoLabel: null,
      }));
  }, [assignmentStudents, users]);

  const pendingSubjects = useMemo(
    () => subjects.filter((subject) => subject.status === 'propose').length,
    [subjects]
  );

  const refreshData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    const requests = await Promise.allSettled([
      pfeAdminAPI.listSujets(),
      pfeAdminAPI.listGroups(),
      pfeAdminAPI.listJury(),
      authAPI.adminGetUsers(),
      authAPI.adminGetAcademicOptions(),
      authAPI.adminGetAcademicAssignments(),
    ]);

    const [subjectsRes, groupsRes, juryRes, usersRes, optionsRes, assignmentsRes] = requests;

    if (subjectsRes.status === 'fulfilled') {
      setSubjects(Array.isArray(subjectsRes.value?.data) ? subjectsRes.value.data : []);
    }

    if (groupsRes.status === 'fulfilled') {
      setGroups(Array.isArray(groupsRes.value?.data) ? groupsRes.value.data : []);
    }

    if (juryRes.status === 'fulfilled') {
      setJury(Array.isArray(juryRes.value?.data) ? juryRes.value.data : []);
    }

    if (usersRes.status === 'fulfilled') {
      setUsers(Array.isArray(usersRes.value?.data) ? usersRes.value.data : []);
    }

    const optionsPromos = optionsRes.status === 'fulfilled' && Array.isArray(optionsRes.value?.data?.promos)
      ? optionsRes.value.data.promos
      : null;
    const optionsModules = optionsRes.status === 'fulfilled' && Array.isArray(optionsRes.value?.data?.modules)
      ? optionsRes.value.data.modules
      : null;

    if (optionsPromos) {
      setPromos(optionsPromos);
    }
    if (optionsModules) {
      setModules(optionsModules);
    }

    if (assignmentsRes.status === 'fulfilled') {
      const payload = assignmentsRes.value?.data || {};
      setAssignmentStudents(Array.isArray(payload.students) ? payload.students : []);
      setAssignmentTeachers(Array.isArray(payload.teachers) ? payload.teachers : []);
      if (!optionsPromos && Array.isArray(payload.promos)) {
        setPromos(payload.promos);
      }
      if (!optionsModules && Array.isArray(payload.modules)) {
        setModules(payload.modules);
      }
    }

    const failedCount = requests.filter((entry) => entry.status === 'rejected').length;
    if (failedCount > 0) {
      setError(`Some resources failed to load (${failedCount}/${requests.length}).`);
    }

    if (silent) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const runAction = useCallback(
    async (action, successMessage, fallbackError) => {
      setBusy(true);
      setSuccess('');
      setError('');

      try {
        await action();
        setSuccess(successMessage);
        await refreshData(true);
      } catch (actionError) {
        setError(getErrorMessage(actionError, fallbackError));
      } finally {
        setBusy(false);
      }
    },
    [refreshData]
  );

  const handleCreateSubject = async (event) => {
    event.preventDefault();

    if (!subjectForm.titre.trim() || !subjectForm.description.trim()) {
      setError('Subject title and description are required.');
      return;
    }

    if (!subjectForm.enseignantId || !subjectForm.promoId) {
      setError('Please select a teacher and a promo.');
      return;
    }

    await runAction(
      () =>
        pfeAdminAPI.createSujet({
          titre: subjectForm.titre.trim(),
          description: subjectForm.description.trim(),
          enseignantId: Number(subjectForm.enseignantId),
          promoId: Number(subjectForm.promoId),
          type_projet: subjectForm.type_projet,
          max_grps: Number(subjectForm.max_grps) || 1,
        }),
      'Subject created successfully.',
      'Failed to create subject.'
    );

    setSubjectForm(DEFAULT_SUBJECT_FORM);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">Administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">PFE Management Hub</h1>
            <p className="mt-2 max-w-3xl text-sm text-ink-secondary">
              Create, assign, and supervise end-of-studies projects from a single admin workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refreshData(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-control-border bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition hover:border-edge-strong hover:bg-surface-200"
              disabled={refreshing || busy}
            >
              <Loader2 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-ink-tertiary">Subjects</p>
          <p className="mt-2 text-2xl font-bold text-ink">{subjects.length}</p>
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-ink-tertiary">Groups</p>
          <p className="mt-2 text-2xl font-bold text-ink">{groups.length}</p>
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-ink-tertiary">Pending subjects</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{pendingSubjects}</p>
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-ink-tertiary">Jury assignments</p>
          <p className="mt-2 text-2xl font-bold text-ink">{jury.length}</p>
        </div>
      </section>

      {(error || success) && (
        <section className="space-y-2">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}
        </section>
      )}

      <PFEConfigCard />

      <section className="rounded-3xl border border-edge bg-surface p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-edge-subtle pb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-brand text-white'
                  : 'bg-surface-200 text-ink-secondary hover:bg-surface-300'
              }`}
            >
              <tab.Icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateSubject} className="grid grid-cols-1 gap-3 rounded-2xl border border-edge bg-surface-200 p-4 md:grid-cols-2 xl:grid-cols-3">
              <input
                className="rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                placeholder="Subject title"
                value={subjectForm.titre}
                onChange={(event) => setSubjectForm((prev) => ({ ...prev, titre: event.target.value }))}
              />
              <select
                className="rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                value={subjectForm.enseignantId}
                onChange={(event) => setSubjectForm((prev) => ({ ...prev, enseignantId: event.target.value }))}
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {userLabel(teacher)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                value={subjectForm.promoId}
                onChange={(event) => setSubjectForm((prev) => ({ ...prev, promoId: event.target.value }))}
              >
                <option value="">Select promo</option>
                {promos.map((promo) => (
                  <option key={promo.id} value={promo.id}>
                    {promoLabel(promo)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                value={subjectForm.type_projet}
                onChange={(event) => setSubjectForm((prev) => ({ ...prev, type_projet: event.target.value }))}
              >
                <option value="application">application</option>
                <option value="recherche">recherche</option>
                <option value="etude">etude</option>
                <option value="innovation">innovation</option>
              </select>
              <input
                type="number"
                min={1}
                className="rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                placeholder="Max groups"
                value={subjectForm.max_grps}
                onChange={(event) =>
                  setSubjectForm((prev) => ({
                    ...prev,
                    max_grps: Number(event.target.value) || 1,
                  }))
                }
              />
              <button
                type="submit"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
                disabled={busy}
              >
                Create subject
              </button>
              <textarea
                className="md:col-span-2 xl:col-span-3 rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                rows={3}
                placeholder="Subject description"
                value={subjectForm.description}
                onChange={(event) => setSubjectForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </form>

            <div className="overflow-x-auto rounded-2xl border border-edge">
              <table className="min-w-full divide-y divide-edge text-sm">
                <thead className="bg-surface-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-ink-secondary">Title</th>
                    <th className="px-3 py-2 text-left font-semibold text-ink-secondary">Teacher</th>
                    <th className="px-3 py-2 text-left font-semibold text-ink-secondary">Promo</th>
                    <th className="px-3 py-2 text-left font-semibold text-ink-secondary">Status</th>
                    <th className="px-3 py-2 text-right font-semibold text-ink-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge bg-surface">
                  {subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-ink">{subjectLabel(subject)}</p>
                        <p className="text-xs text-ink-tertiary line-clamp-1">{subject.description || subject.description_ar || '-'}</p>
                      </td>
                      <td className="px-3 py-2 text-ink-secondary">
                        {subject.enseignant?.user
                          ? userLabel(subject.enseignant.user)
                          : (subject.enseignant || '-')}
                      </td>
                      <td className="px-3 py-2 text-ink-secondary">
                        {subject.promo ? promoLabel(subject.promo) : (subject.promo || '-')}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(subject.status, SUBJECT_STATUS_CLASS)}`}>
                          {subject.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          {subject.status === 'propose' && (
                            <>
                              <button
                                type="button"
                                onClick={() => runAction(() => pfeAdminAPI.validateSujet(subject.id), 'Subject validated.', 'Validation failed.')}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                                disabled={busy}
                              >
                                Validate
                              </button>
                              <button
                                type="button"
                                onClick={() => runAction(() => pfeAdminAPI.rejectSujet(subject.id), 'Subject rejected.', 'Rejection failed.')}
                                className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-500"
                                disabled={busy}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => runAction(() => pfeAdminAPI.deleteSujet(subject.id), 'Subject deleted.', 'Delete failed.')}
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-500"
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <GroupBulkCreate
              subjects={subjects}
              students={students}
              groups={groups}
              teachers={teachers}
              promos={promos}
              modules={modules}
              onCreated={() => refreshData(true)}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {groups.map((group) => (
                <article key={group.id} className="rounded-2xl border border-edge bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink">{groupLabel(group)}</h3>
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">
                    Subject: {group.sujetFinal ? subjectLabel(group.sujetFinal) : 'Not assigned'}
                  </p>
                  <p className="text-sm text-ink-secondary">
                    Supervisor: {group.coEncadrant?.user ? userLabel(group.coEncadrant.user) : '—'}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-ink">
                    {(group.groupMembers || []).map((member) => (
                      <li key={`${group.id}-${member.id || member.etudiantId}`}>
                        {member.etudiant?.user
                          ? `${member.etudiant.user.prenom || ''} ${member.etudiant.user.nom || ''}`.trim()
                          : 'Student'}
                        <span className="text-xs text-ink-tertiary"> ({member.role})</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jury' && (
          <div className="space-y-6">
            <JuryManagement
              groups={groups}
              teachers={teachers}
              promos={promos}
              onSaved={() => refreshData(true)}
            />
          </div>
        )}
      </section>

      <footer className="rounded-2xl border border-edge bg-surface-200 p-4 text-xs text-ink-tertiary">
        <p className="font-semibold text-ink-secondary">Admin-only workflow</p>
        <p className="mt-1">
          PFE creation, assignment, and jury actions are managed from this hub under admin permissions only.
        </p>
      </footer>
    </div>
  );
}
