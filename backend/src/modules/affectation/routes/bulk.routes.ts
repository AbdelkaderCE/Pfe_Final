import { Router } from "express";
import { requireAuth, requireRole } from "../../../middlewares/auth.middleware";
import {
  bulkAssignStudentsHandler,
  bulkAssignTeachersHandler,
  importStudentsHandler,
} from "../controllers/bulk-assignment.controller";

const router = Router();

router.use(requireAuth, requireRole(["admin"]));

router.post("/students/import", importStudentsHandler);
router.post("/students/assign-promo", bulkAssignStudentsHandler);
router.post("/teachers/assign", bulkAssignTeachersHandler);

export default router;
