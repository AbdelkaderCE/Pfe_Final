import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import type { TypeEnseignement } from "@prisma/client";
import {
  EnseignementServiceError,
  createEnseignement,
  deleteEnseignement,
  getEnseignementById,
  listEnseignements,
  listMyStudentEnseignements,
  listMyTeacherEnseignements,
  updateEnseignement,
} from "./enseignements.service";

const handleError = (res: Response, error: unknown, fallbackCode: string) => {
  if (error instanceof EnseignementServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    success: false,
    error: { code: fallbackCode, message },
  });
};

const parseId = (raw: unknown): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const parseOptionalPositiveInt = (raw: unknown): number | undefined => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

/**
 * Year-scope query: clients pass `?academicYearId=N` for an explicit year, or
 * `?academicYearId=all` to bypass the active-year default and read every year.
 * Returns flags the service understands.
 */
const parseYearScope = (raw: unknown): { academicYearId?: number; allYears?: boolean } => {
  if (typeof raw === "string" && raw.trim().toLowerCase() === "all") {
    return { allYears: true };
  }
  const id = parseOptionalPositiveInt(raw);
  return id !== undefined ? { academicYearId: id } : {};
};

const parseOptionalType = (raw: unknown): TypeEnseignement | undefined => {
  if (typeof raw !== "string") return undefined;
  const normalized = raw.trim().toLowerCase();
  return ["cours", "td", "tp", "online"].includes(normalized)
    ? (normalized as TypeEnseignement)
    : undefined;
};

export const listEnseignementsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const yearScope = parseYearScope(req.query.academicYearId);
    const data = await listEnseignements({
      enseignantId: parseOptionalPositiveInt(req.query.enseignantId),
      moduleId: parseOptionalPositiveInt(req.query.moduleId),
      promoId: parseOptionalPositiveInt(req.query.promoId),
      type: parseOptionalType(req.query.type),
      ...yearScope,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ENSEIGNEMENTS_LIST_FAILED");
  }
};

export const getEnseignementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    const data = await getEnseignementById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ENSEIGNEMENTS_GET_FAILED");
  }
};

export const createEnseignementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await createEnseignement(req.body ?? {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ENSEIGNEMENTS_CREATE_FAILED");
  }
};

export const updateEnseignementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    const data = await updateEnseignement(id, req.body ?? {});
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ENSEIGNEMENTS_UPDATE_FAILED");
  }
};

export const deleteEnseignementHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    await deleteEnseignement(id);
    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    handleError(res, error, "ENSEIGNEMENTS_DELETE_FAILED");
  }
};

// ── Role-scoped read endpoints ────────────────────────────────

export const listMyTeacherEnseignementsHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }
    const data = await listMyTeacherEnseignements(req.user.id, parseYearScope(req.query.academicYearId));
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ENSEIGNEMENTS_MINE_FAILED");
  }
};

export const listMyStudentEnseignementsHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }
    const data = await listMyStudentEnseignements(req.user.id, parseYearScope(req.query.academicYearId));
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ENSEIGNEMENTS_ME_FAILED");
  }
};
