-- Event-driven user alerts
-- Keep compatibility with existing alerts table by reusing created_by/titre columns.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AlertType') THEN
    CREATE TYPE "AlertType" AS ENUM ('MEETING', 'DECISION', 'REQUEST');
  END IF;
END $$;

ALTER TABLE "alerts"
  ADD COLUMN IF NOT EXISTS "type" "AlertType";

UPDATE "alerts"
SET "type" = 'REQUEST'
WHERE "type" IS NULL;

ALTER TABLE "alerts"
  ALTER COLUMN "type" SET DEFAULT 'REQUEST',
  ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "alerts"
  ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN;

UPDATE "alerts"
SET "is_read" = false
WHERE "is_read" IS NULL;

ALTER TABLE "alerts"
  ALTER COLUMN "is_read" SET DEFAULT false,
  ALTER COLUMN "is_read" SET NOT NULL;

-- Prisma won't write updated_at in the new model, so give it a default.
ALTER TABLE "alerts"
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

UPDATE "alerts"
SET "updated_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP)
WHERE "updated_at" IS NULL;

CREATE INDEX IF NOT EXISTS "alerts_created_by_is_read_created_at_idx"
  ON "alerts" ("created_by", "is_read", "created_at" DESC);
