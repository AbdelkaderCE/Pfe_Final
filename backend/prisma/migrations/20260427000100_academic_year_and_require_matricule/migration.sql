-- ─────────────────────────────────────────────────────────────
-- Academic year tracking + matricule enforcement
--
-- This migration is EXTENSION-ONLY. No existing column or table is
-- removed; no existing row is destroyed. The only narrowing change
-- is the matricule NOT NULL constraint, which is preceded by a
-- deterministic backfill so it cannot fail on legacy data.
--
-- Order matters:
--   1. Create academic_years (referenced by FKs added in step 2).
--   2. Add nullable academic_year_id columns + FKs on promos and
--      enseignements. Nullable so existing rows remain valid.
--   3. Backfill etudiants.matricule for any NULL row using the
--      stable placeholder 'TMP-<id>'. Idempotent — re-running is a
--      no-op once every row has a value.
--   4. Promote etudiants.matricule to NOT NULL. The existing UNIQUE
--      constraint is preserved.
-- ─────────────────────────────────────────────────────────────

-- 1) AcademicYear table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "academic_years" (
  "id"         SERIAL       PRIMARY KEY,
  "name"       VARCHAR(20)  NOT NULL,
  "is_active"  BOOLEAN      NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "academic_years_name_key"
  ON "academic_years" ("name");

-- 2) FKs on promos and enseignements ───────────────────────────
ALTER TABLE "promos"
  ADD COLUMN IF NOT EXISTS "academic_year_id" INTEGER;

ALTER TABLE "enseignements"
  ADD COLUMN IF NOT EXISTS "academic_year_id" INTEGER;

-- FK constraints are added separately so the ADD COLUMN is idempotent
-- across re-runs even if the constraint was already created.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promos_academic_year_id_fkey'
  ) THEN
    ALTER TABLE "promos"
      ADD CONSTRAINT "promos_academic_year_id_fkey"
      FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enseignements_academic_year_id_fkey'
  ) THEN
    ALTER TABLE "enseignements"
      ADD CONSTRAINT "enseignements_academic_year_id_fkey"
      FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3) Backfill matricule for legacy NULL rows ───────────────────
-- Deterministic placeholder so the value is unique and traceable.
-- Admins can later overwrite it with the real student matricule.
UPDATE "etudiants"
   SET "matricule" = 'TMP-' || "id"
 WHERE "matricule" IS NULL;

-- 4) Enforce NOT NULL on matricule ─────────────────────────────
ALTER TABLE "etudiants"
  ALTER COLUMN "matricule" SET NOT NULL;
