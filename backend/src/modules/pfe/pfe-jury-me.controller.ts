import type { Response } from "express";
import prisma from "../../config/database";
import type { AuthRequest } from "../../middlewares/auth.middleware";

/**
 * Teacher view: every jury membership the calling teacher has, with the
 * group, soutenance date+salle, and the supervised subject inlined.
 *
 * Resolves the enseignant via userId — the mapping the rest of the PFE
 * module already uses.
 */
export const listMyJuryHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const enseignant = await prisma.enseignant.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!enseignant) {
      // Not a teacher account: empty list rather than 403 so admins viewing
      // this endpoint as themselves get a benign empty payload.
      res.json({ success: true, data: [] });
      return;
    }

    const rows = await prisma.pfeJury.findMany({
      where: { enseignantId: enseignant.id },
      include: {
        group: {
          select: {
            id: true,
            nom_ar: true,
            nom_en: true,
            dateSoutenance: true,
            salleSoutenance: true,
            sujetFinal: { select: { id: true, titre_ar: true, titre_en: true } },
            groupMembers: {
              select: {
                etudiant: {
                  select: {
                    id: true,
                    matricule: true,
                    user: { select: { nom: true, prenom: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ groupId: "asc" }],
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_JURY_ME_FAILED", message },
    });
  }
};
