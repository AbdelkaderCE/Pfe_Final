import prisma from "../../config/database";
import type { Prisma } from "@prisma/client";

export class ModuleServiceError extends Error {
  statusCode: number;
  code: string;
  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "ModuleServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ModuleServiceError(
      "INVALID_FIELD",
      `Field "${field}" is required and must be a non-empty string`
    );
  }
  return value.trim();
};

const optionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const requirePositiveInt = (value: unknown, field: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ModuleServiceError(
      "INVALID_FIELD",
      `Field "${field}" must be a positive integer`
    );
  }
  return parsed;
};

const optionalSemester = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
    throw new ModuleServiceError(
      "INVALID_FIELD",
      'Field "semestre" must be an integer between 1 and 12'
    );
  }
  return parsed;
};

const optionalNonNegativeInt = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ModuleServiceError(
      "INVALID_FIELD",
      `Field "${field}" must be a non-negative integer`
    );
  }
  return parsed;
};

const optionalDecimal = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ModuleServiceError(
      "INVALID_FIELD",
      `Field "${field}" must be a non-negative number`
    );
  }
  return parsed;
};

const moduleInclude = {
  specialite: { select: { id: true, nom_ar: true, nom_en: true, niveau: true } },
} satisfies Prisma.ModuleInclude;

