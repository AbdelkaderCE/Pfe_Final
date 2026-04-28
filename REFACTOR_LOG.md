# Refactor Log

Tracks every deletion, move, and structural change during the cleanup refactor.
Keep this file append-only per phase — do not rewrite history.

---

## Phase 1 — Safety net & inventory (✅ complete)

### Backups
- [backend/prisma/schema.prisma.pre-refactor.bak](backend/prisma/schema.prisma.pre-refactor.bak) — 943-line snapshot of the schema at refactor start.
- Existing [backend/prisma/schema.prisma.bak](backend/prisma/schema.prisma.bak) (102 lines, stale stub) — left in place, ignored.

### Decisions locked in (user-confirmed)
| Topic | Decision |
|---|---|
| Roles kept | `admin`, `enseignant`, `etudiant` |
| Migration | **Data-preserving.** Remap deprecated role rows → closest kept role. No destructive reset. |
| PFE module | **Kept.** All PFE permissions collapse into `admin`. |
| Discipline | Kept. `president_conseil` / `membre_conseil` drop from role table; become **per-meeting assignments** on teachers (already modeled via `MembreConseil.role` enum). |
| Pace | Phase-by-phase with review between phases. |

### Role inventory (from [backend/prisma/seed.ts](backend/prisma/seed.ts#L13-L23))

| Role | Action | Remap target |
|---|---|---|
| `admin` | **KEEP** | — |
| `enseignant` | **KEEP** | — |
| `etudiant` | **KEEP** | — |
| `admin_faculte` | DELETE | → `admin` |
| `vice_doyen` (referenced in code, not seeded) | DELETE | → `admin` |
| `chef_departement` | DELETE | → `admin` |
| `chef_specialite` | DELETE | → `admin` |
| `delegue` | DELETE | → `etudiant` |
| `president_conseil` | DELETE | → `enseignant` |
| `membre_conseil` (referenced, not seeded) | DELETE | → `enseignant` |
| `assignment_manager` (frontend only) | DELETE | n/a (no DB rows) |

### Schema observations

- Role storage is a **flexible `Role` table** (not a Postgres enum). Migration = `DELETE FROM roles WHERE nom IN (…)` after remapping `user_roles` rows. No schema change needed on the role tables themselves.
- **No existing models** for: messages, notifications, calendar, alerts. Those are backend-module + controller code only — deleting the modules wipes the features cleanly.
- Discipline already has the full model set: `ConseilDisciplinaire`, `MembreConseil` (with `RoleConseil` enum: `president|rapporteur|membre`), `DossierDisciplinaire`, `Infraction`, `Decision`. Reused as-is.

### Feature → deletion targets

#### Messages (entire feature out)
Backend:
- [backend/src/modules/messages/](backend/src/modules/messages/) — `routes/message.routes.ts`, `services/message.service.ts`
- [backend/src/controllers/messages/message.controller.ts](backend/src/controllers/messages/message.controller.ts)
- Mount point in [backend/src/app.ts](backend/src/app.ts) — remove
- Any realtime emit calls for messages in [backend/src/realtime/socket.server.ts](backend/src/realtime/socket.server.ts)

