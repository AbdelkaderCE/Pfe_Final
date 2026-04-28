import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { getStudentHistory, getTeacherHistory } from "./history.service";

const parseUserId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const unauthorized = (res: Response) =>
  res.status(401).json({
    success: false,
    error: { code: "UNAUTHORIZED", message: "Authentication required" },
  });

const forbidden = (res: Response, message = "Insufficient permissions") =>
  res.status(403).json({
    success: false,
    error: { code: "FORBIDDEN", message },
  });

const badRequest = (res: Response, message: string) =>
  res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message } });

/** GET /api/v1/history/student/me */
export const getMyStudentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) return void unauthorized(res);
  try {
    const data = await getStudentHistory(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/** GET /api/v1/history/teacher/me */
export const getMyTeacherHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) return void unauthorized(res);
  try {
    const data = await getTeacherHistory(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/** GET /api/v1/admin/history/student/:id — :id is User.id per spec */
export const getAdminStudentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) return void unauthorized(res);
  if (!req.user.roles?.includes("admin")) return void forbidden(res, "Admin only");

  const userId = parseUserId(req.params.id);
  if (!userId) return void badRequest(res, "Invalid user id");

  try {
    const data = await getStudentHistory(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/** GET /api/v1/admin/history/teacher/:id — :id is User.id per spec */
export const getAdminTeacherHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) return void unauthorized(res);
  if (!req.user.roles?.includes("admin")) return void forbidden(res, "Admin only");

  const userId = parseUserId(req.params.id);
  if (!userId) return void badRequest(res, "Invalid user id");

  try {
    const data = await getTeacherHistory(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};
