import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  activateAcademicYearHandler,
  createAcademicYearHandler,
  deleteAcademicYearHandler,
  getAcademicHierarchyHandler,
  getAcademicYearHandler,
  getActiveAcademicYearHandler,
  listAcademicYearsHandler,
  updateAcademicYearHandler,
} from "./academic-years.controller";

const router = Router();

// Read endpoints — any authenticated user (admin/teacher/student) can list
// academic years (UI selectors need this), but writes are admin-only.
router.use(requireAuth);

router.get("/", listAcademicYearsHandler);
router.get("/active", getActiveAcademicYearHandler);
// Tree view (admin academic structure UI). Literal segment must come before
// "/:id" so it isn't matched as an id.
router.get("/hierarchy", getAcademicHierarchyHandler);
router.get("/:id", getAcademicYearHandler);

router.post("/", requireRole(["admin"]), createAcademicYearHandler);
router.patch("/:id", requireRole(["admin"]), updateAcademicYearHandler);
router.post("/:id/activate", requireRole(["admin"]), activateAcademicYearHandler);
router.delete("/:id", requireRole(["admin"]), deleteAcademicYearHandler);

export default router;