Frontend:
- [frontend/src/pages/MessagesPage.jsx](frontend/src/pages/MessagesPage.jsx)
- Sidebar entry in [frontend/src/layouts/DashboardLayout.jsx](frontend/src/layouts/DashboardLayout.jsx)
- Route in [frontend/src/App.jsx](frontend/src/App.jsx#L37,L136)
- Any `messages`-related functions in [frontend/src/services/api.js](frontend/src/services/api.js) and [frontend/src/services/realtime.js](frontend/src/services/realtime.js)

#### Notifications (old system out, replaced by Alert in Phase 4)
Backend:
- [backend/src/modules/notifications/routes/notification.routes.ts](backend/src/modules/notifications/routes/notification.routes.ts)
- [backend/src/controllers/notifications/notification.controller.ts](backend/src/controllers/notifications/notification.controller.ts)
- [backend/src/services/common/notification.service.ts](backend/src/services/common/notification.service.ts)
- Mount point in [backend/src/app.ts](backend/src/app.ts) — remove
- Realtime emit calls in [backend/src/realtime/socket.server.ts](backend/src/realtime/socket.server.ts)

Frontend:
- [frontend/src/pages/NotificationsPage.jsx](frontend/src/pages/NotificationsPage.jsx)
- Bell/badge components under [frontend/src/components/layout/](frontend/src/components/layout/) (scan in Phase 2)
- Sidebar + topbar entries in [frontend/src/layouts/DashboardLayout.jsx](frontend/src/layouts/DashboardLayout.jsx)
- Route in [frontend/src/App.jsx](frontend/src/App.jsx#L38,L137)
- `notifications` functions in [frontend/src/services/api.js](frontend/src/services/api.js) and [frontend/src/services/realtime.js](frontend/src/services/realtime.js)

#### Calendar (entire feature out)
Backend: none in schema. Scan controllers/services for any calendar logic.
Frontend:
- [frontend/src/pages/CalendarPage.jsx](frontend/src/pages/CalendarPage.jsx)
- Sidebar entry + route in [frontend/src/App.jsx](frontend/src/App.jsx#L30,L134)

### Role-specific frontend folders to delete (Phase 3)

Pages — [frontend/src/pages/](frontend/src/pages/):
- `AssignmentManager/` · `CommitteeMember/` · `CommitteePresident/` · `Delegate/` · `DepartmentChef/` · `FacultyAdmin/` · `SpecialiteChef/` · `SuperAdmin/`

Routes — [frontend/src/routes/](frontend/src/routes/):
- `AssignmentManagerRoutes.jsx` · `CommitteeMemberRoutes.jsx` · `CommitteePresidentRoutes.jsx` · `DelegateRoutes.jsx` · `DepartmentChefRoutes.jsx` · `FacultyAdminRoutes.jsx` · `SpecialiteChefRoutes.jsx` · `SuperAdminRoutes.jsx`
- **Keep** `StudentRoutes.jsx` · `TeacherRoutes.jsx` · `PrivateRoute.jsx`

Feature components — [frontend/src/components/features/](frontend/src/components/features/):
- `assignment-manager/` · `committee-member/` · `committee-president/` · `delegate/` · `department-chef/` · `faculty-admin/` · `specialite-chef/` · `super-admin/`
- **Keep** `home/` · `news/` · `about/` · `contact/` · `auth/` · `teacher/`

Layouts — [frontend/src/layouts/](frontend/src/layouts/):
- Keep `AdminLayout.jsx`, `TeacherLayout.jsx`, `StudentLayout.jsx`, `DashboardLayout.jsx` (review in Phase 5)

### Backend files with deprecated-role references (need edit, not delete)

From `grep (vice_doyen|admin_faculte|chef_departement|chef_specialite|delegue|membre_conseil|president_conseil|assignment_manager)`:

- [backend/src/services/common/rbac.service.ts](backend/src/services/common/rbac.service.ts)
- [backend/src/services/auth/auth.service.ts](backend/src/services/auth/auth.service.ts)
- [backend/src/modules/student/services/student-panel.service.ts](backend/src/modules/student/services/student-panel.service.ts)
- [backend/src/modules/student/routes/student.routes.ts](backend/src/modules/student/routes/student.routes.ts)
- [backend/src/modules/settings/routes/site-settings.routes.ts](backend/src/modules/settings/routes/site-settings.routes.ts)
- [backend/src/modules/requests/routes/request.routes.ts](backend/src/modules/requests/routes/request.routes.ts)
- [backend/src/modules/pfe/routes/pfe.routes.ts](backend/src/modules/pfe/routes/pfe.routes.ts)
- [backend/src/modules/pfe/routes/group-management.routes.ts](backend/src/modules/pfe/routes/group-management.routes.ts)
- [backend/src/modules/documents/routes/documents.routes.ts](backend/src/modules/documents/routes/documents.routes.ts)
- [backend/src/modules/discipline/routes/discipline.routes.ts](backend/src/modules/discipline/routes/discipline.routes.ts)
- [backend/src/modules/dashboard/routes/teacher-dashboard.routes.ts](backend/src/modules/dashboard/routes/teacher-dashboard.routes.ts)
- [backend/src/modules/auth/routes/auth.routes.ts](backend/src/modules/auth/routes/auth.routes.ts)
- [backend/src/modules/ai/routes/ai.routes.ts](backend/src/modules/ai/routes/ai.routes.ts)
- [backend/src/modules/affectation/routes/affectation.routes.ts](backend/src/modules/affectation/routes/affectation.routes.ts)
- [backend/src/modules/admin/services/admin.service.ts](backend/src/modules/admin/services/admin.service.ts)
- [backend/src/modules/admin/routes/admin.routes.ts](backend/src/modules/admin/routes/admin.routes.ts)
- [backend/src/controllers/requests/request.controller.ts](backend/src/controllers/requests/request.controller.ts)
- [backend/src/controllers/documents/documents.controller.ts](backend/src/controllers/documents/documents.controller.ts)
- [backend/prisma/seed.ts](backend/prisma/seed.ts)

### Frontend files with deprecated-role references (need edit)

- [frontend/src/App.jsx](frontend/src/App.jsx)
- [frontend/src/layouts/DashboardLayout.jsx](frontend/src/layouts/DashboardLayout.jsx)
- [frontend/src/pages/RequestsPage.jsx](frontend/src/pages/RequestsPage.jsx)
- [frontend/src/pages/ProfilePage.jsx](frontend/src/pages/ProfilePage.jsx)
- [frontend/src/pages/DocumentsPage.jsx](frontend/src/pages/DocumentsPage.jsx)
- [frontend/src/pages/DisciplinaryCasesPage.jsx](frontend/src/pages/DisciplinaryCasesPage.jsx)
- [frontend/src/pages/AdminUsersPage.jsx](frontend/src/pages/AdminUsersPage.jsx)
- [frontend/src/pages/AdminUsersListPage.jsx](frontend/src/pages/AdminUsersListPage.jsx)
- [frontend/src/pages/AdminPanelPage.jsx](frontend/src/pages/AdminPanelPage.jsx)
- [frontend/src/pages/AdminAcademicManagementPage.jsx](frontend/src/pages/AdminAcademicManagementPage.jsx)
- [frontend/src/pages/AdminAcademicAssignmentsPage.jsx](frontend/src/pages/AdminAcademicAssignmentsPage.jsx)
- [frontend/src/components/admin/UserRegistrationForm.jsx](frontend/src/components/admin/UserRegistrationForm.jsx)
- [frontend/src/components/admin/StaffManagementTable.jsx](frontend/src/components/admin/StaffManagementTable.jsx)

### Migration plan (to run in Phase 3)

```sql
-- 1. Remap user_roles rows to kept roles
UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE nom='admin')
  WHERE role_id IN (SELECT id FROM roles WHERE nom IN
    ('admin_faculte','vice_doyen','chef_departement','chef_specialite'));

UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE nom='enseignant')
  WHERE role_id IN (SELECT id FROM roles WHERE nom IN
    ('president_conseil','membre_conseil'));

UPDATE user_roles SET role_id = (SELECT id FROM roles WHERE nom='etudiant')
  WHERE role_id IN (SELECT id FROM roles WHERE nom='delegue');

-- 2. Drop duplicate user_role rows created by the remap
DELETE FROM user_roles a USING user_roles b
  WHERE a.id > b.id AND a.user_id=b.user_id AND a.role_id=b.role_id;

-- 3. Cascade-clean role_permissions, then delete the dead roles
DELETE FROM role_permissions WHERE role_id IN
  (SELECT id FROM roles WHERE nom IN
    ('admin_faculte','vice_doyen','chef_departement','chef_specialite',
     'delegue','president_conseil','membre_conseil'));

DELETE FROM roles WHERE nom IN
  ('admin_faculte','vice_doyen','chef_departement','chef_specialite',
   'delegue','president_conseil','membre_conseil');
```

This will be packaged as a Prisma migration in Phase 3.

---

## Phase 2 — Feature removal (messages / notifications / calendar) (✅ complete)

### Deleted (directories + files)
**Backend:**
- `backend/src/modules/messages/` (routes + services)
- `backend/src/modules/notifications/` (routes)
- `backend/src/controllers/messages/message.controller.ts`
- `backend/src/controllers/notifications/notification.controller.ts`
- `backend/src/services/common/notification.service.ts`
- `backend/src/realtime/` (entire folder — `socket.server.ts`; Socket.IO server was only serving notification push/unread-count events; Alert system replacing it will be polling-based)

**Frontend:**
- `frontend/src/pages/MessagesPage.jsx`
- `frontend/src/pages/NotificationsPage.jsx`
- `frontend/src/pages/CalendarPage.jsx`
- `frontend/src/services/realtime.js`

### Edited
- `backend/src/app.ts` — dropped `notificationRoutes`, `messageRoutes` imports + mount points (`/api/v1/notifications`, `/api/v1/messages`).
- `backend/src/server.ts` — dropped `initializeRealtimeServer` bootstrap.
- `backend/src/services/index.ts` — dropped `notification.service` re-export.
- `backend/src/modules/teacher/services/teacher.service.ts` — removed `createNotification` import, `notifyStudentsForAnnouncement` helper (48 LoC), 2 call sites, and the reclamation-status-updated notification inside `updateTeacherReclamationStatus`.
- `backend/src/modules/student/services/student-panel.service.ts` — removed `createNotification`/`getUnreadCount` imports, `notifyAdminsOfReclamation` helper (40 LoC) + its call site, and the `unreadNotifications` field from the dashboard summary.
- `backend/src/controllers/requests/request.controller.ts` — removed `createNotification` import, `getRelatedTeacherUserIds`, `getAdminUserIds`, `notifyRequestDecision` helpers (~120 LoC total) and 4 call sites (reclamation create, justification create, reclamation decision, justification decision).
- `frontend/src/App.jsx` — dropped `CalendarPage`/`MessagesPage`/`NotificationsPage` imports and 3 routes (`/dashboard/calendar`, `/dashboard/messages`, `/dashboard/notifications`).
- `frontend/src/layouts/DashboardLayout.jsx` — dropped 3 sidebar entries (calendar/messages/notifications), `notificationsAPI.getUnreadCount` badge polling, and the entire `connectNotificationsSocket` effect.
- `frontend/src/design-system/components/navigation/Sidebar.jsx` — dropped 3 icon entries and 3 section labels.
- `frontend/src/design-system/components/navigation/Topbar.jsx` — dropped 3 page-title entries.
- `frontend/src/pages/SettingsPage.jsx` — removed `/dashboard/calendar` from the start-page option list. (The "Notifications preferences" section of user settings is preference-toggle UI only — local state, no backend — left for Phase 6 polish.)
- `frontend/src/services/api.js` — removed `notificationsAPI` and `messagesAPI` exports (~37 LoC).
- `frontend/src/pages/dashboard/student/StudentDashboard.jsx` — removed `notificationsAPI` import, `notifications` tab, 4 state hooks, `loadNotifications` callback + effect, 2 mark-as-read handlers, `unreadCount`/`visibleNotifications` memos, the Unread KPI tile, and the 78-line notifications panel render block.
- `frontend/src/pages/dashboard/teacher/TeacherDashboard.jsx` — same excision pattern as student dashboard (imports, tab, state, effects, handlers, memos, Unread Notifications KPI, 72-line render block).

### Left for later phases (intentional scope boundaries)
- `docs/API_CONTRACT.md` still documents `/dashboard/calendar|messages|notifications` routes — stale doc, will be swept in Phase 7.
- `CLEANUP_RECOMMENDATIONS.md` and the original `REFACTOR_LOG.md` Phase 1 inventory reference the deleted files — intentional history, not rewritten.
- `SettingsPage.jsx` retains notification-preference toggles (email/push/news/deadline). Pure client state, no backend wiring left — cleaner to strip alongside the wider Settings revamp in Phase 6.
- Stale `backend/tsconfig.tsbuildinfo` cache — auto-regenerates on next build.

### Verification sweep
Grepped the whole repo (excl. node_modules): **no live code references remain** to `notificationsAPI`, `messagesAPI`, `connectNotificationsSocket`, `CalendarPage`, `MessagesPage`, `NotificationsPage`, `notifyRequestDecision`, `notifyAdminsOfReclamation`, `notifyStudentsForAnnouncement`, `createNotification`, `notification.service`, `realtime/socket`, or `initializeRealtimeServer`. Route-pattern sweep also clean outside docs.

### Impact notes
- Student dashboard summary no longer returns `unreadNotifications` — the student/teacher frontend dashboards have been updated to match.
- No database schema changes in this phase (feature removal only). The unused rows in any historical notification tables — if they exist — will be captured in Phase 3's migration cleanup.

---

## Phase 3 — Delete extra roles + migration — pending
## Phase 4 — New Alert system — pending
## Phase 5 — Admin dashboard redesign — pending
## Phase 6 — Code-quality cleanup + structure reorg — pending
## Phase 7 — Final deliverables doc — pending

---

## Phase 4 — New Alert system (🚧 in progress)

### Iteration 1 — UI wiring + admin management surface (✅ complete)

#### Confirmed existing backend foundation
- `backend/src/modules/alerts/routes/alerts.routes.ts` already exposes:
  - `GET /api/v1/alerts/active` (authenticated users)
  - full admin CRUD (`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`)
- `backend/src/services/alerts/alerts.service.ts` already handles:
  - audience filtering by core role (`all|etudiants|enseignants|admins`)
  - active-window filtering (`startsAt` / `endsAt`)
  - level support (`info|warning|critical`)

#### Added
- `frontend/src/pages/AdminAlertsPage.jsx`
  - Admin alert center for create/edit/delete/activate/deactivate.
  - Supports title, message, audience, level, optional start/end schedule, active flag.
  - Includes alert table with status, schedule window, creator, and row actions.

#### Edited
- `frontend/src/App.jsx`
  - Added protected route: `/dashboard/admin/alerts`.
- `frontend/src/layouts/DashboardLayout.jsx`
  - Added `AlertBanner` mount at the top of dashboard content so active alerts are shown to users.
  - Added admin navigation module for alerts (`nav.alerts`).
  - Added quick action in admin home panel: **Open Alert Center**.
- `frontend/src/design-system/components/navigation/Sidebar.jsx`
  - Added icon + section mapping for `/dashboard/admin/alerts`.
- `frontend/src/design-system/components/navigation/Topbar.jsx`
  - Added page-title mapping for `/dashboard/admin/alerts`.
- i18n:
  - `frontend/src/i18n/locales/en.json` → `nav.alerts: "Alerts"`
  - `frontend/src/i18n/locales/fr.json` → `nav.alerts: "Alertes"`
  - `frontend/src/i18n/locales/ar.json` → `nav.alerts: "التنبيهات"`

#### Verification
- Static diagnostics for all changed files: **no new errors**.
- Frontend production build: `npm run build` ✅ successful.
- Build reports existing ESLint warnings in unrelated files (pre-existing cleanup backlog), no blocking errors.
