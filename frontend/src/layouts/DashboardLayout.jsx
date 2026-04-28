/*
  Intent: University staff/students navigating academic modules.
          Shell stays fixed — sidebar + topbar frame the workspace.
          Content scrolls independently. Feels like a well-organized office.
  Palette: canvas bg throughout — sidebar is NOT a different world.
  Depth: border-edge separates sidebar/topbar from content. No heavy shadows on shell.
  Surfaces: canvas (base) for shell, surface (white) for content cards within.
  Typography: Inter. Subheading in topbar, labels in sidebar.
  Spacing: 4px base.
*/

import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../design-system/components/navigation/Sidebar';
import Topbar from '../design-system/components/navigation/Topbar';
import TeacherDashboard from '../pages/TeacherDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import { DisciplinaryAlertProvider } from '../contexts/DisciplinaryAlertContext';
import request from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { hasAnyPermission, hasAnyRole } from '../utils/rbac';

/* ── 10 Modules ─────────────────────────────────────────────── */
const ALL_MODULES = [
  { nameKey: 'nav.dashboard', path: '/dashboard', roles: ['etudiant', 'enseignant'] },
  { nameKey: 'nav.actualites', path: '/dashboard/actualites', roles: ['etudiant', 'enseignant', 'admin'] },
  { nameKey: 'nav.pfeWorkspace', path: '/dashboard/pfe-workspace', roles: ['etudiant', 'enseignant', 'admin'] },
  { nameKey: 'nav.documents', path: '/dashboard/documents', roles: ['enseignant', 'admin'] },
  { nameKey: 'nav.remiseCopies', path: '/dashboard/remise-copies', roles: ['enseignant', 'admin'] },
  {
    nameKey: 'nav.disciplinary',
    path: '/dashboard/disciplinary',
    roles: ['enseignant', 'admin', 'etudiant'],
    permissions: ['reclamations:manage:global'],
  },
  {
    nameKey: 'nav.requests',
    path: '/dashboard/requests',
    roles: ['etudiant', 'admin'],
  },
  { nameKey: 'nav.specialiteChoice', path: '/dashboard/specialite-choice', roles: ['etudiant'] },
  { nameKey: 'nav.myModules', path: '/dashboard/student/my-modules', roles: ['etudiant'] },
  { nameKey: 'nav.myModules', path: '/dashboard/teacher/my-modules', roles: ['enseignant', 'teacher'] },
  { nameKey: 'nav.history', path: '/dashboard/student/history', roles: ['etudiant'] },
  { nameKey: 'nav.history', path: '/dashboard/teacher/history', roles: ['enseignant', 'teacher'] },
  { nameKey: 'nav.settings', path: '/dashboard/settings', roles: ['etudiant', 'enseignant', 'admin'] },
  { nameKey: 'nav.support', path: '/dashboard/support', roles: ['etudiant', 'enseignant'] },
  { nameKey: 'nav.adminHub', path: '/admin', roles: ['admin'], permissions: ['users:manage'] },
  { nameKey: 'nav.analytics', path: '/dashboard/admin/analytics', roles: ['admin'], permissions: ['users:manage'] },
  { nameKey: 'nav.userManagement', path: '/dashboard/admin/users', roles: ['admin'], permissions: ['users:manage'] },
  { nameKey: 'nav.academicStructure', path: '/dashboard/admin/academic/management', roles: ['admin'], permissions: ['departments:manage', 'specialites:manage'] },
  { nameKey: 'nav.academicAssignments', path: '/dashboard/admin/academic/assignments', roles: ['admin'], permissions: ['users:manage', 'roles:assign'] },
  { nameKey: 'nav.siteConfiguration', path: '/dashboard/admin/site-settings', roles: ['admin'], permissions: ['users:manage'] },
  { nameKey: 'nav.userHistory', path: '/dashboard/admin/history', roles: ['admin'], permissions: ['users:manage'] },
  { nameKey: 'nav.affectationCampaigns', path: '/dashboard/admin/affectation', roles: ['admin'], permissions: ['users:manage'] },
];

const ADMIN_REQUEST_ROLES = ['admin'];
const STUDENT_REQUEST_ROLES = ['etudiant'];
const PENDING_REQUEST_STATUSES = new Set([
  'submitted',
  'under-review',
  'under_review',
  'info-requested',
  'soumise',
  'soumis',
  'en-cours',
  'en_cours',
  'en-attente',
  'en_attente',
  'en-verification',
  'en_verification',
]);

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function countPendingItems(rows) {
  if (!Array.isArray(rows)) {
    return 0;
  }

  return rows.reduce((count, row) => {
    const status = normalizeStatus(row?.status);
    if (PENDING_REQUEST_STATUSES.has(status)) {
      return count + 1;
    }
    return count;
  }, 0);
}

function extractPendingFromStudentResponse(payload) {
  const pendingFromStats = Number(payload?.stats?.pending);
  if (Number.isFinite(pendingFromStats) && pendingFromStats >= 0) {
    return pendingFromStats;
  }

  return countPendingItems(payload?.data);
}

function sameBadgeMap(currentMap, nextMap) {
  const currentKeys = Object.keys(currentMap);
  const nextKeys = Object.keys(nextMap);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => currentMap[key] === nextMap[key]);
}

