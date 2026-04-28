/**
 * Idempotent seed for ReclamationType + TypeAbsence.
 *
 * Safe to run multiple times:
 *   - Each catalog entry has a stable `code` (primary key for the seed).
 *   - Rows are upserted on `code` — never deleted.
 *   - Historical reclamations/justifications that reference older IDs are
 *     untouched. Names on those old rows are promoted by the migration
 *     (20260424000000_request_type_labels) so user-facing text stays clean.
 *
 * Usage:
 *   npx ts-node --transpile-only prisma/seeds/request-types.seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CatalogEntry = {
  code: string;
  nom_ar: string;
  nom_en: string;
  description_ar?: string;
  description_en?: string;
};

const RECLAMATION_TYPE_CATALOG: CatalogEntry[] = [
  {
    code: "GRADE_ERROR",
    nom_ar: "خطأ في العلامات",
    nom_en: "Grade Error",
    description_ar: "مشكلة تتعلق بعلامات امتحان أو تقييم.",
    description_en: "Issue related to marks or exam grading.",
  },
  {
    code: "SCHEDULE_CONFLICT",
    nom_ar: "تعارض في الجدول",
    nom_en: "Schedule Conflict",
    description_ar: "تعارض في جدول الدراسة أو الامتحانات.",
    description_en: "Conflict in timetable or exam schedule.",
  },
  {
    code: "ADMIN_ERROR",
    nom_ar: "خطأ إداري",
    nom_en: "Administrative Error",
    description_ar: "مشكلة إدارية أو تتعلق بالتسجيل.",
    description_en: "Administrative or registration issue.",
  },
  {
    code: "DOCUMENT_REQUEST",
    nom_ar: "طلب وثيقة",
    nom_en: "Document Request",
    description_ar: "طلب شهادة أو وثيقة رسمية.",
    description_en: "Request for a transcript or official document.",
  },
  {
    code: "OTHER",
    nom_ar: "أخرى",
    nom_en: "Other",
    description_ar: "أنواع أخرى من الشكاوى.",
    description_en: "Other reclamation reasons.",
  },
];

const JUSTIFICATION_TYPE_CATALOG: CatalogEntry[] = [
  {
    code: "MEDICAL",
    nom_ar: "طبي",
    nom_en: "Medical",
    description_ar: "سبب طبي بوثيقة داعمة.",
    description_en: "Medical reason with supporting document.",
  },
  {
    code: "FAMILY",
    nom_ar: "طارئ عائلي",
    nom_en: "Family Emergency",
    description_ar: "ظرف عائلي طارئ.",
    description_en: "Urgent family situation.",
  },
  {
    code: "ACADEMIC_OVERLAP",
    nom_ar: "تداخل أكاديمي",
    nom_en: "Academic Overlap",
    description_ar: "تداخل مع نشاط أكاديمي رسمي آخر.",
    description_en: "Overlap with another official academic activity.",
  },
  {
    code: "ADMIN",
    nom_ar: "سبب إداري",
    nom_en: "Administrative Reason",
    description_ar: "سبب مؤسسي أو إداري.",
    description_en: "Institutional or administrative reason.",
  },
  {
    code: "TRANSPORT",
    nom_ar: "نقل",
    nom_en: "Transport",
    description_ar: "مشكلة نقل أو مواصلات.",
    description_en: "Transport or commute issue.",
  },
  {
    code: "OTHER",
    nom_ar: "أخرى",
    nom_en: "Other",
    description_ar: "أسباب أخرى للتغيب.",
    description_en: "Other absence reasons.",
  },
];

const seedReclamationTypes = async () => {
  for (const entry of RECLAMATION_TYPE_CATALOG) {
    const existingByCode = await prisma.reclamationType.findUnique({
      where: { code: entry.code },
    });

    if (existingByCode) {
      await prisma.reclamationType.update({
        where: { id: existingByCode.id },
        data: {
          nom_ar: entry.nom_ar,
          nom_en: entry.nom_en,
          description_ar: entry.description_ar ?? existingByCode.description_ar,
          description_en: entry.description_en ?? existingByCode.description_en,
        },
      });
      continue;
    }

    // Match by label if a legacy row exists without a code (e.g. from
    // the old ensureDefaultReclamationTypes helper) so we don't double-seed.
    const existingByName = await prisma.reclamationType.findFirst({
      where: {
        OR: [
          { nom_en: { equals: entry.nom_en, mode: "insensitive" } },
          { nom_ar: { equals: entry.nom_ar, mode: "insensitive" } },
        ],
      },
    });

    if (existingByName) {
      await prisma.reclamationType.update({
        where: { id: existingByName.id },
        data: {
          code: entry.code,
          nom_ar: entry.nom_ar,
          nom_en: entry.nom_en,
          description_ar: entry.description_ar ?? existingByName.description_ar,
          description_en: entry.description_en ?? existingByName.description_en,
        },
      });
      continue;
    }

    await prisma.reclamationType.create({
      data: {
        code: entry.code,
        nom_ar: entry.nom_ar,
        nom_en: entry.nom_en,
        description_ar: entry.description_ar ?? null,
        description_en: entry.description_en ?? null,
      },
    });
  }
};

const seedJustificationTypes = async () => {
  for (const entry of JUSTIFICATION_TYPE_CATALOG) {
    const existingByCode = await prisma.typeAbsence.findUnique({
      where: { code: entry.code },
    });

    if (existingByCode) {
      await prisma.typeAbsence.update({
        where: { id: existingByCode.id },
        data: {
          nom_ar: entry.nom_ar,
          nom_en: entry.nom_en,
          description_ar: entry.description_ar ?? existingByCode.description_ar,
          description_en: entry.description_en ?? existingByCode.description_en,
        },
      });
      continue;
    }

    const existingByName = await prisma.typeAbsence.findFirst({
      where: {
        OR: [
          { nom_en: { equals: entry.nom_en, mode: "insensitive" } },
          { nom_ar: { equals: entry.nom_ar, mode: "insensitive" } },
        ],
      },
    });

    if (existingByName) {
      await prisma.typeAbsence.update({
        where: { id: existingByName.id },
        data: {
          code: entry.code,
          nom_ar: entry.nom_ar,
          nom_en: entry.nom_en,
          description_ar: entry.description_ar ?? existingByName.description_ar,
          description_en: entry.description_en ?? existingByName.description_en,
        },
      });
      continue;
    }

    await prisma.typeAbsence.create({
      data: {
        code: entry.code,
        nom_ar: entry.nom_ar,
        nom_en: entry.nom_en,
        description_ar: entry.description_ar ?? null,
        description_en: entry.description_en ?? null,
      },
    });
  }
};

export const seedRequestTypes = async () => {
  await seedReclamationTypes();
  await seedJustificationTypes();
};

if (require.main === module) {
  seedRequestTypes()
    .then(() => {
      console.log("✅ Reclamation + justification type catalogs seeded");
    })
    .catch((error) => {
      console.error("❌ Failed to seed request types:", error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
