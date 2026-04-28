import prisma from "../../config/database";

export class AcademicYearServiceError extends Error {
  statusCode: number;
  code: string;
  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "AcademicYearServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const NAME_PATTERN = /^\d{4}-\d{4}$/;

const validateName = (raw: unknown): string => {
  if (typeof raw !== "string") {
    throw new AcademicYearServiceError("INVALID_NAME", "Name must be a string");
  }
  const value = raw.trim();
  if (!NAME_PATTERN.test(value)) {
    throw new AcademicYearServiceError(
      "INVALID_NAME",
      'Name must match the format "YYYY-YYYY" (e.g. "2024-2025")'
    );
  }
  const [start, end] = value.split("-").map(Number);
  if (end !== start + 1) {
    throw new AcademicYearServiceError(
      "INVALID_NAME",
      "Academic year must span two consecutive years"
    );
  }
  return value;
};

export const listAcademicYears = async () => {
  return prisma.academicYear.findMany({
    orderBy: { name: "desc" },
  });
};

/**
 * Hierarchical view of the academic structure for the admin tree UI:
 *   year → promos → modules (resolved through each promo's specialite)
 *     → enseignements (per module + promo + year)
 *
 * The shape is intentionally denormalized so the UI can render an accordion
 * tree without additional round-trips. Modules are deduplicated per promo;
 * enseignements expose teacher and type so the same screen can show "who
 * teaches what" alongside the structure.
 */
export const getAcademicHierarchy = async (filter?: {
  yearId?: number;
}) => {
  const yearWhere = filter?.yearId ? { id: filter.yearId } : undefined;

  const years = await prisma.academicYear.findMany({
    where: yearWhere,
    orderBy: [{ isActive: "desc" }, { name: "desc" }],
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      promos: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
          section: true,
          anneeUniversitaire: true,
          specialiteId: true,
          specialite: {
            select: {
              id: true,
              nom_ar: true,
              nom_en: true,
              niveau: true,
              modules: {
                select: {
                  id: true,
                  code: true,
                  nom_ar: true,
                  nom_en: true,
                  semestre: true,
                  credit: true,
                  coef: true,
                },
                orderBy: [{ semestre: "asc" }, { nom_ar: "asc" }],
              },
            },
          },
          _count: { select: { etudiants: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  // For each (promo, module) pair attach the enseignements scoped to this
  // year so the UI can show "MODULE X — TD/TP/COURS by Teacher Y". One
  // batched query per year keeps it cheap.
  const enriched = await Promise.all(
    years.map(async (year) => {
      const enseignements = await prisma.enseignement.findMany({
        where: { academicYearId: year.id },
        select: {
          id: true,
          type: true,
          promoId: true,
          moduleId: true,
          enseignant: {
            select: {
              id: true,
              user: { select: { id: true, nom: true, prenom: true, email: true } },
            },
          },
        },
      });

      const byPromoModule = new Map<string, typeof enseignements>();
      for (const en of enseignements) {
        const key = `${en.promoId}-${en.moduleId}`;
        const list = byPromoModule.get(key) ?? [];
        list.push(en);
        byPromoModule.set(key, list);
      }

      const promos = year.promos.map((promo) => {
        const modules = (promo.specialite?.modules ?? []).map((module) => {
          const key = `${promo.id}-${module.id}`;
          const slots = (byPromoModule.get(key) ?? []).map((en) => ({
            id: en.id,
            type: en.type,
            teacher: en.enseignant
              ? {
                  id: en.enseignant.id,
                  userId: en.enseignant.user?.id ?? null,
                  nom: en.enseignant.user?.nom ?? null,
                  prenom: en.enseignant.user?.prenom ?? null,
                  email: en.enseignant.user?.email ?? null,
                }
              : null,
          }));
          return {
            id: module.id,
            code: module.code,
            nom_ar: module.nom_ar,
            nom_en: module.nom_en,
            semestre: module.semestre,
            credit: module.credit,
            coef: module.coef,
            enseignements: slots,
          };
        });

        return {
          id: promo.id,
          nom_ar: promo.nom_ar,
          nom_en: promo.nom_en,
          section: promo.section,
          anneeUniversitaire: promo.anneeUniversitaire,
          specialiteId: promo.specialiteId,
          studentCount: promo._count.etudiants,
          niveau: promo.specialite?.niveau ?? null,
          modules,
        };
      });

      return {
        id: year.id,
        name: year.name,
        isActive: year.isActive,
        createdAt: year.createdAt,
        promos,
      };
    })
  );

  return enriched;
};

export const getActiveAcademicYear = async () => {
  return prisma.academicYear.findFirst({ where: { isActive: true } });
};

export const getAcademicYearById = async (id: number) => {
  const year = await prisma.academicYear.findUnique({ where: { id } });
  if (!year) {
    throw new AcademicYearServiceError("NOT_FOUND", "Academic year not found", 404);
  }
  return year;
};

export const createAcademicYear = async (input: {
  name: unknown;
  isActive?: unknown;
}) => {
  const name = validateName(input.name);
  const isActive = Boolean(input.isActive);

  const existing = await prisma.academicYear.findUnique({ where: { name } });
  if (existing) {
    throw new AcademicYearServiceError(
      "ALREADY_EXISTS",
      `Academic year "${name}" already exists`,
      409
    );
  }

  // The "only one active year" invariant is enforced inside a transaction so
  // a concurrent activation cannot leave two rows with isActive=true.
  return prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }
    return tx.academicYear.create({ data: { name, isActive } });
  });
};

export const updateAcademicYear = async (
  id: number,
  input: { name?: unknown; isActive?: unknown }
) => {
  const data: { name?: string; isActive?: boolean } = {};

  if (input.name !== undefined) {
    data.name = validateName(input.name);
  }
  if (input.isActive !== undefined) {
    data.isActive = Boolean(input.isActive);
  }

  if (Object.keys(data).length === 0) {
    return getAcademicYearById(id);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.academicYear.findUnique({ where: { id } });
    if (!existing) {
      throw new AcademicYearServiceError("NOT_FOUND", "Academic year not found", 404);
    }
    if (data.name && data.name !== existing.name) {
      const clash = await tx.academicYear.findUnique({ where: { name: data.name } });
      if (clash) {
        throw new AcademicYearServiceError(
          "ALREADY_EXISTS",
          `Academic year "${data.name}" already exists`,
          409
        );
      }
    }
    if (data.isActive === true) {
      await tx.academicYear.updateMany({
        where: { isActive: true, NOT: { id } },
        data: { isActive: false },
      });
    }
    return tx.academicYear.update({ where: { id }, data });
  });
};

export const activateAcademicYear = async (id: number) => {
  return updateAcademicYear(id, { isActive: true });
};

export const deleteAcademicYear = async (id: number) => {
  const usage = await prisma.$transaction([
    prisma.promo.count({ where: { academicYearId: id } }),
    prisma.enseignement.count({ where: { academicYearId: id } }),
  ]);
  const [promoCount, enseignementCount] = usage;
  if (promoCount > 0 || enseignementCount > 0) {
    throw new AcademicYearServiceError(
      "IN_USE",
      `Cannot delete: ${promoCount} promo(s) and ${enseignementCount} enseignement(s) reference this year`,
      409
    );
  }

  try {
    await prisma.academicYear.delete({ where: { id } });
  } catch (_error) {
    throw new AcademicYearServiceError("NOT_FOUND", "Academic year not found", 404);
  }
};
