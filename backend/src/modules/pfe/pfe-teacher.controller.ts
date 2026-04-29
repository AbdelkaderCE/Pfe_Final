import type { Response } from "express";
import prisma from "../../config/database";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { getMaxSubjectsPerTeacher } from "./pfe-config.service";

const resolveCurrentAcademicYear = async (): Promise<string> => {
  const active = await prisma.academicYear.findFirst({
    where: { isActive: true },
    select: { name: true },
  });
  if (active?.name) return active.name;
  const now = new Date();
  const startYear = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}/${startYear + 1}`;
};

/**
 * Returns the calling teacher's current PFE subject quota for the active
 * academic year. The frontend uses this to disable the "create subject"
 * button before the teacher hits the cap (the backend still enforces it
 * on POST). Non-teacher callers receive `{ used: 0, max, canCreate: false }`.
 */
export const getMyTeacherSubjectQuotaHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const maxPerTeacher = await getMaxSubjectsPerTeacher();

    const enseignant = await prisma.enseignant.findUnique({
      where: { userId },
      select: { id: true },
    });

    const annee = await resolveCurrentAcademicYear();

    if (!enseignant) {
      res.json({
        success: true,
        data: {
          used: 0,
          max: maxPerTeacher,
          canCreate: false,
          anneeUniversitaire: annee,
        },
      });
      return;
    }

    const used = await prisma.pfeSujet.count({
      where: {
        enseignantId: enseignant.id,
        anneeUniversitaire: annee,
      },
    });

    res.json({
      success: true,
      data: {
        used,
        max: maxPerTeacher,
        canCreate: used < maxPerTeacher,
        anneeUniversitaire: annee,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_QUOTA_FAILED", message },
    });
  }
};

/**
 * Returns the list of promos a teacher is assigned to (via enseignement).
 * Used by the frontend to populate the promo dropdown when creating subjects.
 */
export const getTeacherPromosHandler = async (req: AuthRequest, res: Response) => {
  try {
    const enseignantId = Number(req.params.enseignantId);
    if (!Number.isInteger(enseignantId) || enseignantId <= 0) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "enseignantId must be a positive integer" },
      });
      return;
    }

    const enseignements = await prisma.enseignement.findMany({
      where: { enseignantId },
      select: { promoId: true },
    });

    const promoIds = [
      ...new Set(
        enseignements
          .map((e) => e.promoId)
          .filter((id): id is number => Number.isInteger(id) && (id as number) > 0)
      ),
    ];

    if (promoIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const promos = await prisma.promo.findMany({
      where: { id: { in: promoIds } },
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        section: true,
        anneeUniversitaire: true,
        specialite: { select: { nom_ar: true, nom_en: true } },
      },
      orderBy: [{ anneeUniversitaire: "desc" }, { nom_ar: "asc" }],
    });

    res.json({ success: true, data: promos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "TEACHER_PROMOS_FAILED", message },
    });
  }
};

