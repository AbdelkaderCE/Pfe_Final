/*
  teacherDashboard.js — PFE-only role-scoped service.

  The teacher in this product supervises PFE projects and nothing else: no
  courses, no groupes, no announcements, no reclamations. Endpoints below
  are enforced server-side (see backend/src/modules/teacher/teacher.service.ts —
  listTeacherStudents filters by PfeSujet.enseignantId / GroupPfe.coEncadrantId).
*/

import request from './api';
import { teacherPanelAPI } from './api';

const TEACHER_DASHBOARD_PATH = '/api/v1/teacher/dashboard';

export const teacherDashboardService = {
  // Returns: { summary, pfeBreakdown }
  getOverview: () => request(TEACHER_DASHBOARD_PATH),

  // Returns: { items: [{ id, matricule, nom, prenom, email, promo: { id, nom },
  //                      pfeGroup: { id, name, subjectTitle } | null }], pagination }
  // Server-side scope: only students in PFE groups supervised by this teacher.
  listStudents: ({ search, page, limit } = {}) =>
    teacherPanelAPI.getStudents({ search, page, limit }),

  // Open a disciplinary case for a student. Teacher can report their own
  // PFE-supervised students for misconduct.
  reportStudent: ({ studentId, reason, typeInfraction }) =>
    request('/api/v1/disciplinary/cases', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        reason,
        titre: 'Teacher disciplinary report',
        typeInfraction,
      }),
    }),

  // Discipline dossiers filed by this teacher (server-scoped to caller).
  getDisciplinaryCases: () =>
    request('/api/v1/disciplinary/dossiers-disciplinaires'),
};

export default teacherDashboardService;
