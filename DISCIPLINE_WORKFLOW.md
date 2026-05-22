# Discipline Module Workflow

## Overview

The discipline module manages disciplinary cases (`DossierDisciplinaire`), disciplinary council meetings (`ConseilDisciplinaire`), council members (`MembreConseil`), infractions, and decisions.

It follows a clean architecture style:
- `routes` define HTTP endpoints and RBAC rules
- `controller` handles auth/response wrapping and delegates to services
- `service` contains business logic, validation, status transitions, and alerting
- `repository` performs database access via Prisma

## Main Entities

- `DossierDisciplinaire`
  - student case reported by a teacher or admin
  - fields: `infractionId`, `decisionId`, `conseilId`, `status`
  - status values: `signale`, `en_instruction`, `jugement`, `traite`

- `ConseilDisciplinaire`
  - disciplinary council meeting
  - fields: `dateReunion`, `heure`, `lieu`, `status`, `anneeUniversitaire`
  - status values: `planifie`, `en_cours`, `termine`

- `MembreConseil`
  - assignments for council members
  - roles: `president`, `rapporteur`, `membre`

- `Infraction`
  - disciplinary offense catalog
  - fields: `nom`, `description`, `gravite`

- `Decision`
  - decision catalog / sanction
  - fields: `nom`, `description`, `niveauSanction`

## Data Flow

### 1. Request enters routes

Routes are defined in `backend/src/modules/discipline/routes/discipline.routes.ts`.
Key route groups:
- `/conseils` and `/meetings` for council management
- `/dossiers-disciplinaires` and `/cases` for cases
- `/infractions` and `/decisions` for catalogs
- `/students`, `/staff`, `/stats` for lookup and stats
- `/notifications`, `/my-dossiers` for student self-access

RBAC rules:
- `readRoles = ["admin", "enseignant"]`
- `reportRoles = ["admin", "enseignant"]`
- `adminOnly = ["admin"]`
- `presidentRoles = ["enseignant"]` (finalisation and decision recording require president ownership in service)

### 2. Controller logic

Controllers in `backend/src/modules/discipline/controllers/discipline.controller.ts` are a thin HTTP layer.
- They require authentication with `requireAuth`
- They perform role checks with `requireRole`
- They call `buildCallerContext` to resolve the authenticated user to a `CallerContext`
- They forward requests to service functions such as:
  - `listDossiers`, `getDossier`, `createDossiers`, `updateDossierService`, `deleteDossierService`
  - `listConseils`, `getConseil`, `createConseilService`, `updateConseilService`, `deleteConseilService`, `finaliserConseilService`
  - `recordDecisionService`, `getAvailableMembersService`, `getStudentNotifications`, `getStudentOwnDossiers`

`sendResult` centralizes response formatting and error handling.

## Business Logic in Services

Services live in `backend/src/modules/discipline/services/discipline.service.ts`.
They implement the discipline workflow and data validation.

### Caller context

`buildCallerContext` resolves:
- whether the user is admin
- the teacher profile via `repo.findEnseignantByUserId`
- creates `CallerContext` containing `userId`, `roles`, `isAdmin`, and `enseignantId`

### Dossier lifecycle

`createDossiers`
- accepts `etudiantId` / `studentId` / `studentIds`
- resolves or creates an infraction if needed
- saves each case with `status: signale`
- uses `createAlert` to notify admin users of the new case

`listDossiers`
- filters by admin vs teacher
- teacher users only see cases they reported or cases attached to a council they belong to
- supports search, status, `conseilId`, `gravite`, `studentId`
- **NEW**: supports `availableOnly=true` query parameter to filter only pending cases (status `signale` and not attached to any council)
- closed cases are excluded when `availableOnly=true` is used

`getDossier`
- enforces access control:
  - admin can view all
  - teacher can view reported cases or cases for councils where they are a member
  - student users can view their own cases
- attaches `_accessControl` metadata for Conseil access

`updateDossierService`
- only admin may change `status`
- updates decision fields and council assignment

`deleteDossierService`
- only the reporting teacher or admin may delete
- only cases in `signale` state can be deleted

### Conseil lifecycle

`createConseilService`
- requires `dateReunion`, `anneeUniversitaire`, `dossierIds` (array for **multiple cases**), and `presidentId`
- **ENHANCED**: validates that all provided dossiers are pending cases (status `signale`) and not already attached to any council
- **ENHANCED**: prevents duplicate dossiers in the array (checks for duplicate IDs)
- **ENHANCED**: returns clear error messages distinguishing between closed cases and cases already attached to councils
- all selected dossiers must share a single reporting teacher (rapporteur)
- prevents president from being the reporting teacher
- adds president, rapporteur, and additional members
- updates associated dossiers to `status: en_instruction`
- creates scheduled meeting alerts for involved cases and council members

`listConseils`
- synchronizes `planifie` councils to `en_cours` automatically when meeting time passes
- returns councils filtered by teacher membership for non-admin users

`getConseil`
- enforces member/admin access
- adds `_accessControl` metadata showing whether the user can make decisions

