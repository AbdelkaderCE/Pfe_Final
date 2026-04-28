# Project Cleanup Recommendations

## Files & Folders to Delete

### ⚠️ CRITICAL: Root Level

#### 1. **"Attacherd follder (will be deleted no needed)/" folder**
- **Status:** Clearly marked for deletion
- **Content:** Contains DocumentsPage.jsx and other debris
- **Action:** DELETE ENTIRE FOLDER
- **Safety:** LOW — intentionally marked for deletion

---

### 📁 PAGES TO DELETE (frontend/src/pages/)

#### 2. **Staff Management Related**
- `AdminAcademicManagementPage.jsx` (187 lines)
- `AdminAcademicAssignmentsPage.jsx` (310 lines)
- `AdminUsersPage.jsx`
- `AdminUsersListPage.jsx`
- **Reason:** Duplicate/placeholder admin pages; functionality exists in AdminPanelPage.jsx
- **Status:** Can be replaced with central admin interface
- **Safety:** MEDIUM — verify these aren't used in routes first

#### 3. **Attendance/Calendar Related**
- `CalendarPage.jsx` (817 lines)
- **Reason:** Large placeholder for feature; could be simplified or removed
- **Status:** Teacher/Student functionality; attendance tracking may be elsewhere
- **Safety:** HIGH — check if actively used in Teacher/Student routes

#### 4. **Assignment Management Pages**
- **Folder:** `AssignmentManager/` (7 files)
  - Dashboard.jsx
  - GroupAssignment.jsx
  - Profile.jsx
  - ProjectAssignment.jsx
  - Reports.jsx
  - Students.jsx
  - index.js
- **Reason:** Incomplete role-specific module
- **Status:** Placeholder for Group 3 (PFE) functionality
- **Safety:** HIGH — likely replaced by PFE module

#### 5. **Role-Specific Dashboard Folders** (Placeholder Implementations)
These appear to be skeleton implementations replaced by main dashboards:

**a) `CommitteeMember/` folder (6 files)**
- Dashboard.jsx, Cases.jsx, Hearings.jsx, Decisions.jsx, Documents.jsx, Profile.jsx
- **Reason:** Unused disciplinary council role implementation
- **Status:** Placeholder; may be integrated elsewhere
- **Safety:** MEDIUM — verify not in active routes

**b) `CommitteePresident/` folder**
- Similar structure to CommitteeMember
- **Status:** Placeholder
- **Safety:** MEDIUM

**c) `Delegate/` folder (6 files)**
- Attendance.jsx, Complaints.jsx, Dashboard.jsx, GroupManagement.jsx, Profile.jsx
- **Status:** Placeholder for Student Delegate role
- **Safety:** HIGH — check if still needed

**d) `DepartmentChef/` folder (8 files)**
- Budget.jsx, Dashboard.jsx, DepartmentManagement.jsx, Profile.jsx, Reports.jsx, Specialites.jsx, Teachers.jsx
- **Status:** Placeholder with partial implementation
- **Safety:** MEDIUM — check routes

**e) `FacultyAdmin/` folder (8 files)**
- Dashboard.jsx, Departments.jsx, Profile.jsx, Reports.jsx, Settings.jsx, Specialites.jsx, Users.jsx
- **Status:** Placeholder
- **Safety:** MEDIUM

**f) `SpecialiteChef/` folder**
- Similar structure
- **Status:** Placeholder
- **Safety:** MEDIUM

**g) `Student/` folder**
- Check if duplicates StudentDashboard.jsx or StudentNotesPage.jsx
- **Status:** Likely redundant
- **Safety:** HIGH

**h) `SuperAdmin/` folder**
- Likely duplicates AdminPanelPage.jsx functionality
- **Status:** Placeholder
- **Safety:** MEDIUM

**i) `Teacher/` folder**
- Check if duplicates TeacherDashboard.jsx
- **Status:** Likely redundant
- **Safety:** HIGH

---

### 🔀 ROUTE FILES TO DELETE (frontend/src/routes/)

#### 6. **Unused Route Files** (Placeholder Implementations)
These are "Coming Soon" placeholders:

- `DepartmentChefRoutes.jsx` — Shows "Coming Soon" placeholder (confirmed)
- `AssignmentManagerRoutes.jsx` — Likely placeholder
- `CommitteeMemberRoutes.jsx` — Likely placeholder
- `CommitteePresidentRoutes.jsx` — Likely placeholder
- `DelegateRoutes.jsx` — Likely placeholder
- `FacultyAdminRoutes.jsx` — Likely placeholder
- `SpecialiteChefRoutes.jsx` — Likely placeholder
- `SuperAdminRoutes.jsx` — Likely unused; admin features in AdminPanelPage

**Reason:** These correspond to folder pages that are placeholders. If pages are deleted, routes are orphaned.

**Safety:** MEDIUM-HIGH — Check App.jsx routing configuration

---

### 📄 PAGES TO KEEP (Active/Implemented)

