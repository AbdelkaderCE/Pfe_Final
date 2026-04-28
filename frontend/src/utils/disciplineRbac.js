/*
  Discipline-specific RBAC helpers.

  All checks are derived from the user object returned by /auth/me, which now
  includes `memberships: [{ conseilId, role }]` for users with an enseignant
  profile. These helpers are the single source of truth for what the UI shows
  vs. what it hides — they MUST agree with the backend route guards.

  Roles:
    - admin       : full access. Creates meetings, manages members and dossiers.
    - enseignant  : can report. Cannot create/edit meetings or dossiers.
                    May gain decision/finalisation rights ONLY if member of a
                    specific conseil with role 'president'.
    - etudiant    : no access to any disciplinary surface.
*/

import { hasAnyRole, resolveCoreRole } from './rbac';

const ADMIN_ROLES = ['admin'];
const TEACHER_ROLES = ['enseignant'];
const REPORTER_ROLES = ['enseignant', 'admin'];

function getMemberships(user) {
  if (!user || !Array.isArray(user.memberships)) return [];
  return user.memberships;
}

export function isAdmin(user) {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function isTeacher(user) {
  return hasAnyRole(user, TEACHER_ROLES);
}

/* ── Reporting (teacher OR admin) ─────────────────────────────── */

export function canReport(user) {
  return hasAnyRole(user, REPORTER_ROLES);
}

export function canViewMyReports(user) {
  return hasAnyRole(user, REPORTER_ROLES);
}

/* ── Admin-only operations ────────────────────────────────────── */

export function canViewAdminPanel(user) {
  return isAdmin(user);
}

export function canCreateMeeting(user) {
  return isAdmin(user);
}

export function canManageMembers(user) {
  return isAdmin(user);
}

export function canManageDossier(user) {
  return isAdmin(user);
}

export function canBrowseAllCases(user) {
  return isAdmin(user);
}

/* ── Membership-bound checks (per conseil) ────────────────────── */

export function isMemberOf(user, conseilId) {
  if (conseilId == null) return false;
  const target = Number(conseilId);
  return getMemberships(user).some((m) => Number(m.conseilId) === target);
}

export function isPresidentOf(user, conseilId) {
  if (conseilId == null) return false;
  const target = Number(conseilId);
  return getMemberships(user).some(
    (m) => Number(m.conseilId) === target && m.role === 'president'
  );
}

/* ── Meeting access ──────────────────────────────────────────────
   Admin can view any meeting. Teachers can view a meeting only if
   they are a member of that specific conseil.                     */

export function canAccessMeeting(user, conseilId) {
  if (isAdmin(user)) return true;
  return isMemberOf(user, conseilId);
}

/* ── Decision rights (president-of-this-conseil only) ──────────── */

export function canMakeDecision(user, conseilId) {
  return isPresidentOf(user, conseilId);
}

export function canValidateMeeting(user, conseilId) {
  return isPresidentOf(user, conseilId);
}

/* ── Convenience: which landing page should a user start on? ───── */

export function defaultDisciplineLanding(user) {
  if (isAdmin(user)) return '/dashboard/discipline/admin';
  if (isTeacher(user)) return '/dashboard/discipline/report';
  return '/unauthorized';
}

/* ── Re-export for ergonomics in components ────────────────────── */

export { resolveCoreRole };
