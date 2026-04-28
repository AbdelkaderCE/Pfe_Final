-- ─────────────────────────────────────────────────────────────
-- TypeEnseignement enum — add 'online'
--
-- Postgres rule: ALTER TYPE ... ADD VALUE cannot be combined in the
-- same transaction with statements that USE the new value. Keeping
-- this change in its own migration file guarantees the new value is
-- visible to every subsequent migration / write path.
--
-- Existing values ('cours', 'td', 'tp') are untouched. Existing rows
-- and code paths continue to work unchanged.
-- ─────────────────────────────────────────────────────────────

ALTER TYPE "TypeEnseignement" ADD VALUE IF NOT EXISTS 'online';
