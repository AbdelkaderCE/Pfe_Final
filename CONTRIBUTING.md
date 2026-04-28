# 🤝 Contributing — PFE University Platform

> **Read `docs/API_CONTRACT.md` first** — it defines the JSON format, auth system, and all schema models.

---

## Repo Structure

```
PFE/
├── backend/src/modules/     ← Each group works HERE (their module folder)
│   ├── auth/                ← ✅ Done (Group 1 + Group 8)
│   ├── discipline/          ← Group 2
│   ├── pfe/                 ← Group 3
│   ├── affectation/         ← Group 4
│   ├── reclamations/        ← Group 5
│   ├── documents/           ← Group 6
│   └── annonces/            ← Group 7
│
├── frontend/src/pages/       ← ✅ Frontend pages (Group 8 — DO NOT MODIFY)
│   ├── Student/
│   ├── Teacher/
│   ├── Delegate/
│   ├── SuperAdmin/
│   ├── FacultyAdmin/
│   ├── DepartmentChef/
│   ├── SpecialiteChef/
│   ├── CommitteePresident/
│   ├── CommitteeMember/
│   └── AssignmentManager/
│
├── frontend/src/services/api.js ← Shared API client (Group 8 — DO NOT MODIFY)
├── frontend/src/layouts/        ← DashboardLayout (Group 8 — DO NOT MODIFY)
├── backend/prisma/schema.prisma ← Database schema (DO NOT MODIFY)
└── docs/API_CONTRACT.md         ← 📄 Read this first!
```

---

## Your Branch

| Group | Module          | Branch                  | Backend folder               |
|-------|-----------------|-------------------------|------------------------------|
| G2    | Discipline      | `group2-discipline`            | `backend/src/modules/discipline/`   |
| G3    | PFE             | `group3-pfe`                   | `backend/src/modules/pfe/`          |
| G4    | Affectation     | `group4-affectation`           | `backend/src/modules/affectation/`  |
| G5    | Réclamations    | `group5-reclamations`          | `backend/src/modules/reclamations/` |
| G6    | Documents       | `group6-documents`             | `backend/src/modules/documents/`    |
| G7    | Annonces        | `group7-annonces`              | `backend/src/modules/annonces/`     |
| G9    | Dashboard Enseignant | `group9-dashboard-enseignant`  | `backend/src/modules/dashboard/` (teacher endpoints) |
| G10   | Dashboard Étudiant   | `group10-dashboard-etudiant`   | `backend/src/modules/dashboard/` (student endpoints) |
| G11   | AI              | `group11-ai`                   | `backend/src/modules/ai/`           |

---

## Step-by-Step for Each Group

### 1. Clone & switch to your branch

```bash
git clone https://github.com/AbdelkaderCE/PFE.git
cd PFE
git checkout group<N>-<module>      # e.g. git checkout group7-annonces
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (to test pages)
cd ../frontend
npm install
```

### 3. Set up your database & `.env`

> 📖 **Full guide:** See [`backend/README.md`](backend/README.md) for detailed PostgreSQL **or** MySQL/XAMPP setup.

```bash
cd backend
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/Mac
```

Edit `backend/.env` — set `DATABASE_URL` for your database:

```env
# PostgreSQL (recommended)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/university_pfe?schema=public"

# MySQL / XAMPP (if you can't use PostgreSQL)
# DATABASE_URL="mysql://root:@localhost:3306/university_pfe"
# ⚠️ Also change provider in prisma/schema.prisma to "mysql" (see backend/README.md)
```

### 4. Create tables & seed data

```bash
cd backend
npx prisma db push       # Creates all 38 tables
npx prisma generate      # Generates Prisma client
npx prisma db seed       # Inserts test users & data
```

### 5. Build your module

Each module folder already has the sub-folder structure:

```
backend/src/modules/your-module/
├── controllers/     ← Your request handlers
├── routes/          ← Your Express routes
└── models/          ← (Optional) Prisma queries / service logic
```

Create these files inside your folder:

**`routes/your-module.routes.ts`**
```typescript
import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.middleware";
import { requirePermission } from "../../../middleware/permission.middleware";
// import your controllers...

const router = Router();

// Your routes here...

export default router;
```

**`controllers/your-module.controller.ts`**
```typescript
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Always return this format:
// Success: { success: true, data: {...}, message: "..." }
// Error:   { success: false, error: { code: "...", message: "..." } }
```

### 6. Register your route in app.ts

Add **one line** in `backend/src/app.ts`:

```typescript
import yourModuleRoutes from "./modules/your-module/routes/your-module.routes";
app.use("/api/v1/your-module", yourModuleRoutes);
```

### 7. Test

```bash
cd backend
npm run dev
```

The frontend pages (built by Group 8) already call your endpoints via:
```javascript
import request from '../services/api.js';
const data = await request('/api/v1/your-module');
```

### 8. Push your branch

```bash
git add .
git commit -m "feat(your-module): implement CRUD endpoints"
git push origin group<N>-<module>
```

**Group 8 will review and merge your branch into `master`.**

---

## ⚠️ Rules

1. **ONLY edit files inside `backend/src/modules/your-module/`** and add ONE import line in `app.ts`
2. **DO NOT** modify the Prisma schema, frontend pages, api.js, layouts, or auth module
3. **Follow the JSON format** from `docs/API_CONTRACT.md` — no exceptions
4. **IDs are integers** — do not use UUIDs
5. **Use `requireAuth`** for protected routes, **`requirePermission("module:action")`** for role-specific routes
6. **Paginated lists** must include `meta: { page, limit, total, totalPages }`
7. **Test your endpoints** with Postman or curl before pushing

---

## Frontend Pages (already built for you)

The pages call your API endpoints. Here's what each page expects:

| Group | Pages that call your endpoints                                     |
|-------|-------------------------------------------------------------------|
| G2    | `DisciplinaryCasesPage`, `CommitteePresident/*`, `CommitteeMember/*`, `StudentDisciplinaryView` |
| G3    | `Student/MyProjects`, `Teacher/Projects`, `AssignmentManager/*`    |
| G4    | `SpecialiteChef/StudentAssignment`, `AssignmentManager/*`          |
| G5    | `Student/MyComplaints`, `Delegate/Complaints`, `RequestsPage`      |
| G6    | `Teacher/MyCourses`, documents-related pages                       |
| G7    | `ActualitesPage` (public + dashboard versions)                     |
| G9    | `TeacherDashboard`, `Teacher/*` pages                              |
| G10   | `StudentDashboard`, `Student/*` pages                              |
| G11   | `AIChatbot` component                                              |

Each page receives a `role` prop (`"student"`, `"teacher"`, or `"admin"`) and calls `request('/api/v1/your-module/...')`.

---

## Questions?

Contact **Group 8 (Frontend Template)** — we manage the frontend, layouts, routing, and merge all branches.

*Last updated: March 2026*
