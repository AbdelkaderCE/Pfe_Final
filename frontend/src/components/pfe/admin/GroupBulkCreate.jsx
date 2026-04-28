import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { pfeAdminAPI } from '../../../services/pfe';

const buildSubjectLabel = (subject) =>
  subject?.titre || subject?.titre_ar || subject?.titre_en || `Subject ${subject?.id}`;

const buildPromoLabel = (promo) =>
  promo?.nom_ar || promo?.nom_en || promo?.nom || `Promo ${promo?.id}`;

const buildModuleLabel = (module) => {
  const base = module?.nom || module?.nom_ar || module?.nom_en || `Module ${module?.id}`;
  const code = module?.code ? ` (${module.code})` : '';
  return `${base}${code}`;
};

const buildTeacherLabel = (teacher) =>
  `${teacher?.prenom || ''} ${teacher?.nom || ''}`.trim() || teacher?.email || 'Teacher';

const buildToast = (type, message) => ({ id: Date.now(), type, message });

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.type === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <span>{toast.message}</span>
        <button type="button" onClick={onClose} className="rounded-full px-2 text-xs font-semibold">
          Close
        </button>
      </div>
    </div>
  );
}

const resolveSubjectPromoId = (subject) => subject?.promoId || subject?.promo?.id || null;

