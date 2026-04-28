import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  getTeacherDashboardHandler,
  getTeacherStudentsByModuleHandler,
  markTeacherStudentAttendanceHandler,
  saveTeacherStudentNotesHandler,
  setTeacherStudentExclusionOverrideHandler,
} from "./teacher-dashboard.controller";

const router = Router();

router.get(
  "/teacher",
  requireAuth,
  requireRole(["enseignant", "teacher", "admin"]),
  getTeacherDashboardHandler
);

router.get(
  "/teacher/students/module/:enseignementId",
  requireAuth,
  requireRole(["enseignant", "teacher", "admin"]),
  getTeacherStudentsByModuleHandler
);

router.post(
  "/teacher/students/notes",
  requireAuth,
  requireRole(["enseignant", "teacher", "admin"]),
  saveTeacherStudentNotesHandler
);

router.post(
  "/teacher/students/attendance",
  requireAuth,
  requireRole(["enseignant", "teacher", "admin"]),
  markTeacherStudentAttendanceHandler
);

router.put(
  "/teacher/students/exclusion/:etudiantId",
  requireAuth,
  requireRole(["enseignant", "teacher", "admin"]),
  setTeacherStudentExclusionOverrideHandler
);

export default router;
