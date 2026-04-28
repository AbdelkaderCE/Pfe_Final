import prisma from "../../config/database";
import type { Prisma, TypeEnseignement } from "@prisma/client";

export class EnseignementServiceError extends Error {
  statusCode: number;
  code: string;
  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "EnseignementServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const VALID_TYPES: TypeEnseignement[] = ["cours", "td", "tp", "online"];

const requirePositiveInt = (value: unknown, field: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new EnseignementServiceError(
      "INVALID_FIELD",
      `Field "${field}" must be a positive integer`
    );
  }
  return parsed;
};

const optionalPositiveInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const requireType = (value: unknown): TypeEnseignement => {
  if (typeof value !== "string") {
    throw new EnseignementServiceError(
      "INVALID_TYPE",
      `Field "type" is required (one of: ${VALID_TYPES.join(", ")})`
    );
  }
  const normalized = value.trim().toLowerCase();
  if (!VALID_TYPES.includes(normalized as TypeEnseignement)) {
    throw new EnseignementServiceError(
      "INVALID_TYPE",
      `Field "type" must be one of: ${VALID_TYPES.join(", ")}`
    );
  }
  return normalized as TypeEnseignement;
};

const optionalType = (value: unknown): TypeEnseignement | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  return requireType(value);
};

const optionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const enseignementInclude = {
  module: {
    select: {
      id: true,
      code: true,
      nom_ar: true,
      nom_en: true,
      semestre: true,
      specialiteId: true,
    },
  },
  promo: { select: { id: true, nom_ar: true, nom_en: true, section: true } },
  enseignant: {
    select: {
      id: true,
      user: { select: { id: true, nom: true, prenom: true, email: true } },
      grade: { select: { id: true, nom_ar: true, nom_en: true } },
    },
  },
  academicYear: { select: { id: true, name: true, isActive: true } },
} satisfies Prisma.EnseignementInclude;

/**
 * Resolve the year scope. Three states are supported:
 *   - explicit numeric academicYearId → use it
 *   - allYears = true                 → no year filter
 *   - neither                          → default to the active academic year
 *                                        (or no filter if no active year exists)
 *
 * The "default to active year" rule unifies dashboards: every consumer that
 * doesn't pass an explicit year now sees the canonical current view.
 */
const resolveYearScope = async (input: {
  academicYearId?: number;
  allYears?: boolean;
}): Promise<number | undefined> => {
  if (input.allYears) return undefined;
  if (typeof input.academicYearId === "number" && input.academicYearId > 0) {
    return input.academicYearId;
  }
  const active = await prisma.academicYear.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  return active?.id;
};

export const listEnseignements = async (filter?: {
  enseignantId?: number;
  moduleId?: number;
  promoId?: number;
  academicYearId?: number;
  allYears?: boolean;
  type?: TypeEnseignement;
}) => {
  const where: Prisma.EnseignementWhereInput = {};
  if (filter?.enseignantId) where.enseignantId = filter.enseignantId;
  if (filter?.moduleId) where.moduleId = filter.moduleId;
  if (filter?.promoId) where.promoId = filter.promoId;
  if (filter?.type) where.type = filter.type;

  const yearId = await resolveYearScope({
    academicYearId: filter?.academicYearId,
    allYears: filter?.allYears,
  });
  if (yearId !== undefined) where.academicYearId = yearId;

  return prisma.enseignement.findMany({
    where,
    include: enseignementInclude,
    orderBy: [{ academicYearId: "desc" }, { promoId: "asc" }, { moduleId: "asc" }],
  });
};

export const getEnseignementById = async (id: number) => {
  const found = await prisma.enseignement.findUnique({
    where: { id },
    include: enseignementInclude,
  });
  if (!found) {
    throw new EnseignementServiceError("NOT_FOUND", "Enseignement not found", 404);
  }
  return found;
};

const ensureFkExist = async (data: {
  enseignantId?: number;
  moduleId?: number;
  promoId?: number;
  academicYearId?: number;
}) => {
  const checks: Promise<unknown>[] = [];
  const errors: { field: string; promise: Promise<{ id: number } | null> }[] = [];

  if (data.enseignantId) {
    errors.push({
      field: "enseignantId",
      promise: prisma.enseignant.findUnique({
        where: { id: data.enseignantId },
        select: { id: true },
      }),
    });
  }
  if (data.moduleId) {
    errors.push({
      field: "moduleId",
      promise: prisma.module.findUnique({
        where: { id: data.moduleId },
        select: { id: true },
      }),
    });
  }
  if (data.promoId) {
    errors.push({
      field: "promoId",
      promise: prisma.promo.findUnique({
        where: { id: data.promoId },
        select: { id: true },
      }),
    });
  }
  if (data.academicYearId) {
    errors.push({
      field: "academicYearId",
      promise: prisma.academicYear.findUnique({
        where: { id: data.academicYearId },
        select: { id: true },
      }),
    });
  }

  await Promise.all(errors.map((entry) => entry.promise.then((result) => {
    if (!result) {
      throw new EnseignementServiceError(
        "INVALID_FK",
        `Referenced ${entry.field} does not exist`,
        404
      );
    }
  })));
  void checks;
};

