const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const statements = [
  // pfe_sujets: fields expected by current Prisma model/controllers
  `ALTER TABLE public.pfe_sujets ADD COLUMN IF NOT EXISTS valide_par INTEGER NULL;`,
  `ALTER TABLE public.pfe_sujets ADD COLUMN IF NOT EXISTS date_validation TIMESTAMP NULL;`,
  `ALTER TABLE public.pfe_sujets ADD COLUMN IF NOT EXISTS commentaire_admin_ar TEXT NULL;`,
  `ALTER TABLE public.pfe_sujets ADD COLUMN IF NOT EXISTS commentaire_admin_en TEXT NULL;`,

  // groups_pfe: fields expected by current Prisma model/controllers
  `ALTER TABLE public.groups_pfe ADD COLUMN IF NOT EXISTS validation_finale BOOLEAN NOT NULL DEFAULT FALSE;`,
  `ALTER TABLE public.groups_pfe ADD COLUMN IF NOT EXISTS date_validation_finale TIMESTAMP NULL;`,
  `ALTER TABLE public.groups_pfe ADD COLUMN IF NOT EXISTS valide_par_admin INTEGER NULL;`,
  `ALTER TABLE public.groups_pfe ADD COLUMN IF NOT EXISTS commentaire_admin_ar TEXT NULL;`,
  `ALTER TABLE public.groups_pfe ADD COLUMN IF NOT EXISTS commentaire_admin_en TEXT NULL;`,

  // optional foreign keys for traceability (only if not already present)
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'pfe_sujets_valide_par_fkey'
     ) THEN
       ALTER TABLE public.pfe_sujets
       ADD CONSTRAINT pfe_sujets_valide_par_fkey
       FOREIGN KEY (valide_par) REFERENCES public.users(id)
       ON DELETE SET NULL;
     END IF;
   END
   $$;`,
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'groups_pfe_valide_par_admin_fkey'
     ) THEN
       ALTER TABLE public.groups_pfe
       ADD CONSTRAINT groups_pfe_valide_par_admin_fkey
       FOREIGN KEY (valide_par_admin) REFERENCES public.users(id)
       ON DELETE SET NULL;
     END IF;
   END
   $$;`,
];

(async () => {
  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log("PFE runtime compatibility patch applied successfully.");
  } catch (error) {
    console.error("PFE runtime compatibility patch failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
