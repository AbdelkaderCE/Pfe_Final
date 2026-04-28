import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  ModuleServiceError,
  createModule,
  deleteModule,
  getModuleById,
  listModules,
  updateModule,
} from "./academic-modules.service";

const handleError = (res: Response, error: unknown, fallbackCode: string) => {
  if (error instanceof ModuleServiceError) {
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

export const listModulesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const data = await listModules({
      specialiteId: parseOptionalPositiveInt(req.query.specialiteId),
      promoId: parseOptionalPositiveInt(req.query.promoId),
      semestre: parseOptionalPositiveInt(req.query.semestre),
      search: search && search.length > 0 ? search : undefined,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "MODULES_LIST_FAILED");
  }
};

export const getModuleHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    const data = await getModuleById(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "MODULES_GET_FAILED");
  }
};

export const createModuleHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = await createModule(req.body ?? {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "MODULES_CREATE_FAILED");
  }
};

export const updateModuleHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    const data = await updateModule(id, req.body ?? {});
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error, "MODULES_UPDATE_FAILED");
  }
};

export const deleteModuleHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Id must be a positive integer" },
      });
      return;
    }
    await deleteModule(id);
    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    handleError(res, error, "MODULES_DELETE_FAILED");
  }
};
