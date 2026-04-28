import type { Response } from "express";
import prisma from "../../config/database";
import type { AuthRequest } from "../../middlewares/auth.middleware";

const MAX_SUJETS_PER_TEACHER = 3;

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
          max: MAX_SUJETS_PER_TEACHER,
          canCreate: false,
          anneeUniversitaire: annee,
        },
      });
      return;
    }

    // Match exactly the same WHERE the create handler uses, otherwise the
    // UI's quota indicator can drift from the actual server-side rule.
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
        max: MAX_SUJETS_PER_TEACHER,
        canCreate: used < MAX_SUJETS_PER_TEACHER,
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
