-- Collapse role model to three core roles (admin, enseignant, etudiant)
-- Data-preserving: remap existing user assignments before dropping obsolete roles.

-- 1. Ensure the three core roles exist (idempotent insert).
INSERT INTO "roles" ("nom", "description")
SELECT 'admin', 'Administrateur système'
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "nom" = 'admin');

INSERT INTO "roles" ("nom", "description")
SELECT 'enseignant', 'Enseignant'
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "nom" = 'enseignant');

INSERT INTO "roles" ("nom", "description")
SELECT 'etudiant', 'Étudiant'
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "nom" = 'etudiant');

-- 2. Remap user_roles from deprecated roles onto their collapsed targets.
--    Admin-track extensions → admin.
UPDATE "user_roles"
SET "role_id" = (SELECT "id" FROM "roles" WHERE "nom" = 'admin')
WHERE "role_id" IN (
  SELECT "id" FROM "roles"
  WHERE "nom" IN ('admin_faculte', 'vice_doyen', 'chef_departement', 'chef_specialite')
);

--    Student-track extension (delegue) → etudiant.
UPDATE "user_roles"
SET "role_id" = (SELECT "id" FROM "roles" WHERE "nom" = 'etudiant')
WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "nom" = 'delegue');

--    Teacher-track extensions → enseignant.
UPDATE "user_roles"
SET "role_id" = (SELECT "id" FROM "roles" WHERE "nom" = 'enseignant')
WHERE "role_id" IN (
  SELECT "id" FROM "roles" WHERE "nom" IN ('president_conseil', 'membre_conseil')
);

-- 3. Collapse any duplicate (user_id, role_id) rows created by the remap.
DELETE FROM "user_roles" a
USING "user_roles" b
WHERE a."id" > b."id"
  AND a."user_id" = b."user_id"
  AND a."role_id" = b."role_id";

-- 4. Remove role_permissions for deprecated roles (FK safety).
DELETE FROM "role_permissions"
WHERE "role_id" IN (
  SELECT "id" FROM "roles"
  WHERE "nom" IN (
    'admin_faculte', 'vice_doyen', 'chef_departement', 'chef_specialite',
    'delegue', 'president_conseil', 'membre_conseil'
  )
);

-- 5. Drop the deprecated role rows.
DELETE FROM "roles"
WHERE "nom" IN (
  'admin_faculte', 'vice_doyen', 'chef_departement', 'chef_specialite',
  'delegue', 'president_conseil', 'membre_conseil'
);
