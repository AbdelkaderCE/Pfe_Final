-- ─────────────────────────────────────────────────────────────
-- StatusSujet enum — add 'refuse'
--
-- Existing rejection flow shoehorned the rejected state into the
-- 'termine' value (see backend/src/modules/pfe/adminPfe.controller.js
-- ::refuserSujet). With this migration, 'refuse' becomes the canonical
-- terminal state for an admin-rejected subject and the controller is
-- updated to use it.
--
-- Postgres rule: ALTER TYPE ... ADD VALUE cannot be combined in the
-- same transaction with statements that USE the new value, so this
-- change ships in its own migration file.
--
-- Backfill: existing rows already at 'termine' are NOT auto-migrated.
-- 'termine' may have meant either "completed" or "rejected" historically;
-- only the application has the context to disambiguate. Manual cleanup
-- if needed: `UPDATE pfe_sujets SET status = 'refuse' WHERE id IN (...);`
-- ─────────────────────────────────────────────────────────────

ALTER TYPE "StatusSujet" ADD VALUE IF NOT EXISTS 'refuse';