`updateConseilService`
- prevents modification of a `termine` council
- ensures reporting teacher remains unique and not president
- optionally replaces council members when needed

`deleteConseilService`
- prevents deletion of `termine` councils
- reverts associated dossiers back to `signale` or clears the council link depending on their status

`finaliserConseilService`
- only the council president can finalize
- sets council status to `termine`
- optionally persists decision drafts for each case
- resolves decisions by ID or by matching/creating a `Decision` record
- updates the related `DossierDisciplinaire` records to `status: traite`
- sends decision alerts through `createDisciplinaryDecisionAlerts`

### Decision recording

`recordDecisionService`
- validates that the dossier belongs to a council
- validates the current user is the council president
- updates the dossier with `decisionId`, `remarqueDecision`, `dateDecision`, and status `traite`
- triggers alerts for the student

### Member management

`addMembreService`
- only admin can add members by route guard
- prevents duplicate members
- prevents adding the reporter as a council member again
- automatically includes the rapporteur if missing

`removeMembreService`
- deletes a council member record

### Student access and notifications

Students may access:
- `/api/v1/discipline/my-dossiers`
- `/api/v1/discipline/notifications`

`getStudentOwnDossiers`
- returns all cases for the authenticated student

`getStudentNotifications`
- builds notifications for:
  - case reported
  - hearing scheduled
  - decision issued
- includes hearing metadata and appeal deadline calculation

## Repository Layer

Repository methods are in `backend/src/modules/discipline/repositories/discipline.repository.ts`.
They contain only Prisma database operations and no business rules.

Key repository functions:
- `findDossierById`, `createDossier`, `updateDossier`, `deleteDossier`
- `findConseilById`, `createConseil`, `updateConseil`, `deleteConseil`
- `createMembre`, `deleteMembre`, `createManyMembres`
- lookup helpers for teacher/student profiles and president membership
- `findConseilsNeedingStatusUpdate` to move planned councils into `en_cours`

## Catalog Services

Catalog operations are handled by `backend/src/modules/discipline/services/catalog.service.ts`.
This service supports:
- `infractions` catalog CRUD
- `decisions` catalog CRUD
- student and staff search
- discipline statistics
- student profile lookup

The controller exposes those endpoints through the same discipline route namespace.

## Important Workflow Rules

- A case enters the system as `signale` when reported.
- A council can only be created for cases that are `signale` and not already attached to another council.
- When a council is created with multiple pending cases, **all cases must share the same reporting teacher**.
- Closed cases (non-`signale` status) cannot be added to a council.
- When a council is created, associated cases move to `en_instruction`.
- The council president is the only user authorized to finalize the council or directly record decisions.
- Finalizing a council sets status to `termine` and may mark cases `traite`.
- Decision creation can use an existing `Decision` catalog entry or create a new one on the fly.
- Students receive notifications for report, hearing, and decision events.

## Notes

- The discipline module is registered in `backend/src/app.ts` under `/api/v1/discipline` and aliases `/api/v1/cd` and `/api/v1/disciplinary`.
- Access control is enforced both at route middleware and with service-level business checks for sensitive operations.
- Alerts use shared alert services to notify admins, members, and students.

## File locations

- `backend/src/modules/discipline/routes/discipline.routes.ts`
- `backend/src/modules/discipline/controllers/discipline.controller.ts`
- `backend/src/modules/discipline/services/discipline.service.ts`
- `backend/src/modules/discipline/repositories/discipline.repository.ts`
- `backend/src/modules/discipline/services/catalog.service.ts`
- `backend/src/modules/discipline/validators/discipline.validators.ts`
- `backend/src/modules/discipline/types/discipline.types.ts`

## API Usage Examples

### Getting pending cases for council creation

```bash
# Fetch only pending cases (not closed, not already attached to a council)
GET /api/v1/discipline/dossiers-disciplinaires?availableOnly=true

# Fetch specific pending cases with search
GET /api/v1/discipline/dossiers-disciplinaires?availableOnly=true&search=student_name
```

Response: Returns only cases with `status: 'signale'` and `conseilId: null`

### Creating a council with multiple pending cases

```bash
POST /api/v1/discipline/conseils
Content-Type: application/json

{
  "dossierIds": [1, 2, 3, 4],    # Array of case IDs to add to one meeting
  "dateReunion": "2026-06-15",
  "anneeUniversitaire": "2025-2026",
  "presidentId": 5,
  "heure": "14:30",
  "lieu": "Salle de réunion",
  "membres": [6, 7, 8]           # Additional council members (not president or rapporteur)
}
```

**Validation**:
- All dossier IDs must be pending (`status: 'signale'`)
- No case can already be attached to another council
- No duplicate dossier IDs allowed
- All cases must have the same reporting teacher (rapporteur)
- President cannot be the same as the reporting teacher

### Filtering out closed cases

The `availableOnly` parameter automatically filters out:
- Cases with status `traite` (closed with decision)
- Cases with status `jugement` (under judgment)
- Cases with status `en_instruction` (already in another council)
- Cases already attached to a council (`conseilId !== null`)
