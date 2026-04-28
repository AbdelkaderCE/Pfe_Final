-- Add teacher-validation columns to group_sujets.
-- Idempotent: can be re-applied safely. No existing data is modified.

-- ── 1. Add the 4 nullable columns (only if missing) ─────────────────────────
ALTER TABLE "group_sujets"
  ADD COLUMN IF NOT EXISTS "valide_par_enseignant" INTEGER;

ALTER TABLE "group_sujets"
  ADD COLUMN IF NOT EXISTS "date_reponse_enseignant" TIMESTAMP(3);

ALTER TABLE "group_sujets"
  ADD COLUMN IF NOT EXISTS "commentaire_enseignant_ar" TEXT;

ALTER TABLE "group_sujets"
  ADD COLUMN IF NOT EXISTS "commentaire_enseignant_en" TEXT;

-- ── 2. Add the FK on valide_par_enseignant → enseignants(id), only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'group_sujets'
      AND constraint_name = 'group_sujets_valide_par_enseignant_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "group_sujets"
      ADD CONSTRAINT "group_sujets_valide_par_enseignant_fkey"
      FOREIGN KEY ("valide_par_enseignant")
      REFERENCES "enseignants" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
