-- ─────────────────────────────────────────────────────────────
-- Structured labels for ReclamationType + TypeAbsence
--
-- Safe, idempotent: ADD COLUMN IF NOT EXISTS + data-only UPDATEs.
-- Does NOT delete existing rows so reclamations/justifications that
-- reference placeholder type IDs keep working. Instead, placeholder
-- rows are RENAMED in-place to proper labels.
-- ─────────────────────────────────────────────────────────────

-- 1. Add the optional `code` column (unique, nullable).
ALTER TABLE "reclamation_types"
  ADD COLUMN IF NOT EXISTS "code" VARCHAR(60);

ALTER TABLE "type_absence"
  ADD COLUMN IF NOT EXISTS "code" VARCHAR(60);

-- 2. Unique index on code (only when non-null).
CREATE UNIQUE INDEX IF NOT EXISTS "reclamation_types_code_key"
  ON "reclamation_types" ("code")
  WHERE "code" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "type_absence_code_key"
  ON "type_absence" ("code")
  WHERE "code" IS NOT NULL;

-- 3. Backfill: any row whose name looks like a placeholder ("type1",
--    "type 2", "type-3", or NULL/empty on both locales) gets promoted
--    to a proper labeled row. We do this deterministically by id order
--    so the first placeholder becomes OTHER, the rest stay as "OTHER_N".
--
--    Placeholder detection is intentionally conservative: we only touch
--    rows where BOTH locale names are placeholder-shaped, so a legitimate
--    row with meaningful nom_en or nom_ar is left untouched.

WITH placeholders AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM "reclamation_types"
  WHERE
    (
      (nom_ar IS NULL OR btrim(nom_ar) = '' OR nom_ar ~* '^type[[:space:]_-]*[0-9]+$')
      AND
      (nom_en IS NULL OR btrim(nom_en) = '' OR nom_en ~* '^type[[:space:]_-]*[0-9]+$')
    )
)
UPDATE "reclamation_types" AS t
SET
  nom_ar = CASE WHEN p.rn = 1 THEN 'أخرى' ELSE COALESCE(t.nom_ar, 'أخرى ' || p.rn::text) END,
  nom_en = CASE WHEN p.rn = 1 THEN 'Other' ELSE COALESCE(t.nom_en, 'Other ' || p.rn::text) END,
  description_ar = COALESCE(t.description_ar, 'تم إنشاء هذا النوع تلقائيًا.'),
  description_en = COALESCE(t.description_en, 'Auto-created placeholder — please review.'),
  code = COALESCE(t.code, CASE WHEN p.rn = 1 THEN 'OTHER' ELSE 'OTHER_' || p.rn::text END)
FROM placeholders p
WHERE t.id = p.id;

WITH placeholders AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM "type_absence"
  WHERE
    (
      (nom_ar IS NULL OR btrim(nom_ar) = '' OR nom_ar ~* '^type[[:space:]_-]*[0-9]+$')
      AND
      (nom_en IS NULL OR btrim(nom_en) = '' OR nom_en ~* '^type[[:space:]_-]*[0-9]+$')
    )
)
UPDATE "type_absence" AS t
SET
  nom_ar = CASE WHEN p.rn = 1 THEN 'أخرى' ELSE COALESCE(t.nom_ar, 'أخرى ' || p.rn::text) END,
  nom_en = CASE WHEN p.rn = 1 THEN 'Other' ELSE COALESCE(t.nom_en, 'Other ' || p.rn::text) END,
  description_ar = COALESCE(t.description_ar, 'تم إنشاء هذا النوع تلقائيًا.'),
  description_en = COALESCE(t.description_en, 'Auto-created placeholder — please review.'),
  code = COALESCE(t.code, CASE WHEN p.rn = 1 THEN 'OTHER' ELSE 'OTHER_' || p.rn::text END)
FROM placeholders p
WHERE t.id = p.id;
