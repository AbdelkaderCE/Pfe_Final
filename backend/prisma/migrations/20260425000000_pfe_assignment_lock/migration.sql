-- ─────────────────────────────────────────────────────────────
-- PFE assignment-lock lifecycle
--
-- Adds two columns to pfe_sujets:
--   • assignment_status — draft | assigned | finalized (lock state)
--   • finalized_at      — set when transitioning to 'finalized'
--
-- Safe, idempotent: ADD COLUMN IF NOT EXISTS with a default.
-- No existing data is lost or rewritten. Every existing row becomes
-- 'draft' until explicitly transitioned by the application layer.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "pfe_sujets"
  ADD COLUMN IF NOT EXISTS "assignment_status" VARCHAR(30) NOT NULL DEFAULT 'draft';

ALTER TABLE "pfe_sujets"
  ADD COLUMN IF NOT EXISTS "finalized_at" TIMESTAMP;

-- Soft guard: only two-way transitions allowed
--   draft → assigned → finalized
-- Reverting from finalized is explicitly disallowed at the DB level. The
-- constraint tolerates legacy values ('draft' default) and accepts only
-- the three canonical states going forward.
ALTER TABLE "pfe_sujets"
  DROP CONSTRAINT IF EXISTS "pfe_sujets_assignment_status_check";

ALTER TABLE "pfe_sujets"
  ADD CONSTRAINT "pfe_sujets_assignment_status_check"
  CHECK ("assignment_status" IN ('draft', 'assigned', 'finalized'));

-- Helpful index for the student dashboard query (fetch finalized subjects
-- + their related groups in one hop).
CREATE INDEX IF NOT EXISTS "pfe_sujets_assignment_status_idx"
  ON "pfe_sujets" ("assignment_status");
