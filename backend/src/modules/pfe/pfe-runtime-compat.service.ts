import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
};

type ColumnPatch = {
  tableName: string;
  columnName: string;
  ddl: string;
};

const columnPatches: ColumnPatch[] = [
  {
    tableName: "pfe_sujets",
    columnName: "valide_par",
    ddl: `ALTER TABLE public.pfe_sujets ADD COLUMN valide_par INTEGER NULL`,
  },
  {
    tableName: "pfe_sujets",
    columnName: "date_validation",
    ddl: `ALTER TABLE public.pfe_sujets ADD COLUMN date_validation TIMESTAMP NULL`,
  },
  {
    tableName: "pfe_sujets",
    columnName: "commentaire_admin_ar",
    ddl: `ALTER TABLE public.pfe_sujets ADD COLUMN commentaire_admin_ar TEXT NULL`,
  },
  {
    tableName: "pfe_sujets",
    columnName: "commentaire_admin_en",
    ddl: `ALTER TABLE public.pfe_sujets ADD COLUMN commentaire_admin_en TEXT NULL`,
  },
  {
    tableName: "groups_pfe",
    columnName: "validation_finale",
    ddl: `ALTER TABLE public.groups_pfe ADD COLUMN validation_finale BOOLEAN NOT NULL DEFAULT FALSE`,
  },
  {
    tableName: "groups_pfe",
    columnName: "date_validation_finale",
    ddl: `ALTER TABLE public.groups_pfe ADD COLUMN date_validation_finale TIMESTAMP NULL`,
  },
  {
    tableName: "groups_pfe",
    columnName: "valide_par_admin",
    ddl: `ALTER TABLE public.groups_pfe ADD COLUMN valide_par_admin INTEGER NULL`,
  },
  {
    tableName: "groups_pfe",
    columnName: "commentaire_admin_ar",
    ddl: `ALTER TABLE public.groups_pfe ADD COLUMN commentaire_admin_ar TEXT NULL`,
  },
  {
    tableName: "groups_pfe",
    columnName: "commentaire_admin_en",
    ddl: `ALTER TABLE public.groups_pfe ADD COLUMN commentaire_admin_en TEXT NULL`,
  },
];

const tableNamePattern = /^[a-z_]+$/;
const identifierPattern = /^[a-z_]+$/;

const quoteLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`;

const ensureColumn = async (patch: ColumnPatch): Promise<void> => {
  if (!tableNamePattern.test(patch.tableName) || !identifierPattern.test(patch.columnName)) {
    throw new Error(`Invalid identifier in column patch: ${patch.tableName}.${patch.columnName}`);
  }

  const tableLiteral = quoteLiteral(patch.tableName);
  const columnLiteral = quoteLiteral(patch.columnName);

  const rows = (await prisma.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${tableLiteral} AND column_name = ${columnLiteral} LIMIT 1`
  )) as Array<{ '?column?': number }>;

  if (!rows.length) {
    await prisma.$executeRawUnsafe(patch.ddl);
  }
};

const ensureConstraint = async (constraintName: string, ddl: string): Promise<void> => {
  if (!identifierPattern.test(constraintName)) {
    throw new Error(`Invalid constraint name: ${constraintName}`);
  }

  const constraintLiteral = quoteLiteral(constraintName);
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT 1 FROM pg_constraint WHERE conname = ${constraintLiteral} LIMIT 1`
  )) as Array<{ '?column?': number }>;

  if (!rows.length) {
    await prisma.$executeRawUnsafe(ddl);
  }
};

export const ensurePfeRuntimeCompatibility = async (): Promise<void> => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.pfe_config (
      id SERIAL PRIMARY KEY,
      nom_config VARCHAR(100) NOT NULL UNIQUE,
      valeur VARCHAR(50) NOT NULL,
      description_ar TEXT NULL,
      description_en TEXT NULL,
      annee_universitaire VARCHAR(20) NOT NULL,
      created_by INTEGER NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  for (const patch of columnPatches) {
    await ensureColumn(patch);
  }

  await ensureConstraint(
    "pfe_sujets_valide_par_fkey",
    `ALTER TABLE public.pfe_sujets ADD CONSTRAINT pfe_sujets_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.users(id) ON DELETE SET NULL`
  );

  await ensureConstraint(
    "groups_pfe_valide_par_admin_fkey",
    `ALTER TABLE public.groups_pfe ADD CONSTRAINT groups_pfe_valide_par_admin_fkey FOREIGN KEY (valide_par_admin) REFERENCES public.users(id) ON DELETE SET NULL`
  );

  const academicYear = getCurrentAcademicYear();
  const configName = "proposition_sujets_ouverte";
  const configValue = "true";
  const descriptionAr = "السماح باقتراح المواضيع من قبل الأساتذة";

  const configNameLiteral = quoteLiteral(configName);
  const configValueLiteral = quoteLiteral(configValue);
  const descriptionArLiteral = quoteLiteral(descriptionAr);
  const academicYearLiteral = quoteLiteral(academicYear);

  await prisma.$executeRawUnsafe(`
    INSERT INTO public.pfe_config (nom_config, valeur, description_ar, annee_universitaire, created_by, created_at, updated_at)
    VALUES (${configNameLiteral}, ${configValueLiteral}, ${descriptionArLiteral}, ${academicYearLiteral}, NULL, NOW(), NOW())
    ON CONFLICT (nom_config)
    DO UPDATE SET
      valeur = EXCLUDED.valeur,
      annee_universitaire = EXCLUDED.annee_universitaire,
      updated_at = NOW()
  `);
};
