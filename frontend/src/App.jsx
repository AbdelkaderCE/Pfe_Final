import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

/* ── Public (guest-accessible) pages ── */
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ActualitesPage from './pages/ActualitesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import RequestsPage from './pages/RequestsPage';
import PublicLayout from './components/public/PublicLayout';

/* ── Auth pages ── */
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

/* ── Protected (requires login) ── */
import DashboardLayout from './layouts/DashboardLayout';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import ProfilePage from './pages/ProfilePage';
import DisciplinaryCasesPage from './pages/DisciplinaryCasesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUsersListPage from './pages/AdminUsersListPage';
import UniversalHistoryPage from './pages/admin/UniversalHistoryPage';
import AdminPanelPage from './pages/AdminPanelPage';
import AdminAcademicManagementPage from './pages/AdminAcademicManagementPage';
import AdminAcademicAssignmentsPage from './pages/AdminAcademicAssignmentsPage';
import AdminSiteSettingsPage from './pages/AdminSiteSettingsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import DocumentsPage from './pages/DocumentsPage';
import RemiseCopie from './pages/RemiseCopie';
import StudentNotesPage from './pages/StudentNotesPage';
import StudentSpecialiteChoicePage from './pages/StudentSpecialiteChoicePage';
import TeacherMyModulesPage from './pages/Teacher/MyModules';
import StudentMyModulesPage from './pages/Student/MyModules';
import AdminGroupsPage from './pages/admin/Groups';
import AdminAffectationPage from './pages/admin/AdminAffectationPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminUserStatsPage from './pages/admin/AdminUserStatsPage';
import StudentHistoryPage from './pages/StudentHistoryPage';
import TeacherHistoryPage from './pages/TeacherHistoryPage';
import AdminHistoryPage from './pages/AdminHistoryPage';
import ProjectsPage from './pages/PFE/ProjectsPage';
import SubjectsPage from './pages/PFE/SubjectsPage';
import GroupsPage from './pages/PFE/GroupsPage';
import DefensePage from './pages/PFE/DefensePage';
import PFEWorkspacePage from './pages/PFE/PFEWorkspacePage';

/* ── Misc ── */
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import AIChatbot from './components/ai/AIChatbot';
import ComponentShowcase from './pages/ComponentShowcase';

function hasAdminRole(user) {
  if (!Array.isArray(user?.roles)) {
    return false;
  }

  return user.roles.some((roleName) => String(roleName || '').toLowerCase() === 'admin');
}

function DisciplinaryLandingRedirect() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles.map(r => String(r || '').toLowerCase()) : [];
  const isAdmin = roles.includes('admin');
  const isStudent = roles.some(r => ['etudiant', 'student'].includes(r));
  const targetPath = isAdmin
    ? '/dashboard/discipline/admin'
    : isStudent
    ? '/dashboard/discipline/student'
    : '/dashboard/discipline/report';

  return <Navigate to={targetPath} replace />;
}

function TeacherDisciplinaryView() {
  return <DisciplinaryCasesPage role="teacher" />;
}

function AdminDisciplinaryView() {
  return <DisciplinaryCasesPage role="admin" />;
}

function LoginOverlayRedirect() {
  const location = useLocation();
  return <Navigate to="/home?login=1" replace state={location.state} />;
}

function ForgotPasswordOverlayRedirect() {
  const location = useLocation();
  return <Navigate to="/home?forgot=1" replace state={location.state} />;
}


const AI_CHAT_HIDDEN_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/change-password',
  '/reset-password',
]);

function GatedAIChatbot() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) return null;
  if (AI_CHAT_HIDDEN_PATHS.has(location.pathname)) return null;
  return <AIChatbot />;
}

function PresidentDisciplinaryView() {
  return <DisciplinaryCasesPage role="president" />;
}

