-- Disciplinary workflow integrity constraints.
-- Enforces: no duplicate teacher in a conseil, exactly one president and
-- one rapporteur per conseil, and dossier status/decision/conseil consistency.

ALTER TABLE "membres_conseil"
  ADD CONSTRAINT "uq_membre_conseil"
  UNIQUE ("conseil_id", "enseignant_id");

CREATE UNIQUE INDEX "uq_president_par_conseil"
  ON "membres_conseil" ("conseil_id")
  WHERE "role" = 'president';

CREATE UNIQUE INDEX "uq_rapporteur_par_conseil"
  ON "membres_conseil" ("conseil_id")
  WHERE "role" = 'rapporteur';

ALTER TABLE "dossiers_disciplinaires"
  ADD CONSTRAINT "chk_traite_has_decision"
  CHECK ("status" <> 'traite' OR "decision_id" IS NOT NULL);

ALTER TABLE "dossiers_disciplinaires"
  ADD CONSTRAINT "chk_instruction_has_conseil"
  CHECK ("status" <> 'en_instruction' OR "conseil_id" IS NOT NULL);
