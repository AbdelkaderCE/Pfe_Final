import { Router } from "express";
import { requireAuth, requireRole } from "../../../middlewares/auth.middleware";
import {
  bulkAssignStudentsHandler,
  bulkAssignTeachersHandler,
  importStudentsHandler,
  importAveragesHandler,
} from "../controllers/bulk-assignment.controller";

const router = Router();

router.use(requireAuth, requireRole(["admin"]));

router.post("/students/import", importStudentsHandler);
router.post("/students/assign-promo", bulkAssignStudentsHandler);
router.post("/teachers/assign", bulkAssignTeachersHandler);
router.post("/import-averages", importAveragesHandler);

export default router;