function App() {
  const { i18n } = useTranslation();

  /* Keep document dir & lang in sync with the active language */
  useEffect(() => {
    const lang = i18n.language?.substring(0, 2) || 'fr';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <div className="min-h-full">
              <Routes>
              {/* ── Public / Guest routes (PublicLayout: navbar + footer, no sidebar) ── */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/actualites" element={<PublicLayout contained><ActualitesPage role="guest" /></PublicLayout>} />
              <Route path="/announcements" element={<PublicLayout contained><AnnouncementsPage /></PublicLayout>} />
              <Route path="/requests" element={<PublicLayout contained><RequestsPage role="guest" /></PublicLayout>} />

              {/* ── Auth routes (standalone — no sidebar, no navbar) ── */}
              <Route path="/login" element={<LoginOverlayRedirect />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordOverlayRedirect />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* ── Component Showcase (for documentation/reports) ── */}
              <Route path="/showcase" element={<ComponentShowcase />} />

              {/* ── Protected routes (DashboardLayout: sidebar + topbar) ── */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/support" element={<ProtectedRoute><DashboardLayout><SupportPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
              <Route
                path="/dashboard/disciplinary"
                element={
                  <ProtectedRoute allowedRoles={['enseignant', 'admin', 'etudiant', 'student']}>
                    <DashboardLayout><DisciplinaryLandingRedirect /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/discipline/report"
                element={
                  <ProtectedRoute allowedRoles={['enseignant']}>
                    <DashboardLayout><TeacherDisciplinaryView /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/discipline/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardLayout><AdminDisciplinaryView /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/discipline/president"
                element={
                  <ProtectedRoute
                    allowedRoles={['enseignant']}
                    accessFn={(user) => Array.isArray(user?.memberships) && user.memberships.some((m) => String(m?.role || '').toLowerCase() === 'president')}
                  >
                    <DashboardLayout><PresidentDisciplinaryView /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/discipline/student"
                element={
                  <ProtectedRoute allowedRoles={['etudiant', 'student']}>
                    <DashboardLayout><DisciplinaryCasesPage role="student" /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard/actualites" element={<ProtectedRoute><DashboardLayout><ActualitesPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/announcements" element={<ProtectedRoute><DashboardLayout><AnnouncementsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/ai" element={<ProtectedRoute><DashboardLayout><AIAssistantPage /></DashboardLayout></ProtectedRoute>} />
              <Route
                path="/dashboard/documents"
                element={
                  <ProtectedRoute allowedRoles={['enseignant', 'admin']}>
                    <DashboardLayout><DocumentsPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/remise-copies"
                element={
                  <ProtectedRoute allowedRoles={['enseignant', 'admin']}>
                    <DashboardLayout><RemiseCopie /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard/projects" element={<ProtectedRoute><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/projects/subjects" element={<ProtectedRoute><DashboardLayout><SubjectsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/projects/groups" element={<ProtectedRoute><DashboardLayout><GroupsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/projects/defense" element={<ProtectedRoute><DashboardLayout><DefensePage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/pfe-workspace" element={<ProtectedRoute><DashboardLayout><PFEWorkspacePage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/notes" element={<ProtectedRoute><DashboardLayout><StudentNotesPage /></DashboardLayout></ProtectedRoute>} />
              <Route
                path="/dashboard/specialite-choice"
                element={
                  <ProtectedRoute allowedRoles={['etudiant', 'student']}>
                    <DashboardLayout><StudentSpecialiteChoicePage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/requests"
                element={
                  <ProtectedRoute allowedRoles={['etudiant', 'student', 'admin']}>
                    <DashboardLayout><RequestsPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['users:manage']}
                    accessMode="any"
                  >
                    <DashboardLayout><AdminPanelPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['users:manage']}
                    accessMode="any"
                  >
                    <Navigate to="/admin" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/users"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['users:manage']}
                    accessMode="any"
                  >
                    <DashboardLayout><AdminUsersPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/users/:userId/history"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['users:manage']}
                    accessMode="any"
                  >
                    <DashboardLayout><UniversalHistoryPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/users/list-create"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['roles:assign']}
                    accessMode="any"
                  >
                    <DashboardLayout><AdminUsersListPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/academic/management"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['departments:manage', 'specialites:manage']}
                    accessMode="any"
                  >
                    <DashboardLayout><AdminAcademicManagementPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/academic/assignments"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['users:manage', 'roles:assign']}
                    accessMode="any"
                  >
                    <DashboardLayout><AdminAcademicAssignmentsPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/affectation"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardLayout><AdminAffectationPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['users:manage']} accessMode="any">
                    <DashboardLayout><AdminAnalyticsPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/user/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['users:manage']} accessMode="any">
                    <DashboardLayout><AdminUserStatsPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/site-settings"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                    requiredPermissions={['users:manage']}
                    accessMode="any"
                  >
                    <DashboardLayout><AdminSiteSettingsPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/pfe"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin']}
                  >
                    <Navigate to="/dashboard/pfe-workspace" replace />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard/admin/groups" element={<ProtectedRoute><DashboardLayout><AdminGroupsPage /></DashboardLayout></ProtectedRoute>} />
              <Route
                path="/dashboard/student/history"
                element={
                  <ProtectedRoute allowedRoles={['etudiant', 'student']}>
                    <DashboardLayout><StudentHistoryPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/teacher/history"
                element={
                  <ProtectedRoute allowedRoles={['enseignant', 'teacher']}>
                    <DashboardLayout><TeacherHistoryPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/teacher/my-modules"
                element={
                  <ProtectedRoute allowedRoles={['enseignant', 'teacher']}>
                    <DashboardLayout><TeacherMyModulesPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/student/my-modules"
                element={
                  <ProtectedRoute allowedRoles={['etudiant', 'student']}>
                    <DashboardLayout><StudentMyModulesPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/history"
                element={
                  <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['users:manage']} accessMode="any">
                    <DashboardLayout><AdminHistoryPage /></DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ── Error pages ── */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <GatedAIChatbot />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </SiteSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