✅ **Keep These (they're actually used):**
- `HomePage.jsx`
- `LoginPage.jsx`
- `RegisterPage.jsx`
- `ForgotPasswordPage.jsx`
- `ResetPasswordPage.jsx`
- `ChangePasswordPage.jsx`
- `ProfilePage.jsx`
- `SettingsPage.jsx`
- `NotificationsPage.jsx`
- `MessagesPage.jsx`
- `DocumentsPage.jsx` (main one in pages/, not the one in Attacherd folder)
- `ActualitesPage.jsx` (News/Announcements)
- `AdminPanelPage.jsx`
- `AdminRequestsPage.jsx`
- `AdminSiteSettingsPage.jsx`
- `StudentDashboard.jsx`
- `TeacherDashboard.jsx`
- `StudentNotesPage.jsx`
- `StudentDisciplinaryView.jsx`
- `PFE/` folder (Group 3 implementation)
- `dashboard/` folder
- `AIAssistantPage.jsx`
- `ContactPage.jsx`
- `AboutPage.jsx`
- `SupportPage.jsx`
- `UnauthorizedPage.jsx`
- `NotFoundPage.jsx`
- `RequestsPage.jsx`
- `RequestDetailPage.jsx`
- `DisciplinaryCasesPage.jsx`
- `CaseDetailPage.jsx`

---

### 🗂️ COMPONENT FOLDERS TO CHECK (frontend/src/components/admin/)

#### 7. **Staff Management Components**
- `StaffManagementTable.jsx` — Unused? Check if referenced
- `StudentAssignmentManager.jsx` — Unused? Check if referenced
- `TeacherAssignmentWorkflow.jsx` — Unused? Check if referenced

**Reason:** May be placeholder for Group 4 (Affectation) functionality

**Safety:** MEDIUM — grep for usage

---

### 📝 ROOT DOCUMENTATION FILES TO CLEAN UP

**These are temporary/debug files (can optionally delete):**
- `DEBUG_NOTIFICATIONS.js`
- `DEBUG_RECLAMATION.js`
- `DEBUG_TEACHER_ASSIGNMENT.js`
- `BEFORE_AFTER_COMPARISON.md`
- `COMPLIANCE_AUDIT.md`
- `COMPLIANCE_CHECKLIST.md`
- `DESIGN_DECISION_JOURNAL.md`
- `DELIVERY_COMPLETE.md`
- `DOCUMENTATION_INDEX.md`
- `NEWS_COMPONENT_VISUAL_REFERENCE.md`
- `NEWS_REDESIGN_SUMMARY.md`
- `NEWS_REDESIGN_TECHNICAL_SPEC.md`
- `NOTIFICATION_SYSTEM_REPORT.md`
- `QUICK_REFERENCE.md`
- `RECLAMATION_FIX_REPORT.md`
- `STYLING_AUDIT_REPORT.md`
- `STYLING_FIXES_COMPLETED.md`

**Keep these:**
- `README.md`
- `rules.md`
- `skill.md`
- `CONTRIBUTING.md`
- `GROUP_8_PFE_CONTRIBUTIONS.md`
- `SEAMLESS_*` files (recent News redesign docs)

---

## Summary of Cleanup

### To DELETE (High Confidence)

**Folders:** (18 items)
```
frontend/src/pages/AssignmentManager/
frontend/src/pages/CommitteeMember/
frontend/src/pages/CommitteePresident/
frontend/src/pages/Delegate/
frontend/src/pages/DepartmentChef/
frontend/src/pages/FacultyAdmin/
frontend/src/pages/SpecialiteChef/
frontend/src/pages/SuperAdmin/
frontend/src/pages/Student/  ← if duplicate of StudentDashboard
frontend/src/pages/Teacher/  ← if duplicate of TeacherDashboard
frontend/src/routes/DepartmentChefRoutes.jsx
frontend/src/routes/AssignmentManagerRoutes.jsx
frontend/src/routes/CommitteeMemberRoutes.jsx
frontend/src/routes/CommitteePresidentRoutes.jsx
frontend/src/routes/DelegateRoutes.jsx
frontend/src/routes/FacultyAdminRoutes.jsx
frontend/src/routes/SpecialiteChefRoutes.jsx
frontend/src/routes/SuperAdminRoutes.jsx
Attacherd follder (will be deleted no needed)/
```

**Pages:** (6 files)
```
frontend/src/pages/AdminAcademicManagementPage.jsx
frontend/src/pages/AdminAcademicAssignmentsPage.jsx
frontend/src/pages/AdminUsersPage.jsx
frontend/src/pages/AdminUsersListPage.jsx
frontend/src/pages/CalendarPage.jsx
frontend/src/pages/StudentSpecialiteChoicePage.jsx
```

**Docs:** (15 debug/temp files)
```
Root-level temp docs listed above
```

---

## Verification Checklist Before Deletion

Before deleting anything, please verify:

- [ ] Check `frontend/src/App.jsx` to see which routes are actually imported/used
- [ ] Grep for usage of AssignmentManager, CommitteeMember, Delegate, etc.
- [ ] Confirm CalendarPage is not used in Student/Teacher routes
- [ ] Confirm AdminAcademicManagement pages are not used
- [ ] Check if SuperAdmin routes are imported anywhere
- [ ] Verify PFE folder is group-specific (don't delete)
- [ ] Verify dashboard folder structure is still needed

---

## Estimated Space Savings

- **Pages to delete:** ~5-10 MB (many large placeholder files)
- **Routes to delete:** ~100 KB
- **Role-specific folders:** ~2-3 MB
- **Total:** ~7-13 MB freed

---

**Recommendation:** Start with the most obvious deletions:
1. "Attacherd follder" (clearly marked)
2. Placeholder route files showing "Coming Soon"
3. Admin duplicate pages
4. Then gradually remove unused role-specific folders after verification