export const createEnseignement = async (input: {
  enseignantId: unknown;
  moduleId: unknown;
  promoId: unknown;
  type: unknown;
  academicYearId?: unknown;
  anneeUniversitaire?: unknown;
}) => {
  const data: Prisma.EnseignementUncheckedCreateInput = {
    enseignantId: requirePositiveInt(input.enseignantId, "enseignantId"),
    moduleId: requirePositiveInt(input.moduleId, "moduleId"),
    promoId: requirePositiveInt(input.promoId, "promoId"),
    type: requireType(input.type),
  };

  const academicYearId = optionalPositiveInt(input.academicYearId);
  if (academicYearId !== undefined) data.academicYearId = academicYearId;

  const anneeUniversitaire = optionalString(input.anneeUniversitaire);
  if (anneeUniversitaire) data.anneeUniversitaire = anneeUniversitaire;

  await ensureFkExist({
    enseignantId: data.enseignantId,
    moduleId: data.moduleId,
    promoId: data.promoId,
    academicYearId,
  });

  // If academicYearId given but no string label, mirror the year name into the
  // legacy `anneeUniversitaire` text column so existing readers stay correct.
  if (academicYearId !== undefined && !anneeUniversitaire) {
    const yr = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { name: true },
    });
    if (yr) data.anneeUniversitaire = yr.name;
  }

  // Soft duplicate guard at the application layer (no DB constraint exists,
  // intentionally — same triplet can validly exist across years).
  const dup = await prisma.enseignement.findFirst({
    where: {
      enseignantId: data.enseignantId,
      moduleId: data.moduleId,
      promoId: data.promoId,
      type: data.type,
      academicYearId: academicYearId ?? null,
    },
    select: { id: true },
  });
  if (dup) {
    throw new EnseignementServiceError(
      "DUPLICATE",
      `An identical enseignement (teacher/module/promo/type/year) already exists with id ${dup.id}`,
      409
    );
  }

  return prisma.enseignement.create({ data, include: enseignementInclude });
};

export const updateEnseignement = async (
  id: number,
  input: {
    enseignantId?: unknown;
    moduleId?: unknown;
    promoId?: unknown;
    type?: unknown;
    academicYearId?: unknown;
    anneeUniversitaire?: unknown;
  }
) => {
  const data: Prisma.EnseignementUncheckedUpdateInput = {};

  if (input.enseignantId !== undefined) {
    data.enseignantId = requirePositiveInt(input.enseignantId, "enseignantId");
  }
  if (input.moduleId !== undefined) {
    data.moduleId = requirePositiveInt(input.moduleId, "moduleId");
  }
  if (input.promoId !== undefined) {
    data.promoId = requirePositiveInt(input.promoId, "promoId");
  }
  if (input.type !== undefined) {
    data.type = optionalType(input.type) ?? null;
  }
  if (input.academicYearId !== undefined) {
    data.academicYearId = optionalPositiveInt(input.academicYearId) ?? null;
  }
  if (input.anneeUniversitaire !== undefined) {
    data.anneeUniversitaire = optionalString(input.anneeUniversitaire) ?? null;
  }

  if (Object.keys(data).length === 0) {
    return getEnseignementById(id);
  }

  const existing = await prisma.enseignement.findUnique({ where: { id } });
  if (!existing) {
    throw new EnseignementServiceError("NOT_FOUND", "Enseignement not found", 404);
  }

  await ensureFkExist({
    enseignantId: data.enseignantId as number | undefined,
    moduleId: data.moduleId as number | undefined,
    promoId: data.promoId as number | undefined,
    academicYearId: data.academicYearId as number | undefined,
  });

  return prisma.enseignement.update({ where: { id }, data, include: enseignementInclude });
};

export const deleteEnseignement = async (id: number) => {
  const usage = await prisma.copieRemise.count({ where: { enseignementId: id } });
  if (usage > 0) {
    throw new EnseignementServiceError(
      "IN_USE",
      `Cannot delete: ${usage} copie-remise record(s) reference this enseignement`,
      409
    );
  }
  try {
    await prisma.enseignement.delete({ where: { id } });
  } catch (_error) {
    throw new EnseignementServiceError("NOT_FOUND", "Enseignement not found", 404);
  }
};

// ── Role-scoped reads ──────────────────────────────────────────

/** Enseignements assigned to the calling teacher (resolved via userId). */
export const listMyTeacherEnseignements = async (
  userId: number,
  filter?: { academicYearId?: number; allYears?: boolean }
) => {
  const enseignant = await prisma.enseignant.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!enseignant) return [];

  return listEnseignements({
    enseignantId: enseignant.id,
    academicYearId: filter?.academicYearId,
    allYears: filter?.allYears,
  });
};

/**
 * Modules visible to a student — i.e. all enseignements scoped to the
 * student's promo. Admin can read this for any user via /admin endpoints,
 * but here it is strictly the calling student's promo.
 */
export const listMyStudentEnseignements = async (
  userId: number,
  filter?: { academicYearId?: number; allYears?: boolean }
) => {
  const etudiant = await prisma.etudiant.findUnique({
    where: { userId },
    select: { promoId: true },
  });
  if (!etudiant?.promoId) return [];

  return listEnseignements({
    promoId: etudiant.promoId,
    academicYearId: filter?.academicYearId,
    allYears: filter?.allYears,
  });
};