/* Map DB roles to the UI role token used by children (student | teacher | admin) */
function uiRole(roles) {
  if (!roles || !roles.length) return 'student';
  const arr = Array.isArray(roles) ? roles : [roles];
  const upper = arr.map((r) => (r || '').toUpperCase());
  if (upper.some((r) => r === 'ADMIN')) return 'admin';
  if (upper.some((r) => ['TEACHER', 'ENSEIGNANT'].includes(r))) return 'teacher';
  return 'student';
}

function dashboardHomeByRoles(roles, coreRole) {
  const normalizedCoreRole = String(coreRole || '').toLowerCase();
  if (normalizedCoreRole === 'etudiant') return 'student';
  if (normalizedCoreRole === 'enseignant') return 'teacher';
  if (normalizedCoreRole === 'admin') return 'admin';

  if (!roles || !roles.length) return 'student';
  const arr = Array.isArray(roles) ? roles : [roles];
  const normalized = arr.map((r) => String(r || '').toLowerCase());

  if (normalized.some((r) => ['etudiant', 'student'].includes(r))) return 'student';
  if (normalized.some((r) => ['enseignant', 'teacher'].includes(r))) return 'teacher';
  return 'admin';
}

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moduleBadges, setModuleBadges] = useState({});

  /* Derive activeKey from the current URL */
  const activeKey = location.pathname.startsWith('/dashboard/discipline/')
    ? '/dashboard/disciplinary'
    : location.pathname;

  const role = uiRole(user?.roles);
  const defaultHome = dashboardHomeByRoles(user?.roles, user?.coreRole);
  const roleSignature = Array.isArray(user?.roles)
    ? user.roles.map((roleName) => String(roleName || '').toLowerCase()).sort().join('|')
    : '';

  useEffect(() => {
    let cancelled = false;
    let adminInboxUnauthorized = false;

    if (!user?.id) {
      setModuleBadges({});
      return undefined;
    }

    const roleList = Array.isArray(user.roles)
      ? user.roles.map((roleName) => String(roleName || '').toLowerCase())
      : [];

    const hasAdminRequestsAccess = roleList.some((roleName) => ADMIN_REQUEST_ROLES.includes(roleName));
    const hasStudentRequestsAccess = roleList.some((roleName) => STUDENT_REQUEST_ROLES.includes(roleName));

    const refreshBadges = async () => {
      const nextBadges = {};

      try {
        let pendingRequests = 0;

        if (hasAdminRequestsAccess && !adminInboxUnauthorized) {
          const inboxResponse = await request('/api/v1/requests/admin/inbox');
          pendingRequests = countPendingItems(inboxResponse?.data);
        } else if (hasStudentRequestsAccess) {
          const [reclamationsResponse, justificationsResponse] = await Promise.all([
            request('/api/v1/requests/reclamations'),
            request('/api/v1/requests/justifications'),
          ]);

          pendingRequests =
            extractPendingFromStudentResponse(reclamationsResponse) +
            extractPendingFromStudentResponse(justificationsResponse);
        }

        if (pendingRequests > 0) {
          nextBadges['/dashboard/requests'] = pendingRequests;
        }
      } catch (error) {
        if (hasAdminRequestsAccess && (error?.status === 401 || error?.status === 403)) {
          adminInboxUnauthorized = true;
        }
        // Silent fail: some roles do not have access to request inbox endpoints.
      }

      if (!cancelled) {
        setModuleBadges((current) => (sameBadgeMap(current, nextBadges) ? current : nextBadges));
      }
    };

    refreshBadges();
    const intervalId = window.setInterval(refreshBadges, 45000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.id, user?.roles, roleSignature]);

  /* Filter modules by the user's actual DB roles and resolve translated names */
  const visibleModules = ALL_MODULES
    .filter((module) => {
      if (!user) return false;

      const roleAllowed = Array.isArray(module.roles) && module.roles.length > 0
        ? hasAnyRole(user, module.roles)
        : false;

      const permissionAllowed = Array.isArray(module.permissions) && module.permissions.length > 0
        ? hasAnyPermission(user, module.permissions)
        : false;

      if (Array.isArray(module.roles) && module.roles.length > 0 && Array.isArray(module.permissions) && module.permissions.length > 0) {
        return roleAllowed || permissionAllowed;
      }

      if (Array.isArray(module.roles) && module.roles.length > 0) {
        return roleAllowed;
      }

      if (Array.isArray(module.permissions) && module.permissions.length > 0) {
        return permissionAllowed;
      }

      return true;
    })
    .map((m) => ({
      ...m,
      name: t(m.nameKey),
      badgeCount: moduleBadges[m.path] ?? 0,
    }));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /* Navigate to the clicked module path */
  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-canvas overflow-hidden">
      {/* Sidebar — same canvas bg, separated by border only */}
      <Sidebar
        modules={visibleModules}
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        activeKey={activeKey}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
      />

      {/* Right column: topbar + content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          role={role}
          user={user}
          onLogout={handleLogout}
          onHamburger={() => setSidebarOpen(true)}
          onNavigate={handleNavigate}
          activeKey={activeKey}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <DisciplinaryAlertProvider>
            {children
              ? React.Children.map(children, (child) =>
                  React.isValidElement(child) ? React.cloneElement(child, { role }) : child
                )
              : (defaultHome === 'student'
                  ? <StudentDashboard role={role} />
                  : defaultHome === 'teacher'
                    ? <TeacherDashboard role={role} />
                    : <Navigate to="/admin" replace />)
            }
          </DisciplinaryAlertProvider>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

