/*
  studentDashboard.js — Read-only role-scoped service for the student dashboard.

  All endpoints are constrained server-side to the authenticated student
  (see backend/src/modules/student/student-panel.service.ts -> resolveStudentContext).
  No filters or params are accepted that could widen access.
*/

import { studentPanelAPI } from './api';

export const studentDashboardService = {
  // Returns: { summary, recentAnnouncements, recentReclamations, modules, profile }
  // - profile: { userId, nom, prenom, email, telephone, photo, matricule, promo: { id, nom, section, anneeUniversitaire, specialite } }
  // - modules: [{ moduleId, moduleName, moduleCode }]
  getOverview: () => studentPanelAPI.getDashboard(),
};

export default studentDashboardService;