export const listModules = async (filter?: {
  specialiteId?: number;
  promoId?: number;
  semestre?: number;
  search?: string;
}) => {
  const where: Prisma.ModuleWhereInput = {};
  if (filter?.specialiteId) where.specialiteId = filter.specialiteId;

  // Promo-scoped read — Module has no direct promoId column, so we resolve
  // the promo's specialiteId and filter on it. Empty result if the promo or
  // its specialite is missing (admin convenience: silent rather than 404).
  if (filter?.promoId && !filter?.specialiteId) {
    const promo = await prisma.promo.findUnique({
      where: { id: filter.promoId },
      select: { specialiteId: true },
    });
    if (!promo?.specialiteId) {
      return [];
    }
    where.specialiteId = promo.specialiteId;
  }

  if (filter?.semestre) where.semestre = filter.semestre;
  if (filter?.search) {
    where.OR = [
      { code: { contains: filter.search, mode: "insensitive" } },
      { nom_ar: { contains: filter.search, mode: "insensitive" } },
      { nom_en: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  return prisma.module.findMany({
    where,
    include: moduleInclude,
    orderBy: [{ specialiteId: "asc" }, { semestre: "asc" }, { code: "asc" }],
  });
};

export const getModuleById = async (id: number) => {
  const module = await prisma.module.findUnique({
    where: { id },
    include: moduleInclude,
  });
  if (!module) {
    throw new ModuleServiceError("NOT_FOUND", "Module not found", 404);
  }
  return module;
};

export const createModule = async (input: {
  nom_ar: unknown;
  nom_en?: unknown;
  code: unknown;
  specialiteId: unknown;
  semestre?: unknown;
  volumeCours?: unknown;
  volumeTd?: unknown;
  volumeTp?: unknown;
  credit?: unknown;
  coef?: unknown;
  description_ar?: unknown;
  description_en?: unknown;
}) => {
  const data: Prisma.ModuleUncheckedCreateInput = {
    nom_ar: requireString(input.nom_ar, "nom_ar"),
    code: requireString(input.code, "code"),
    specialiteId: requirePositiveInt(input.specialiteId, "specialiteId"),
  };

  const nom_en = optionalString(input.nom_en);
  if (nom_en) data.nom_en = nom_en;

  const semestre = optionalSemester(input.semestre);
  if (semestre !== undefined) data.semestre = semestre;

  const volumeCours = optionalNonNegativeInt(input.volumeCours, "volumeCours");
  if (volumeCours !== undefined) data.volumeCours = volumeCours;

  const volumeTd = optionalNonNegativeInt(input.volumeTd, "volumeTd");
  if (volumeTd !== undefined) data.volumeTd = volumeTd;

  const volumeTp = optionalNonNegativeInt(input.volumeTp, "volumeTp");
  if (volumeTp !== undefined) data.volumeTp = volumeTp;

  const credit = optionalNonNegativeInt(input.credit, "credit");
  if (credit !== undefined) data.credit = credit;

  const coef = optionalDecimal(input.coef, "coef");
  if (coef !== undefined) data.coef = coef;

  const description_ar = optionalString(input.description_ar);
  if (description_ar) data.description_ar = description_ar;

  const description_en = optionalString(input.description_en);
  if (description_en) data.description_en = description_en;

  const specialite = await prisma.specialite.findUnique({
    where: { id: data.specialiteId },
    select: { id: true },
  });
  if (!specialite) {
    throw new ModuleServiceError("INVALID_SPECIALITE", "Specialite not found", 404);
  }

  const codeClash = await prisma.module.findUnique({ where: { code: data.code } });
  if (codeClash) {
    throw new ModuleServiceError(
      "DUPLICATE_CODE",
      `Module code "${data.code}" already exists`,
      409
    );
  }

  return prisma.module.create({ data, include: moduleInclude });
};

export const updateModule = async (
  id: number,
  input: {
    nom_ar?: unknown;
    nom_en?: unknown;
    code?: unknown;
    specialiteId?: unknown;
    semestre?: unknown;
    volumeCours?: unknown;
    volumeTd?: unknown;
    volumeTp?: unknown;
    credit?: unknown;
    coef?: unknown;
    description_ar?: unknown;
    description_en?: unknown;
  }
) => {
  const data: Prisma.ModuleUncheckedUpdateInput = {};

  if (input.nom_ar !== undefined) data.nom_ar = requireString(input.nom_ar, "nom_ar");
  if (input.nom_en !== undefined) data.nom_en = optionalString(input.nom_en) ?? null;
  if (input.code !== undefined) data.code = requireString(input.code, "code");
  if (input.specialiteId !== undefined) {
    data.specialiteId = requirePositiveInt(input.specialiteId, "specialiteId");
  }
  if (input.semestre !== undefined) {
    data.semestre = optionalSemester(input.semestre) ?? null;
  }
  if (input.volumeCours !== undefined) {
    data.volumeCours = optionalNonNegativeInt(input.volumeCours, "volumeCours") ?? 0;
  }
  if (input.volumeTd !== undefined) {
    data.volumeTd = optionalNonNegativeInt(input.volumeTd, "volumeTd") ?? 0;
  }
  if (input.volumeTp !== undefined) {
    data.volumeTp = optionalNonNegativeInt(input.volumeTp, "volumeTp") ?? 0;
  }
  if (input.credit !== undefined) {
    data.credit = optionalNonNegativeInt(input.credit, "credit") ?? 0;
  }
  if (input.coef !== undefined) {
    data.coef = optionalDecimal(input.coef, "coef") ?? 1;
  }
  if (input.description_ar !== undefined) {
    data.description_ar = optionalString(input.description_ar) ?? null;
  }
  if (input.description_en !== undefined) {
    data.description_en = optionalString(input.description_en) ?? null;
  }

  if (Object.keys(data).length === 0) {
    return getModuleById(id);
  }

  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing) {
    throw new ModuleServiceError("NOT_FOUND", "Module not found", 404);
  }

  if (data.specialiteId !== undefined) {
    const specialite = await prisma.specialite.findUnique({
      where: { id: data.specialiteId as number },
      select: { id: true },
    });
    if (!specialite) {
      throw new ModuleServiceError("INVALID_SPECIALITE", "Specialite not found", 404);
    }
  }

  if (data.code && data.code !== existing.code) {
    const clash = await prisma.module.findUnique({ where: { code: data.code as string } });
    if (clash) {
      throw new ModuleServiceError(
        "DUPLICATE_CODE",
        `Module code "${data.code as string}" already exists`,
        409
      );
    }
  }

  return prisma.module.update({ where: { id }, data, include: moduleInclude });
};

export const deleteModule = async (id: number) => {
  const usage = await prisma.enseignement.count({ where: { moduleId: id } });
  if (usage > 0) {
    throw new ModuleServiceError(
      "IN_USE",
      `Cannot delete: ${usage} enseignement(s) reference this module`,
      409
    );
  }
  try {
    await prisma.module.delete({ where: { id } });
  } catch (_error) {
    throw new ModuleServiceError("NOT_FOUND", "Module not found", 404);
  }
};