export default function GroupBulkCreate({
  subjects,
  students,
  groups,
  teachers,
  promos = [],
  modules = [],
  onCreated,
}) {
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [leaderId, setLeaderId] = useState('');
  const [search, setSearch] = useState('');
  const [onlyUnassigned, setOnlyUnassigned] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [coEncadrantId, setCoEncadrantId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const selectedPromo = useMemo(
    () => promos.find((promo) => String(promo.id) === String(selectedPromoId)),
    [promos, selectedPromoId]
  );

  const promoSubjects = useMemo(() => {
    if (!selectedPromoId) return [];
    return subjects.filter((subject) => {
      if (subject?.status && subject.status !== 'valide') return false;
      const promoId = resolveSubjectPromoId(subject);
      return promoId && String(promoId) === String(selectedPromoId);
    });
  }, [subjects, selectedPromoId]);

  const selectedSubject = useMemo(
    () => promoSubjects.find((s) => String(s.id) === String(selectedSubjectId)),
    [promoSubjects, selectedSubjectId]
  );

  const assignedStudentIds = useMemo(() => {
    const ids = new Set();
    groups.forEach((group) => {
      (group.groupMembers || []).forEach((member) => {
        if (member?.etudiantId) ids.add(member.etudiantId);
        if (member?.etudiant?.id) ids.add(member.etudiant.id);
      });
    });
    return ids;
  }, [groups]);

  const filteredStudents = useMemo(() => {
    if (!selectedPromoId) return [];
    const promoId = Number(selectedPromoId);
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      if (!student.promoId || Number(student.promoId) !== promoId) {
        return false;
      }
      if (onlyUnassigned && assignedStudentIds.has(student.id)) {
        return false;
      }
      if (!term) return true;
      return [student.nom, student.prenom, student.email]
        .some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [students, selectedPromoId, search, onlyUnassigned, assignedStudentIds]);

  const selectedCount = selectedStudents.length;

  useEffect(() => {
    if (!selectedCount) {
      setLeaderId('');
      return;
    }
    if (!leaderId || !selectedStudents.includes(leaderId)) {
      setLeaderId(selectedStudents[0]);
    }
  }, [leaderId, selectedCount, selectedStudents]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setSelectedSubjectId('');
    setSelectedStudents([]);
    setLeaderId('');
    setSearch('');
  }, [selectedPromoId]);

  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const ids = filteredStudents.map((student) => student.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedStudents.includes(id));
    setSelectedStudents(allSelected ? [] : ids);
  };

  const maxGroups = selectedSubject?.maxGrps ?? selectedSubject?.max_grps ?? 1;
  const usedGroups = Array.isArray(selectedSubject?.groupsPfe) ? selectedSubject.groupsPfe.length : 0;

  const promoModules = useMemo(() => {
    if (!selectedPromoId) return [];
    const promoId = String(selectedPromoId);
    const promoSpecialiteId = selectedPromo?.specialiteId || selectedPromo?.specialite?.id || null;
    return modules.filter((module) => {
      if (promoSpecialiteId && module?.specialiteId) {
        return String(module.specialiteId) === String(promoSpecialiteId);
      }
      const modulePromoId = module?.promoId || module?.promo?.id || null;
      return modulePromoId ? String(modulePromoId) === promoId : false;
    });
  }, [modules, selectedPromo, selectedPromoId]);

  const handleCreateGroup = async () => {
    if (!selectedSubject) {
      setToast(buildToast('error', 'Please select a subject.'));
      return;
    }
    if (usedGroups >= maxGroups) {
      setToast(buildToast('error', 'Selected subject has reached max groups.'));
      return;
    }
    if (selectedStudents.length === 0) {
      setToast(buildToast('error', 'Select at least one student.'));
      return;
    }

    const leader = leaderId || selectedStudents[0];
    if (!leader) {
      setToast(buildToast('error', 'Select a group leader.'));
      return;
    }

    setSaving(true);
    try {
      const subjectLabel = buildSubjectLabel(selectedSubject);
      const fallbackName = `${subjectLabel} - Group`;
      const teacherFallback = selectedSubject?.enseignant?.id;
      const payload = {
        nom_ar: groupName.trim() || fallbackName,
        nom_en: groupName.trim() || fallbackName,
        sujetFinalId: Number(selectedSubject.id),
        coEncadrantId: coEncadrantId ? Number(coEncadrantId) : teacherFallback,
      };

      const created = await pfeAdminAPI.createGroup(payload);
      const groupId = created?.data?.id || created?.data?.group?.id;
      if (!groupId) {
        throw new Error('Group creation failed.');
      }

      for (const studentId of selectedStudents) {
        await pfeAdminAPI.addGroupMember(groupId, {
          etudiantId: Number(studentId),
          role: String(studentId) === String(leader) ? 'chef_groupe' : 'membre',
        });
      }

      setToast(buildToast('success', 'Group created successfully.'));
      setSelectedStudents([]);
      setGroupName('');
      setCoEncadrantId('');
      onCreated?.();
    } catch (err) {
      setToast(buildToast('error', err?.message || 'Failed to create group.'));
    } finally {
      setSaving(false);
    }
  };

  const subjectPromo = selectedPromo || selectedSubject?.promo || null;
  const canCreate = Boolean(selectedPromoId && selectedSubjectId && selectedStudents.length > 0) && !saving;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Create groups</h2>
          <p className="text-xs text-ink-tertiary">Bulk assign students to a subject in one action.</p>
        </div>
      </div>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Step 1 - Select promo</label>
              <select
                value={selectedPromoId}
                onChange={(event) => setSelectedPromoId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Select a promo</option>
                {promos.map((promo) => (
                  <option key={promo.id} value={promo.id}>
                    {buildPromoLabel(promo)}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-edge bg-surface-200 px-4 py-3 text-xs text-ink-secondary">
              <p className="font-semibold text-ink">Promo context</p>
              <p className="mt-1">Promo: {selectedPromo ? buildPromoLabel(selectedPromo) : 'Select a promo'}</p>
              <p>Modules: {selectedPromoId ? promoModules.length : '—'}</p>
              {selectedPromoId && promoModules.length > 0 && (
                <div className="mt-1 space-y-0.5 text-[11px] text-ink-tertiary">
                  {promoModules.slice(0, 4).map((module) => (
                    <div key={module.id}>{buildModuleLabel(module)}</div>
                  ))}
                  {promoModules.length > 4 && <div>+{promoModules.length - 4} more</div>}
                </div>
              )}
              {selectedPromoId && promoModules.length === 0 && (
                <p className="mt-1 text-[11px] text-ink-tertiary">No modules linked to this promo.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Step 2 - Select subject</label>
              <select
                value={selectedSubjectId}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
                disabled={!selectedPromoId}
                className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Select a subject</option>
                {promoSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {buildSubjectLabel(subject)}
                  </option>
                ))}
              </select>
              {!selectedPromoId && (
                <p className="mt-2 text-xs text-ink-tertiary">Choose a promo to load its subjects.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Group name</label>
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Optional group name"
                className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Co-supervisor</label>
              <select
                value={coEncadrantId}
                onChange={(event) => setCoEncadrantId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Use subject owner</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {buildTeacherLabel(teacher)}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-edge bg-surface-200 px-4 py-3 text-xs text-ink-secondary">
              <p className="font-semibold text-ink">Subject details</p>
              <p className="mt-1">Title: {selectedSubject ? buildSubjectLabel(selectedSubject) : 'Select a subject'}</p>
              <p>Promo: {subjectPromo ? buildPromoLabel(subjectPromo) : '—'}</p>
              <p>Groups: {selectedSubject ? `${usedGroups}/${maxGroups}` : '—'}</p>
            </div>

            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={!canCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creating...' : 'Create group'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Step 3 - Select students</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Students</p>
                <p className="text-xs text-ink-tertiary">Select students to include in the group.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={onlyUnassigned}
                    onChange={(event) => setOnlyUnassigned(event.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Only unassigned
                </label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or email"
                  className="rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-ink-tertiary">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.includes(s.id))}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5"
                />
                Select all ({filteredStudents.length})
              </label>
              <span>{selectedCount} selected</span>
            </div>

            <div className="max-h-[380px] overflow-auto rounded-xl border border-edge">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-200 text-ink-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Select</th>
                    <th className="px-3 py-2 text-left font-semibold">Name</th>
                    <th className="px-3 py-2 text-left font-semibold">Email</th>
                    <th className="px-3 py-2 text-left font-semibold">Leader</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge bg-surface">
                  {filteredStudents.map((student) => {
                    const isSelected = selectedStudents.includes(student.id);
                    const isAssigned = assignedStudentIds.has(student.id);
                    const isLeader = String(leaderId) === String(student.id);
                    return (
                      <tr key={student.id} className={isAssigned ? 'opacity-60' : ''}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudent(student.id)}
                            disabled={isAssigned}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-3 py-2 text-ink">
                          {`${student.prenom || ''} ${student.nom || ''}`.trim() || 'Student'}
                        </td>
                        <td className="px-3 py-2 text-ink-secondary">{student.email || '—'}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setLeaderId(student.id)}
                            disabled={!isSelected}
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${isLeader ? 'bg-brand text-white' : 'bg-surface-200 text-ink-tertiary'} ${!isSelected ? 'opacity-50' : ''}`}
                          >
                            {isLeader ? 'Leader' : 'Set'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-ink-tertiary">
                        No students available for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
