import { Prisma, SessionExam, StatusCopie } from "@prisma/client";
import { Response } from "express";
import prisma from "../../config/database";
import { AuthRequest } from "../../middlewares/auth.middleware";

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const respondError = (res: Response, error: unknown, fallback = "Internal server error") => {
  const message = error instanceof Error ? error.message : fallback;
  res.status(500).json({ success: false, error: message });
};

const copieRemiseSelect = {
  id: true,
  enseignementId: true,
  session: true,
  dateExam: true,
  dateRemise: true,
  nbCopies: true,
  status: true,
  enseignement: {
    include: {
      module: true,
      promo: true,
      enseignant: {
        include: {
          user: true,
          grade: true,
        },
      },
    },
  },
} as const;

const getEnseignantByUserId = async (userId: number) =>
  prisma.enseignant.findUnique({
    where: { userId },
    include: { user: true, grade: true },
  });

export const getMyEnseignements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const enseignant = await getEnseignantByUserId(userId);
    if (!enseignant) {
      res.status(404).json({ success: false, error: "Teacher profile not found" });
      return;
    }

    const enseignements = await prisma.enseignement.findMany({
      where: { enseignantId: enseignant.id },
      include: {
        module: true,
        promo: true,
        enseignant: {
          include: {
            user: true,
            grade: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    res.json({ success: true, data: { enseignant, enseignements } });
  } catch (error: unknown) {
    respondError(res, error, "Failed to fetch enseignements");
  }
};

export const createCopieRemise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const enseignant = await getEnseignantByUserId(userId);
    if (!enseignant) {
      res.status(404).json({ success: false, error: "Teacher profile not found" });
      return;
    }

    const {
      enseignementId,
      session,
      dateExam,
      dateRemise,
      nbCopies,
    } = req.body as {
      enseignementId?: number | string;
      session?: SessionExam;
      dateExam?: string;
      dateRemise?: string;
      nbCopies?: number | string;
    };

    const parsedEnseignementId = parsePositiveInt(enseignementId);
    const parsedNbCopies = parsePositiveInt(nbCopies);

    if (!parsedEnseignementId || !session || !parsedNbCopies) {
      res.status(400).json({
        success: false,
        error: "Required fields: enseignementId, session, nbCopies",
      });
      return;
    }

    if (!Object.values(SessionExam).includes(session)) {
      res.status(400).json({
        success: false,
        error: `Invalid session. Allowed values: ${Object.values(SessionExam).join(", ")}`,
      });
      return;
    }

    const enseignement = await prisma.enseignement.findFirst({
      where: {
        id: parsedEnseignementId,
        enseignantId: enseignant.id,
      },
      select: { id: true },
    });

    if (!enseignement) {
      res.status(403).json({ success: false, error: "Enseignement not allowed for this teacher" });
      return;
    }

    const remise = await prisma.copieRemise.create({
      data: {
        enseignementId: parsedEnseignementId,
        session,
        dateExam: parseDateValue(dateExam),
        dateRemise: parseDateValue(dateRemise) || new Date(),
        nbCopies: parsedNbCopies,
        status: StatusCopie.non_remis,
      },
      select: copieRemiseSelect,
    });

    res.status(201).json({ success: true, data: remise });
  } catch (error: unknown) {
    respondError(res, error, "Failed to create copie remise");
  }
};

export const getMyRemises = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const enseignant = await getEnseignantByUserId(userId);
    if (!enseignant) {
      res.status(404).json({ success: false, error: "Teacher profile not found" });
      return;
    }

    const remises = await prisma.copieRemise.findMany({
      where: {
        enseignement: {
          enseignantId: enseignant.id,
        },
      },
      select: copieRemiseSelect,
      orderBy: { dateRemise: "desc" },
    });

    res.json({ success: true, data: remises });
  } catch (error: unknown) {
    respondError(res, error, "Failed to fetch teacher remises");
  }
};

export const getAllRemises = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const remises = await prisma.copieRemise.findMany({
      select: copieRemiseSelect,
      orderBy: { dateRemise: "desc" },
    });

    res.json({ success: true, data: remises });
  } catch (error: unknown) {
    respondError(res, error, "Failed to fetch all remises");
  }
};

export const updateRemiseStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "Invalid id" });
      return;
    }

    const { status } = req.body as { status?: StatusCopie };
    if (!status || !Object.values(StatusCopie).includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${Object.values(StatusCopie).join(", ")}`,
      });
      return;
    }

    const updated = await prisma.copieRemise.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({ success: false, error: "Copie remise not found" });
      return;
    }

    respondError(res, error, "Failed to update remise status");
  }
};

export const deleteRemise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "Invalid id" });
      return;
    }

    await prisma.copieRemise.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({ success: false, error: "Copie remise not found" });
      return;
    }

    respondError(res, error, "Failed to delete remise");
  }
};
