const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const statements = [
  // facultes
  'ALTER TABLE "facultes" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(200);',
  'ALTER TABLE "facultes" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(200);',
  'UPDATE "facultes" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom");',
  'ALTER TABLE "facultes" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // departements
  'ALTER TABLE "departements" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(200);',
  'ALTER TABLE "departements" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(200);',
  'UPDATE "departements" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom");',
  'ALTER TABLE "departements" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // filieres
  'ALTER TABLE "filieres" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "filieres" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'ALTER TABLE "filieres" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "filieres" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "filieres" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',
  'ALTER TABLE "filieres" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // specialites
  'ALTER TABLE "specialites" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "specialites" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'UPDATE "specialites" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom");',
  'ALTER TABLE "specialites" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // modules
  'ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(150);',
  'ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(150);',
  'ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "modules" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',
  'ALTER TABLE "modules" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // groups_pfe
  'ALTER TABLE "groups_pfe" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "groups_pfe" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'UPDATE "groups_pfe" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom");',
  'ALTER TABLE "groups_pfe" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // infractions
  'ALTER TABLE "infractions" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "infractions" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'ALTER TABLE "infractions" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "infractions" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "infractions" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',
  'ALTER TABLE "infractions" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // pfe_sujets
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "titre_ar" VARCHAR(255);',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "titre_en" VARCHAR(255);',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "keywords_ar" TEXT;',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "keywords_en" TEXT;',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "workplan_ar" TEXT;',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "workplan_en" TEXT;',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "bibliographie_ar" TEXT;',
  'ALTER TABLE "pfe_sujets" ADD COLUMN IF NOT EXISTS "bibliographie_en" TEXT;',
  'UPDATE "pfe_sujets" SET "titre_ar" = COALESCE("titre_ar", "titre"), "titre_en" = COALESCE("titre_en", "titre"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',
  'UPDATE "pfe_sujets" SET "keywords_ar" = COALESCE("keywords_ar", "keywords"), "keywords_en" = COALESCE("keywords_en", "keywords"), "workplan_ar" = COALESCE("workplan_ar", "workplan"), "workplan_en" = COALESCE("workplan_en", "workplan"), "bibliographie_ar" = COALESCE("bibliographie_ar", "bibliographie"), "bibliographie_en" = COALESCE("bibliographie_en", "bibliographie");',
  'ALTER TABLE "pfe_sujets" ALTER COLUMN "titre_ar" SET NOT NULL;',
  'ALTER TABLE "pfe_sujets" ALTER COLUMN "description_ar" SET NOT NULL;',

  // campagne_affectation
  'ALTER TABLE "campagne_affectation" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(150);',
  'ALTER TABLE "campagne_affectation" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(150);',
  'UPDATE "campagne_affectation" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom");',
  'ALTER TABLE "campagne_affectation" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // reclamations
  'ALTER TABLE "reclamations" ADD COLUMN IF NOT EXISTS "objet_ar" VARCHAR(255);',
  'ALTER TABLE "reclamations" ADD COLUMN IF NOT EXISTS "objet_en" VARCHAR(255);',
  'ALTER TABLE "reclamations" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "reclamations" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'ALTER TABLE "reclamations" ADD COLUMN IF NOT EXISTS "reponse_ar" TEXT;',
  'ALTER TABLE "reclamations" ADD COLUMN IF NOT EXISTS "reponse_en" TEXT;',
  'UPDATE "reclamations" SET "objet_ar" = COALESCE("objet_ar", "objet"), "objet_en" = COALESCE("objet_en", "objet"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description"), "reponse_ar" = COALESCE("reponse_ar", "reponse"), "reponse_en" = COALESCE("reponse_en", "reponse");',
  'ALTER TABLE "reclamations" ALTER COLUMN "objet_ar" SET NOT NULL;',
  'ALTER TABLE "reclamations" ALTER COLUMN "description_ar" SET NOT NULL;',

  // justifications
  'ALTER TABLE "justifications" ADD COLUMN IF NOT EXISTS "motif_ar" TEXT;',
  'ALTER TABLE "justifications" ADD COLUMN IF NOT EXISTS "motif_en" TEXT;',
  'ALTER TABLE "justifications" ADD COLUMN IF NOT EXISTS "commentaire_admin_ar" TEXT;',
  'ALTER TABLE "justifications" ADD COLUMN IF NOT EXISTS "commentaire_admin_en" TEXT;',
  'UPDATE "justifications" SET "motif_ar" = COALESCE("motif_ar", "motif"), "motif_en" = COALESCE("motif_en", "motif"), "commentaire_admin_ar" = COALESCE("commentaire_admin_ar", "commentaire_admin"), "commentaire_admin_en" = COALESCE("commentaire_admin_en", "commentaire_admin");',

  // annonces
  'ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "titre_ar" VARCHAR(255);',
  'ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "titre_en" VARCHAR(255);',
  'ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "contenu_ar" TEXT;',
  'ALTER TABLE "annonces" ADD COLUMN IF NOT EXISTS "contenu_en" TEXT;',
  'UPDATE "annonces" SET "titre_ar" = COALESCE("titre_ar", "titre"), "titre_en" = COALESCE("titre_en", "titre"), "contenu_ar" = COALESCE("contenu_ar", "contenu"), "contenu_en" = COALESCE("contenu_en", "contenu");',
  'ALTER TABLE "annonces" ALTER COLUMN "titre_ar" SET NOT NULL;',
  'ALTER TABLE "annonces" ALTER COLUMN "contenu_ar" SET NOT NULL;',

  // grades
  'ALTER TABLE "grades" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "grades" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'ALTER TABLE "grades" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "grades" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "grades" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',

  // promos
  'ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'UPDATE "promos" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom");',

  // reclamation_types
  'ALTER TABLE "reclamation_types" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(150);',
  'ALTER TABLE "reclamation_types" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(150);',
  'ALTER TABLE "reclamation_types" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "reclamation_types" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "reclamation_types" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',

  // type_absence
  'ALTER TABLE "type_absence" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "type_absence" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'ALTER TABLE "type_absence" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "type_absence" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "type_absence" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',

  // decisions
  'ALTER TABLE "decisions" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(150);',
  'ALTER TABLE "decisions" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(150);',
  'ALTER TABLE "decisions" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "decisions" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "decisions" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',
  'ALTER TABLE "decisions" ALTER COLUMN "nom_ar" SET NOT NULL;',

  // document_types
  'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(150);',
  'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(150);',
  'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "document_types" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',

  // annonce_types
  'ALTER TABLE "annonce_types" ADD COLUMN IF NOT EXISTS "nom_ar" VARCHAR(100);',
  'ALTER TABLE "annonce_types" ADD COLUMN IF NOT EXISTS "nom_en" VARCHAR(100);',
  'ALTER TABLE "annonce_types" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "annonce_types" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  'UPDATE "annonce_types" SET "nom_ar" = COALESCE("nom_ar", "nom"), "nom_en" = COALESCE("nom_en", "nom"), "description_ar" = COALESCE("description_ar", "description"), "description_en" = COALESCE("description_en", "description");',

  // dossiers_disciplinaires
  'ALTER TABLE "dossiers_disciplinaires" ADD COLUMN IF NOT EXISTS "description_signal_ar" TEXT;',
  'ALTER TABLE "dossiers_disciplinaires" ADD COLUMN IF NOT EXISTS "description_signal_en" TEXT;',
  'ALTER TABLE "dossiers_disciplinaires" ADD COLUMN IF NOT EXISTS "remarque_decision_ar" TEXT;',
  'ALTER TABLE "dossiers_disciplinaires" ADD COLUMN IF NOT EXISTS "remarque_decision_en" TEXT;',
  'UPDATE "dossiers_disciplinaires" SET "description_signal_ar" = COALESCE("description_signal_ar", "description_signal"), "description_signal_en" = COALESCE("description_signal_en", "description_signal"), "remarque_decision_ar" = COALESCE("remarque_decision_ar", "remarque_decision"), "remarque_decision_en" = COALESCE("remarque_decision_en", "remarque_decision");',

  // conseils_disciplinaires
  'ALTER TABLE "conseils_disciplinaires" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "conseils_disciplinaires" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  `DO $$
   BEGIN
     IF EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'conseils_disciplinaires'
         AND column_name = 'description'
     ) THEN
       UPDATE "conseils_disciplinaires"
       SET "description_ar" = COALESCE("description_ar", "description"),
           "description_en" = COALESCE("description_en", "description");
     END IF;
   END
   $$;`,

  // document_requests
  'ALTER TABLE "document_requests" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;',
  'ALTER TABLE "document_requests" ADD COLUMN IF NOT EXISTS "description_en" TEXT;',
  `DO $$
   BEGIN
     IF EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'document_requests'
         AND column_name = 'description'
     ) THEN
       UPDATE "document_requests"
       SET "description_ar" = COALESCE("description_ar", "description"),
           "description_en" = COALESCE("description_en", "description");
     END IF;
   END
   $$;`,

  // alerts enums + table
  `DO $$
   BEGIN
     CREATE TYPE "AlertAudience" AS ENUM ('all', 'etudiants', 'enseignants', 'admins');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END
   $$;`,
  `DO $$
   BEGIN
     CREATE TYPE "AlertLevel" AS ENUM ('info', 'warning', 'critical');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END
   $$;`,
  `CREATE TABLE IF NOT EXISTS "alerts" (
      "id" SERIAL PRIMARY KEY,
      "titre" VARCHAR(255) NOT NULL,
      "message" TEXT NOT NULL,
      "audience" "AlertAudience" NOT NULL DEFAULT 'all',
      "level" "AlertLevel" NOT NULL DEFAULT 'info',
      "starts_at" TIMESTAMP NULL,
      "ends_at" TIMESTAMP NULL,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
  `CREATE INDEX IF NOT EXISTS "alerts_active_ends_at_idx" ON "alerts"("active", "ends_at");`
];

(async () => {
  try {
    for (const [i, sql] of statements.entries()) {
      await prisma.$executeRawUnsafe(sql);
      if ((i + 1) % 10 === 0) {
        console.log(`Applied ${i + 1}/${statements.length}`);
      }
    }
    console.log("Compatibility patch complete");
  } catch (error) {
    console.error("Compatibility patch failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
