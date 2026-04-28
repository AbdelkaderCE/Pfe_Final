import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  createEnseignementHandler,
  deleteEnseignementHandler,
  getEnseignementHandler,
  listEnseignementsHandler,
  listMyStudentEnseignementsHandler,
  listMyTeacherEnseignementsHandler,
  updateEnseignementHandler,
} from "./enseignements.controller";

const router = Router();

router.use(requireAuth);

// Role-scoped reads (must come before "/:id" so the literal segments match first).
router.get("/mine", requireRole(["enseignant", "admin"]), listMyTeacherEnseignementsHandler);
router.get("/me", requireRole(["etudiant", "admin"]), listMyStudentEnseignementsHandler);

// Generic reads — admin-only by default; relax later if a use case shows up.
router.get("/", requireRole(["admin"]), listEnseignementsHandler);
router.get("/:id", requireRole(["admin"]), getEnseignementHandler);

// Writes — admin only.
router.post("/", requireRole(["admin"]), createEnseignementHandler);
router.patch("/:id", requireRole(["admin"]), updateEnseignementHandler);
router.delete("/:id", requireRole(["admin"]), deleteEnseignementHandler);

export default router;
