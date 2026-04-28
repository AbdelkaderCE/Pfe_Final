import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { getTeacherDashboardData } from "./teacher-dashboard.service";

/**
 * The four module/course-scoped handlers in this controller (students,
 * notes, attendance, exclusion) depended on the teacher↔course assignment
 * model that has been retired. They are kept as deprecation shims so any
 * existing client receives a stable response while migrating to the new
 * PFE-supervision model.
 */
const deprecated = (res: Response) =>
  res.status(410).json({
    success: false,
    deprecated: true,
    message:
      "This feature is deprecated. Teacher data is now sourced from PFE supervision (GroupPfe).",
  });

export const getTeacherDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const data = await getTeacherDashboardData(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch teacher dashboard";
    const statusCode = message.includes("not found") ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getTeacherStudentsByModuleHandler = async (_req: AuthRequest, res: Response) => {
  deprecated(res);
};

export const saveTeacherStudentNotesHandler = async (_req: AuthRequest, res: Response) => {
  deprecated(res);
};

export const markTeacherStudentAttendanceHandler = async (_req: AuthRequest, res: Response) => {
  deprecated(res);
};

export const setTeacherStudentExclusionOverrideHandler = async (_req: AuthRequest, res: Response) => {
  deprecated(res);
};
