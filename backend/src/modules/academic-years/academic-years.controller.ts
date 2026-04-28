import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  AcademicYearServiceError,
  activateAcademicYear,
  createAcademicYear,
  deleteAcademicYear,
  getAcademicHierarchy,
  getAcademicYearById,
  getActiveAcademicYear,
  listAcademicYears,
  updateAcademicYear,
} from "./academic-years.service";

const handleError = (res: Response, error: unknown, fallbackCode: string) => {
  if (error instanceof AcademicYearServiceError) {
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

export const listAcademicYearsHandler = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await listAcademicYears();
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ACADEMIC_YEARS_LIST_FAILED");
  }
};

export const getActiveAcademicYearHandler = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getActiveAcademicYear();
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ACADEMIC_YEARS_ACTIVE_FAILED");
  }
};

export const getAcademicYearHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    const data = await getAcademicYearById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ACADEMIC_YEARS_GET_FAILED");
  }
};

export const createAcademicYearHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await createAcademicYear({
      name: req.body?.name,
      isActive: req.body?.isActive,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ACADEMIC_YEARS_CREATE_FAILED");
  }
};

export const updateAcademicYearHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    const data = await updateAcademicYear(id, {
      name: req.body?.name,
      isActive: req.body?.isActive,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ACADEMIC_YEARS_UPDATE_FAILED");
  }
};

export const activateAcademicYearHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    const data = await activateAcademicYear(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ACADEMIC_YEARS_ACTIVATE_FAILED");
  }
};

export const getAcademicHierarchyHandler = async (req: AuthRequest, res: Response) => {
  try {
    const yearId = parseId(req.query.yearId);
    const data = await getAcademicHierarchy(yearId ? { yearId } : undefined);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "ACADEMIC_HIERARCHY_FAILED");
  }
};

export const deleteAcademicYearHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    await deleteAcademicYear(id);
    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    handleError(res, error, "ACADEMIC_YEARS_DELETE_FAILED");
  }
};
