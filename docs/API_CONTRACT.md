# 📄 API Contract — University PFE Platform

> **Groupe 8 — Frontend Template**
> This document describes the standard JSON format, authentication flow, available endpoints, and how each module group integrates with the shared frontend.
> **Share this file with all groups.**

---

## Table of Contents

1. [Standard JSON Response Format](#1-standard-json-response-format)
2. [Error Response Format](#2-error-response-format)
3. [Authentication & Session](#3-authentication--session)
4. [User Object Shape](#4-user-object-shape)
5. [Roles & Permissions](#5-roles--permissions)
6. [Auth Endpoints (Implemented)](#6-auth-endpoints-implemented)
7. [Module Endpoints (To Build)](#7-module-endpoints-to-build)
8. [Frontend Integration Guide](#8-frontend-integration-guide)
9. [Database Schema Reference](#9-database-schema-reference)
10. [Enums Reference](#10-enums-reference)

---

## 1. Standard JSON Response Format

**Every** API endpoint returns this shape. No exceptions.

### ✅ Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

| Field     | Type      | Always present | Description                         |
|-----------|-----------|----------------|-------------------------------------|
| `success` | `boolean` | ✅ Yes         | Always `true` on 2xx responses      |
| `data`    | `object`  | ✅ Yes         | The actual payload (can be `null`)   |
| `message` | `string`  | ⚠️ Optional    | Human-readable success message       |

### ✅ Success — List / Paginated

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

---

## 2. Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation"
  }
}
```

| Field            | Type      | Description                                |
|------------------|-----------|--------------------------------------------|
| `success`        | `boolean` | Always `false` on 4xx/5xx                  |
| `error.code`     | `string`  | Machine-readable code (see table below)    |
| `error.message`  | `string`  | Human-readable explanation                 |

### Standard Error Codes

| Code                          | HTTP | Meaning                                      |
|-------------------------------|------|----------------------------------------------|
| `VALIDATION_ERROR`            | 400  | Missing or invalid request body fields       |
| `INVALID_CREDENTIALS`         | 401  | Wrong email or password                      |
| `TOKEN_EXPIRED`               | 401  | JWT access token has expired                 |
| `UNAUTHORIZED`                | 401  | Not logged in / no token                     |
| `EMAIL_NOT_VERIFIED`          | 403  | Account exists but email not verified yet    |
| `PASSWORD_CHANGE_REQUIRED`    | 403  | First-use password change needed             |
| `FORBIDDEN`                   | 403  | Logged in but lacking permission             |
| `NOT_FOUND`                   | 404  | Resource doesn't exist                       |
| `CONFLICT`                    | 409  | Duplicate (e.g. email already registered)    |
| `RATE_LIMITED`                | 429  | Too many requests — try again later          |
| `SERVER_ERROR`                | 500  | Internal server error                        |

---

## 3. Authentication & Session

| Aspect          | Value                                                      |
|-----------------|------------------------------------------------------------|
| Method          | **JWT** stored in **httpOnly cookies** (not localStorage)  |
| Access Token    | 15 minutes, cookie name `accessToken`                      |
| Refresh Token   | 7 days, cookie name `refreshToken`                         |
| Credential mode | `credentials: 'include'` on every `fetch()` call          |
| Auto-refresh    | Frontend automatically calls `/refresh-token` on 401       |

### Auth Flow

```
1. POST /api/v1/auth/login  →  sets httpOnly cookies (access + refresh)
2. All subsequent requests include cookies automatically
3. On 401 → frontend calls POST /api/v1/auth/refresh-token
4. If refresh fails → redirect to /login
```

### First-Use Password Change

When an admin creates a user, `firstUse = true`. The backend blocks all routes except:
- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`

Until the user changes their password. The login response includes `requiresPasswordChange: true`.

---

## 4. User Object Shape

Returned by `GET /api/v1/auth/me`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nom": "Benali",
    "prenom": "Ahmed",
    "email": "ahmed.benali@univ.dz",
    "sexe": "H",
    "telephone": "0555123456",
    "photo": "/uploads/photos/1.jpg",
    "status": "active",
    "emailVerified": true,
    "firstUse": false,
    "roles": ["enseignant", "chef_departement"],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastLogin": "2025-06-20T08:00:00.000Z"
  }
}
```

| Field            | Type       | Description                                      |
|------------------|------------|--------------------------------------------------|
| `id`             | `number`   | Auto-increment integer                           |
| `nom`            | `string`   | Family name                                      |
| `prenom`         | `string`   | First name                                       |
| `email`          | `string`   | Unique email                                     |
| `sexe`           | `"H"\|"F"` | Nullable                                         |
| `telephone`      | `string`   | Nullable                                         |
| `photo`          | `string`   | Nullable, URL or path                            |
| `status`         | `string`   | `active` \| `inactive` \| `suspended`            |
| `emailVerified`  | `boolean`  | Has verified email                               |
| `firstUse`       | `boolean`  | Must change password before accessing the app    |
| `roles`          | `string[]` | Array of role names (lowercase). See §5          |
| `createdAt`      | `string`   | ISO 8601 date                                    |
| `lastLogin`      | `string`   | ISO 8601 date, nullable                          |

> **IDs are always integers**, not UUIDs or strings.

---

## 5. Roles & Permissions

### Available Roles

| Role                  | Type         | Description                     |
|-----------------------|--------------|---------------------------------|
| `admin`               | Admin        | Super administrator             |
| `vice_doyen`          | Admin        | Vice dean                       |
| `chef_departement`    | Admin/Staff  | Department head                 |
| `chef_specialite`     | Staff        | Specialty head                  |
| `enseignant`          | Teacher      | Teacher / Professor             |
| `etudiant`            | Student      | Regular student                 |
| `delegue`             | Student      | Student delegate                |
| `president_conseil`   | Staff        | Disciplinary council president  |

### Frontend UI Role Mapping

The frontend maps DB roles to 3 UI roles for layout/theme:

```
admin       → "admin"     (admin, vice_doyen)
teacher     → "teacher"   (enseignant, chef_specialite, chef_departement)
student     → "student"   (etudiant, delegue)
```

### Permissions System

Permissions are stored in the DB (`permissions` table) and linked to roles via `role_permissions`.

Permission format: `module:action` (e.g. `users:create`, `pfe:validate`, `annonces:publish`)

To protect a backend route:
```typescript
router.post("/some-action", requireAuth, requirePermission("module:action"), handler);
```

---

## 6. Auth Endpoints (Implemented)

Base path: **`/api/v1/auth`**

### Public Routes (no auth needed)

| Method | Path                    | Body                                                    | Response `data`                                                |
|--------|-------------------------|---------------------------------------------------------|----------------------------------------------------------------|
| POST   | `/register`             | `{ nom, prenom, email, password }`                      | `{ user: { id, nom, prenom, email, roles } }`                 |
| POST   | `/login`                | `{ email, password }`                                   | `{ user: { id, nom, prenom, email, roles }, requiresPasswordChange: bool }` |
| POST   | `/refresh-token`        | *(empty — uses cookie)*                                 | `{ message: "Token refreshed" }`                               |
| POST   | `/logout`               | *(empty)*                                               | `{ message: "Logged out" }`                                    |

### Email Verification

| Method | Path                       | Body / Params      | Response `data`                    |
|--------|----------------------------|--------------------|------------------------------------|
| GET    | `/verify-email/:token`     | URL param `:token` | `{ message: "Email verified" }`    |
| POST   | `/resend-verification`     | `{ email }`        | `{ message: "Verification sent" }` |

### Protected Routes (requires login)

| Method | Path                              | Body                                 | Response `data`                                              |
|--------|-----------------------------------|--------------------------------------|--------------------------------------------------------------|
| GET    | `/me`                             | *(empty)*                            | Full user object (see §4)                                    |
| POST   | `/change-password`                | `{ currentPassword, newPassword }`   | `{ message: "Password changed" }`                            |

### Admin Routes (requires login + permission)

| Method | Path                              | Permission     | Body                                              | Response `data`                                    |
|--------|-----------------------------------|----------------|---------------------------------------------------|----------------------------------------------------|
| POST   | `/admin/create-user`              | `users:create` | `{ nom, prenom, email, roles: ["enseignant"] }`   | `{ user: {...}, temporaryPassword: "abc123" }`     |
| POST   | `/admin/reset-password/:userId`   | `users:edit`   | *(empty — userId in URL)*                         | `{ temporaryPassword: "xyz789" }`                  |

---

## 7. Module Endpoints (To Build)

Each group builds their module's backend endpoints following the **same JSON format** from §1 and §2.

### Module → Group Mapping

| Module             | Group | Base Path                     | Main Schema Models                                                                    |
|--------------------|-------|-------------------------------|---------------------------------------------------------------------------------------|
| **Affectation**    | G4    | `/api/v1/affectation`         | `CampagneAffectation`, `CampagneSpecialite`, `Voeu`                                  |
| **PFE**            | G3    | `/api/v1/pfe`                 | `PfeSujet`, `GroupPfe`, `GroupSujet`, `GroupMember`, `PfeJury`                        |
| **Discipline**     | G2    | `/api/v1/discipline`          | `Infraction`, `Decision`, `ConseilDisciplinaire`, `MembreConseil`, `DossierDisciplinaire` |
| **Réclamations**   | G5    | `/api/v1/reclamations`        | `ReclamationType`, `Reclamation`, `TypeAbsence`, `Justification`                      |
| **Documents**      | G6    | `/api/v1/documents`           | `DocumentType`, `DocumentRequest`, `CopieRemise`                                      |
| **Annonces**       | G7    | `/api/v1/annonces`            | `AnnonceType`, `Annonce`, `AnnonceDocument`                                           |
| **AI**             | –     | `/api/v1/ai`                  | *(No schema models — external AI service)*                                            |
| **Dashboard**      | –     | `/api/v1/dashboard`           | *(Aggregation endpoint — reads from other modules)*                                   |

### CRUD Endpoint Pattern (Recommended)

For any resource (e.g. `annonces`):

```
GET    /api/v1/annonces              → List (public)
GET    /api/v1/annonces/:id          → Get one
POST   /api/v1/annonces              → Create (admin only)
PUT    /api/v1/annonces/:id          → Update (admin only)
DELETE /api/v1/annonces/:id          → Delete (admin only)
```

#### Access Rules (Current Implementation)

- `GET /api/v1/annonces` and `GET /api/v1/annonces/:id` are **public**.
- `POST/PUT/DELETE /api/v1/annonces/*` require authenticated user with role `admin`.
- List filters supported: `typeAnnonce` and `isExpired` (`true | false`).

#### Example — Create Annonce

**Request:**
```http
POST /api/v1/annonces
Content-Type: multipart/form-data

{
  "titre": "Examen final programmation",
  "contenu": "L'examen aura lieu le 25 juin...",
  "typeAnnonce": "Academic",
  "dateExpiration": "2026-06-25",
  "file": "<optional attachment>"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Annonce créée avec succès",
  "data": {
    "id": 42,
    "titre_ar": "Examen final programmation",
    "titre_en": "Examen final programmation",
    "contenu_ar": "L'examen aura lieu le 25 juin...",
    "contenu_en": "L'examen aura lieu le 25 juin...",
    "auteurId": 5,
    "typeId": 1,
    "datePublication": "2026-04-11T10:30:00.000Z",
    "dateExpiration": "2026-06-25T00:00:00.000Z",
    "type": {
      "id": 1,
      "nom_ar": "Academic",
      "nom_en": "Academic"
    },
    "documents": [
      {
        "id": 9,
        "fichier": "/uploads/annonces/1712826000000-123456789.pdf",
        "type": "pdf"
      }
    ]
  }
}
```

#### Example — List with Filters

**Request:**
```http
GET /api/v1/annonces?typeAnnonce=Academic&isExpired=false
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    { "id": 42, "titre_ar": "Examen final...", "titre_en": "Final exam...", "type": { "nom_ar": "Academic", "nom_en": "Academic" }, "documents": [] },
    { "id": 41, "titre_ar": "Changement emploi du temps...", "titre_en": "Schedule change...", "type": { "nom_ar": "Academic", "nom_en": "Academic" }, "documents": [] }
  ]
}
```

#### Example — Error (Not Found)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Annonce with id 999 not found"
  }
}
```

---

## 8. Frontend Integration Guide

### How Pages Work

Every protected page is wrapped in `DashboardLayout` which provides:
- **Sidebar** navigation (filtered by user roles)
- **Topbar** with user info & logout
- A `role` prop automatically injected into every child page (`"student"` | `"teacher"` | `"admin"`)

```jsx
// Route declaration in App.jsx
<Route
  path="/dashboard/annonces"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <ActualitesPage />       {/* receives role="student"|"teacher"|"admin" */}
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

### How to Use the API Client

Every page uses the shared `request()` function from `services/api.js`:

```javascript
import request from '../services/api.js';

// GET (list)
const annonces = await request('/api/v1/annonces?page=1&limit=20');
// annonces.data = [...]
// annonces.meta = { page, limit, total, totalPages }

// GET (single)
const annonce = await request('/api/v1/annonces/42');
// annonce.data = { id: 42, titre: "...", ... }

// POST (create)
const result = await request('/api/v1/annonces', {
  method: 'POST',
  body: JSON.stringify({ titre: "...", contenu: "..." }),
});
// result.data = { id: 43, ... }

// PUT (update)
await request('/api/v1/annonces/42', {
  method: 'PUT',
  body: JSON.stringify({ titre: "Updated title" }),
});

// DELETE
await request('/api/v1/annonces/42', { method: 'DELETE' });
```

- **Cookies are automatic** — no need to pass tokens manually.
- **401 auto-refresh** — if the access token expires, the client retries silently.
- **Errors throw** — wrap in `try/catch`, check `error.code` and `error.status`.

### Page Component Template

```jsx
import React, { useState, useEffect } from 'react';
import request from '../services/api.js';

const MyModulePage = ({ role }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await request('/api/v1/my-module');
        setItems(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* role is "student", "teacher", or "admin" */}
      {role === 'admin' && <button>Admin action</button>}
      {items.map(item => <div key={item.id}>{item.nom}</div>)}
    </div>
  );
};

export default MyModulePage;
```

### Available Sidebar Modules & Paths

| Path                         | Name Key            | Accessible by                                         |
|------------------------------|---------------------|-------------------------------------------------------|
| `/dashboard`                 | `nav.dashboard`     | All roles                                             |
| `/dashboard/actualites`      | `nav.actualites`    | All roles                                             |
| `/dashboard/projects`        | `nav.projects`      | etudiant, delegue, enseignant                         |
| `/dashboard/ai`              | `nav.ai`            | etudiant, delegue, enseignant                         |
| `/dashboard/documents`       | `nav.documents`     | etudiant, delegue, enseignant, vice_doyen, admin      |
| `/dashboard/calendar`        | `nav.calendar`      | All roles                                             |
| `/dashboard/disciplinary`    | `nav.disciplinary`  | enseignant, president_conseil, vice_doyen, admin      |
| `/dashboard/requests`        | `nav.requests`      | All roles                                             |
| `/dashboard/messages`        | `nav.messages`      | etudiant, delegue, enseignant, vice_doyen, admin      |
| `/dashboard/notifications`   | `nav.notifications` | etudiant, delegue, enseignant, vice_doyen, admin      |
| `/dashboard/settings`        | `nav.settings`      | All roles                                             |
| `/dashboard/support`         | `nav.support`       | etudiant, delegue, enseignant                         |

---

## 9. Database Schema Reference

### Structure Universitaire (G4)

| Table          | Key Fields                                  |
|----------------|---------------------------------------------|
| `facultes`     | id, nom                                     |
| `departements` | id, nom, faculte_id                         |
| `filieres`     | id, nom, departement_id, description        |
| `specialites`  | id, nom, filiere_id, niveau                 |
| `promos`       | id, nom, specialite_id, annee_universitaire, section |

### Users & Auth (G1)

| Table              | Key Fields                                                   |
|--------------------|--------------------------------------------------------------|
| `users`            | id, nom, prenom, sexe, email, password, first_use, email_verified, status |
| `roles`            | id, nom, description                                        |
| `permissions`      | id, nom, description, module, action                        |
| `role_permissions`  | role_id, permission_id                                      |
| `user_roles`       | user_id, role_id                                            |
| `grades`           | id, nom, description                                        |
| `enseignants`      | id, user_id, grade_id, bureau, date_recrutement             |
| `etudiants`        | id, user_id, matricule, promo_id, moyenne, annee_inscription |

### Documents (G6)

| Table              | Key Fields                                                   |
|--------------------|--------------------------------------------------------------|
| `modules`          | id, nom, code, semestre, specialite_id, volume_cours/td/tp, credit, coef |
| `enseignements`    | id, enseignant_id, module_id, promo_id, type                |
| `document_types`   | id, nom, description, categorie                             |
| `document_requests`| id, enseignant_id, type_doc_id, status, traite_par          |
| `copies_remise`    | id, enseignement_id, session, date_exam, nb_copies, status  |

### Affectation (G4)

| Table                  | Key Fields                                              |
|------------------------|---------------------------------------------------------|
| `campagne_affectation` | id, nom, niveau_source, niveau_cible, date_debut/fin, status |
| `campagne_specialites` | campagne_id, specialite_id, quota, places_occupees      |
| `voeux`                | id, campagne_id, etudiant_id, specialite_id, ordre, status |

### PFE (G3)

| Table            | Key Fields                                                  |
|------------------|-------------------------------------------------------------|
| `pfe_sujets`     | id, titre, description, enseignant_id, promo_id, type_projet, status |
| `groups_pfe`     | id, nom, sujet_final_id, co_encadrant_id, note, mention    |
| `group_sujets`   | group_id, sujet_id, ordre, status                           |
| `group_members`  | group_id, etudiant_id, role                                 |
| `pfe_jury`       | group_id, enseignant_id, role                               |

### Discipline (G2)

| Table                      | Key Fields                                            |
|----------------------------|-------------------------------------------------------|
| `infractions`              | id, nom, description, gravite                         |
| `decisions`                | id, nom, description, niveau_sanction                 |
| `conseils_disciplinaires`  | id, date_reunion, lieu, status                        |
| `membres_conseil`          | conseil_id, enseignant_id, role                       |
| `dossiers_disciplinaires`  | id, conseil_id, etudiant_id, infraction_id, decision_id, status |

### Réclamations & Justifications (G5)

| Table               | Key Fields                                                   |
|---------------------|--------------------------------------------------------------|
| `reclamation_types` | id, nom, description                                        |
| `reclamations`      | id, etudiant_id, type_id, objet, priorite, status, traite_par |
| `type_absence`      | id, nom, description                                        |
| `justifications`    | id, etudiant_id, type_id, date_absence, motif, status       |

### Annonces (G7)

| Table                | Key Fields                                                  |
|----------------------|-------------------------------------------------------------|
| `annonce_types`      | id, nom, description                                        |
| `annonces`           | id, titre, contenu, auteur_id, type_id, cible, priorite, status |
| `annonces_documents` | id, annonce_id, fichier, type, description                  |

---

## 10. Enums Reference

All enums that can appear in request bodies or responses:

| Enum Name               | Values                                                   | Used In              |
|--------------------------|----------------------------------------------------------|----------------------|
| `Niveau`                 | `L1, L2, L3, M1, M2`                                    | specialites          |
| `UserStatus`             | `active, inactive, suspended`                            | users                |
| `Sexe`                   | `H, F`                                                   | users                |
| `TypeEnseignement`       | `cours, td, tp`                                          | enseignements        |
| `CategorieDocument`      | `enseignement, administratif, scientifique, pedagogique, autre` | document_types |
| `StatusDocumentRequest`  | `en_attente, en_traitement, valide, refuse`              | document_requests    |
| `SessionExam`            | `normale, dette, rattrapage`                             | copies_remise        |
| `StatusCopie`            | `non_remis, remis, en_retard`                            | copies_remise        |
| `NiveauSource`           | `L1, L2, L3, M1, M2`                                    | campagne_affectation |
| `NiveauCible`            | `L2, L3, M1, M2, D1`                                    | campagne_affectation |
| `StatusCampagne`         | `brouillon, ouverte, fermee, terminee`                   | campagne_affectation |
| `StatusVoeu`             | `en_attente, accepte, refuse`                            | voeux                |
| `TypeProjet`             | `recherche, application, etude, innovation`              | pfe_sujets           |
| `StatusSujet`            | `propose, valide, reserve, affecte, termine`             | pfe_sujets           |
| `MentionPfe`             | `passable, assez_bien, bien, tres_bien, excellent`       | groups_pfe           |
| `StatusGroupSujet`       | `en_attente, accepte, refuse`                            | group_sujets         |
| `RoleMembre`             | `membre, chef_groupe`                                    | group_members        |
| `RoleJury`               | `president, examinateur, rapporteur`                     | pfe_jury             |
| `GraviteInfraction`      | `faible, moyenne, grave, tres_grave`                     | infractions          |
| `NiveauSanction`         | `avertissement, blame, suspension, exclusion`            | decisions            |
| `StatusConseil`          | `planifie, en_cours, termine`                            | conseils_disciplinaires |
| `RoleConseil`            | `president, rapporteur, membre`                          | membres_conseil      |
| `StatusDossier`          | `signale, en_instruction, jugement, traite`              | dossiers_disciplinaires |
| `PrioriteReclamation`    | `faible, normale, haute, urgente`                        | reclamations         |
| `StatusReclamation`      | `soumise, en_cours, en_attente, traitee, refusee`        | reclamations         |
| `StatusJustification`    | `soumis, en_verification, valide, refuse`                | justifications       |
| `CibleAnnonce`           | `tous, etudiants, enseignants, administration`           | annonces             |
| `PrioriteAnnonce`        | `basse, normale, haute, urgente`                         | annonces             |
| `StatusAnnonce`          | `brouillon, publie, archive`                             | annonces             |
| `TypeFichierAnnonce`     | `pdf, image, doc, autre`                                 | annonces_documents   |

---

## Quick Checklist for Other Groups

1. ✅ All your endpoints return `{ success, data, message }` or `{ success, error: { code, message } }`
2. ✅ IDs are **integers** (auto-increment), not strings
3. ✅ Use `requireAuth` middleware for protected routes
4. ✅ Use `requirePermission("module:action")` for admin/role-specific routes
5. ✅ Register your routes in `app.ts` as `app.use("/api/v1/your-module", yourRoutes)`
6. ✅ Field names in JSON match Prisma model names (camelCase), DB columns are snake_case
7. ✅ Paginated lists include `meta: { page, limit, total, totalPages }`
8. ✅ Dates are ISO 8601 strings
9. ✅ Enum values are **lowercase** strings matching the Prisma enum exactly

---

*Last updated: June 2025 — Groupe 8 (Frontend Template)*
