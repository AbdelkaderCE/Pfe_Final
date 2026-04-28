-- Align pfe_sujets with the current Prisma schema (bilingual + admin validation).
-- Idempotent: uses IF NOT EXISTS / IF EXISTS guards so it can be re-applied safely
-- and works whether the initial migration, a db push, or nothing has touched the table.

-- ── 1. Add bilingual columns (nullable first, so existing rows survive) ────────
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "titre_ar"         VARCHAR(255);
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "titre_en"         VARCHAR(255);
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "description_ar"   TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "description_en"   TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "keywords_ar"      TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "keywords_en"      TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "workplan_ar"      TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "workplan_en"      TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "bibliographie_ar" TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "bibliographie_en" TEXT;

-- ── 2. Add admin validation columns ──────────────────────────────────────────
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "valide_par"           INTEGER;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "date_validation"      TIMESTAMP(3);
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "commentaire_admin_ar" TEXT;
ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "commentaire_admin_en" TEXT;

-- ── 3. Backfill new columns from legacy singular columns if they exist ───────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pfe_sujets' AND column_name = 'titre') THEN
    UPDATE "pfe_sujets" SET "titre_ar" = "titre"
     WHERE "titre_ar" IS NULL AND "titre" IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pfe_sujets' AND column_name = 'description') THEN
    UPDATE "pfe_sujets" SET "description_ar" = "description"
     WHERE "description_ar" IS NULL AND "description" IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pfe_sujets' AND column_name = 'keywords') THEN
    UPDATE "pfe_sujets" SET "keywords_ar" = "keywords"
     WHERE "keywords_ar" IS NULL AND "keywords" IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pfe_sujets' AND column_name = 'workplan') THEN
    UPDATE "pfe_sujets" SET "workplan_ar" = "workplan"
     WHERE "workplan_ar" IS NULL AND "workplan" IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pfe_sujets' AND column_name = 'bibliographie') THEN
    UPDATE "pfe_sujets" SET "bibliographie_ar" = "bibliographie"
     WHERE "bibliographie_ar" IS NULL AND "bibliographie" IS NOT NULL;
  END IF;
END $$;

-- ── 4. Guarantee required columns are populated before NOT NULL ──────────────
UPDATE "pfe_sujets" SET "titre_ar"       = COALESCE("titre_ar", '—')
 WHERE "titre_ar" IS NULL;
UPDATE "pfe_sujets" SET "description_ar" = COALESCE("description_ar", '—')
 WHERE "description_ar" IS NULL;

-- ── 5. Enforce NOT NULL on the required bilingual columns ────────────────────
ALTER TABLE "pfe_sujets" ALTER COLUMN "titre_ar"       SET NOT NULL;
ALTER TABLE "pfe_sujets" ALTER COLUMN "description_ar" SET NOT NULL;

-- ── 6. Make legacy columns nullable so Prisma inserts (which no longer know
--      about them) don't violate NOT NULL. Legacy data kept for rollback.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pfe_sujets' AND column_name = 'titre'
               AND is_nullable = 'NO') THEN
    ALTER TABLE "pfe_sujets" ALTER COLUMN "titre" DROP NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'pfe_sujets' AND column_name = 'description'
               AND is_nullable = 'NO') THEN
    ALTER TABLE "pfe_sujets" ALTER COLUMN "description" DROP NOT NULL;
  END IF;
END $$;

-- ── 7. FK: valide_par → users(id) ────────────────────────────────────────────
ALTER TABLE "pfe_sujets" DROP CONSTRAINT IF EXISTS "pfe_sujets_valide_par_fkey";
ALTER TABLE "pfe_sujets"
  ADD CONSTRAINT "pfe_sujets_valide_par_fkey"
  FOREIGN KEY ("valide_par") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
