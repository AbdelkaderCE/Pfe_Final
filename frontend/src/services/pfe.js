import request from './api';

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';
  const query = new URLSearchParams();
  entries.forEach(([key, value]) => query.set(key, String(value)));
  return `?${query.toString()}`;
}

// ── Student PFE API ──────────────────────────────────────────
export const pfeAPI = {
  // Browse available PFE subjects (real-time from DB — no fallback)
  listSubjects: (params = {}) => request(`/api/v1/pfe/me/subjects${buildQuery(params)}`),

  // Get authenticated student's current PFE group + chosen subject
  getMyGroup: () => request('/api/v1/pfe/me/group'),

  // Get upcoming deadlines for the student's group
  getMyDeadlines: () => request('/api/v1/pfe/me/deadlines'),

  // Get the student's PFE grade (only available when finalized)
  getMyGrade: () => request('/api/v1/pfe/me/grade'),

  // Select (or change) a PFE subject — persists to DB
  selectSubject: (sujetId) =>
    request('/api/v1/pfe/me/select-subject', {
      method: 'POST',
      body: JSON.stringify({ sujetId }),
    }),
};

// ── Admin/Teacher PFE API ────────────────────────────────────
export const pfeAdminAPI = {
  listSujets: (params = {}) => request(`/api/v1/pfe/sujets${buildQuery(params)}`),

  createSujet: (payload) =>
    request('/api/v1/pfe/sujets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSujet: (subjectId, payload) =>
    request(`/api/v1/pfe/sujets/${subjectId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteSujet: (subjectId) =>
    request(`/api/v1/pfe/sujets/${subjectId}`, { method: 'DELETE' }),

  validateSujet: (subjectId) =>
    request(`/api/v1/pfe/sujets/${subjectId}/valider`, { method: 'PUT' }),

  rejectSujet: (subjectId) =>
    request(`/api/v1/pfe/sujets/${subjectId}/refuser`, { method: 'PUT' }),

  listGroups: () => request('/api/v1/pfe/groupes'),

  createGroup: (payload) =>
    request('/api/v1/pfe/groupes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteGroup: (groupId) =>
    request(`/api/v1/pfe/groupes/${groupId}`, { method: 'DELETE' }),

  addGroupMember: (groupId, payload) =>
    request(`/api/v1/pfe/groupes/${groupId}/membres`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listChoices: () => request('/api/v1/pfe/voeux'),

  createChoice: (payload) =>
    request('/api/v1/pfe/voeux', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateChoiceStatus: (choiceId, status) =>
    request(`/api/v1/pfe/voeux/${choiceId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  deleteChoice: (choiceId) =>
    request(`/api/v1/pfe/voeux/${choiceId}`, { method: 'DELETE' }),

  listJury: () => request('/api/v1/pfe/jury'),

  addJuryMember: (payload) =>
    request('/api/v1/pfe/jury', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateJuryRole: (juryId, role) =>
    request(`/api/v1/pfe/jury/${juryId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  deleteJuryMember: (juryId) =>
    request(`/api/v1/pfe/jury/${juryId}`, { method: 'DELETE' }),

  // ── Submission lock (admin) ──────────────────────────────────
  // Read is open to any authenticated user (to gray out the create button
  // on the teacher side); writes are admin-only on the backend.
  getSubmissionFlag: () => request('/api/v1/pfe/admin/config/submission'),
  setSubmissionFlag: (isSubmissionOpen) =>
    request('/api/v1/pfe/admin/config/submission', {
      method: 'PUT',
      body: JSON.stringify({ isSubmissionOpen: !!isSubmissionOpen }),
    }),

  // ── Student catalog visibility lock (admin) ──────────────────
  getStudentVisibilityFlag: () => request('/api/v1/pfe/admin/config/student-visibility'),
  setStudentVisibilityFlag: (isStudentVisibilityOpen) =>
    request('/api/v1/pfe/admin/config/student-visibility', {
      method: 'PUT',
      body: JSON.stringify({ isStudentVisibilityOpen: !!isStudentVisibilityOpen }),
    }),

  // Bundled snapshot of every PFE config flag (admin UI uses this so it
  // doesn't have to chain N round-trips to learn the global state).
  getConfigSnapshot: () => request('/api/v1/pfe/admin/config'),

  // ── Soutenance scheduling (admin) ────────────────────────────
  scheduleSoutenance: (groupId, payload) =>
    request(`/api/v1/pfe/groupes/${groupId}/soutenance`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Compose the entire jury for a group in one call (president + members
  // + optional date/room). Replaces any existing jury for the group.
  composeJury: (groupId, payload) =>
    request(`/api/v1/pfe/admin/groups/${groupId}/jury/compose`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // ── Teacher's own jury assignments + remaining-quota indicator ───
  myJuryAssignments: () => request('/api/v1/pfe/jury/me'),
  myTeacherQuota: () => request('/api/v1/pfe/teacher/quota'),

  // ── Bulk config update (admin) ─────────────────────────────────
  // Send a partial map of config keys (e.g. { submissionOpen: true, maxSubjectsPerTeacher: 5 })
  updateConfig: (payload) =>
    request('/api/v1/pfe/admin/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // ── Teacher's allowed promos (for subject creation promo dropdown) ─
  getTeacherPromos: (enseignantId) =>
    request(`/api/v1/pfe/teacher/${enseignantId}/promos`),
};

export default pfeAPI;
