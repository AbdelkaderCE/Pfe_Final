import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { pfeAdminAPI } from '../../../services/pfe';

const ROLE_OPTIONS = [
  { value: 'examinateur', label: 'Examinateur' },
  { value: 'rapporteur', label: 'Rapporteur' },
];

const buildGroupLabel = (group) =>
  group?.nom || group?.nom_ar || group?.nom_en || `Group ${group?.id}`;

const buildSubjectLabel = (subject) =>
  subject?.titre || subject?.titre_ar || subject?.titre_en || `Subject ${subject?.id}`;

const buildPromoLabel = (promo) =>
  promo?.nom_ar || promo?.nom_en || promo?.nom || `Promo ${promo?.id}`;

const buildTeacherLabel = (teacher) =>
  `${teacher?.prenom || ''} ${teacher?.nom || ''}`.trim() || teacher?.email || 'Teacher';

const buildToast = (type, message) => ({ id: Date.now(), type, message });

const formatDateInput = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatTimeInput = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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

const resolveGroupPromoId = (group) =>
  group?.promoId || group?.promo?.id || group?.sujetFinal?.promoId || group?.sujetFinal?.promo?.id || null;

export default function JuryManagement({ groups, teachers, promos = [], onSaved }) {
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [search, setSearch] = useState('');
  const [presidentId, setPresidentId] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [memberRoles, setMemberRoles] = useState({});
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const selectedPromo = useMemo(
    () => promos.find((promo) => String(promo.id) === String(selectedPromoId)),
    [promos, selectedPromoId]
  );

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return groups.filter((group) => {
      if (selectedPromoId) {
        const promoId = resolveGroupPromoId(group);
        if (!promoId || String(promoId) !== String(selectedPromoId)) return false;
      }
      if (!term) return true;
      const subjectLabel = buildSubjectLabel(group?.sujetFinal);
      return [buildGroupLabel(group), subjectLabel]
        .some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [groups, search, selectedPromoId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === String(selectedGroupId)),
    [groups, selectedGroupId]
  );

  useEffect(() => {
    setSelectedGroupId('');
    setErrors((prev) => ({ ...prev, group: '', promo: '' }));
  }, [selectedPromoId]);

  useEffect(() => {
    if (!selectedGroup) {
      setPresidentId('');
      setMemberIds([]);
      setMemberRoles({});
      setDate('');
      setTime('');
      setRoom('');
      return;
    }

    const juryEntries = Array.isArray(selectedGroup.pfeJury) ? selectedGroup.pfeJury : [];
    const president = juryEntries.find((entry) => entry.role === 'president');
    const members = juryEntries.filter((entry) => entry.role !== 'president');

    setPresidentId(president?.enseignant?.id ? String(president.enseignant.id) : '');
    const ids = members.map((entry) => String(entry.enseignant?.id)).filter(Boolean);
    setMemberIds(ids);
    const roles = {};
    members.forEach((entry) => {
      if (entry?.enseignant?.id) roles[String(entry.enseignant.id)] = entry.role;
    });
    setMemberRoles(roles);

    setDate(formatDateInput(selectedGroup.dateSoutenance));
    setTime(formatTimeInput(selectedGroup.dateSoutenance));
    setRoom(selectedGroup.salleSoutenance || '');
  }, [selectedGroup]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const toggleMember = (id) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    const nextErrors = {};
    if (!selectedPromoId) nextErrors.promo = 'Select a promo.';
    if (!selectedGroupId) nextErrors.group = 'Select a group.';
    if (!presidentId) nextErrors.president = 'President is required.';
    if (memberIds.length === 0) nextErrors.members = 'Select at least one member.';
    if (!date || !time) nextErrors.date = 'Date and time are required.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const membersPayload = memberIds
        .filter((id) => String(id) !== String(presidentId))
        .map((id) => ({
          enseignantId: Number(id),
          role: memberRoles[id] || 'examinateur',
        }));

      await pfeAdminAPI.composeJury(Number(selectedGroupId), {
        presidentId: Number(presidentId),
        members: membersPayload,
        date,
        time,
        room: room.trim() || null,
      });

      setToast(buildToast('success', 'Jury composed successfully.'));
      onSaved?.();
    } catch (err) {
      setToast(buildToast('error', err?.message || 'Failed to assign jury.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Jury management</h2>
        <p className="text-xs text-ink-tertiary">Assign president and members with defense details.</p>
      </div>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5 space-y-4">
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Step 1 - Select promo</label>
            <select
              value={selectedPromoId}
              onChange={(event) => setSelectedPromoId(event.target.value)}
              className="w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Choose a promo</option>
              {promos.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {buildPromoLabel(promo)}
                </option>
              ))}
            </select>
            {errors.promo && <p className="text-xs text-rose-600">{errors.promo}</p>}
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Step 2 - Select group</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search group or subject"
              className="w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
            />
            <select
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
              disabled={!selectedPromoId}
              className="w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Choose a group</option>
              {filteredGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {buildGroupLabel(group)}
                </option>
              ))}
            </select>
            {!selectedPromoId && (
              <p className="text-xs text-ink-tertiary">Pick a promo to load its groups.</p>
            )}
            {errors.group && <p className="text-xs text-rose-600">{errors.group}</p>}
          </div>

          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Group details</p>
            <p className="text-sm text-ink">Name: {selectedGroup ? buildGroupLabel(selectedGroup) : '—'}</p>
            <p className="text-sm text-ink">Subject: {selectedGroup?.sujetFinal ? buildSubjectLabel(selectedGroup.sujetFinal) : '—'}</p>
            <p className="text-sm text-ink">Promo: {selectedPromo ? buildPromoLabel(selectedPromo) : '—'}</p>
            <div className="text-xs text-ink-tertiary">
              {(selectedGroup?.groupMembers || []).map((member) => (
                <div key={member.id || member.etudiantId}>
                  {member.etudiant?.user
                    ? `${member.etudiant.user.prenom || ''} ${member.etudiant.user.nom || ''}`.trim()
                    : 'Student'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 space-y-4">
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Step 3 - Assign jury</p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">President</label>
              <select
                value={presidentId}
                onChange={(event) => setPresidentId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Select president</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {buildTeacherLabel(teacher)}
                  </option>
                ))}
              </select>
              {errors.president && <p className="text-xs text-rose-600">{errors.president}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Members</label>
              {errors.members && <p className="text-xs text-rose-600">{errors.members}</p>}
              <div className="mt-2 max-h-[220px] overflow-auto rounded-xl border border-edge">
                <div className="divide-y divide-edge">
                  {teachers.map((teacher) => {
                    const id = String(teacher.id);
                    const isPresident = id === String(presidentId);
                    const isSelected = memberIds.includes(id);
                    return (
                      <div key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <label className="flex items-center gap-2 text-ink">
                          <input
                            type="checkbox"
                            disabled={isPresident}
                            checked={isSelected}
                            onChange={() => toggleMember(id)}
                            className="h-4 w-4"
                          />
                          {buildTeacherLabel(teacher)}
                          {isPresident && <span className="text-xs text-ink-tertiary">(president)</span>}
                        </label>
                        {isSelected && !isPresident && (
                          <select
                            value={memberRoles[id] || 'examinateur'}
                            onChange={(event) =>
                              setMemberRoles((prev) => ({ ...prev, [id]: event.target.value }))
                            }
                            className="rounded-lg border border-control-border bg-surface px-2 py-1 text-xs"
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Step 4 - Defense details</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Room</label>
                <input
                  type="text"
                  value={room}
                  onChange={(event) => setRoom(event.target.value)}
                  placeholder="Room A-12"
                  className="mt-2 w-full rounded-xl border border-control-border bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
            </div>
            {errors.date && <p className="text-xs text-rose-600">{errors.date}</p>}

            <button
              type="button"
              onClick={handleAssign}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Assign jury'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
