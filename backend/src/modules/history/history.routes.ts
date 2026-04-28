import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  getAdminStudentHistory,
  getAdminTeacherHistory,
  getMyStudentHistory,
  getMyTeacherHistory,
} from "./history.controller";

const router = Router();

// Student / teacher self-view
router.get("/student/me", requireAuth, getMyStudentHistory);
router.get("/teacher/me", requireAuth, getMyTeacherHistory);

// Admin — view any user's history
router.get("/admin/student/:id", requireAuth, requireRole(["admin"]), getAdminStudentHistory);
router.get("/admin/teacher/:id", requireAuth, requireRole(["admin"]), getAdminTeacherHistory);

export default router;
