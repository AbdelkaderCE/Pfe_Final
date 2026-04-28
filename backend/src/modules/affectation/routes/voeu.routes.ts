import { Router } from "express";
import { requireAuth, requireRole } from "../../../middlewares/auth.middleware";
import {
  getMyAffectationHandler,
  listMyVoeuxHandler,
  submitVoeuxHandler,
} from "../controllers/voeu.controller";

const router = Router();

const studentRoles = ["etudiant"];

router.post("/", requireAuth, requireRole(studentRoles), submitVoeuxHandler);
router.get("/me", requireAuth, requireRole(studentRoles), listMyVoeuxHandler);
router.get("/me/affectation", requireAuth, requireRole(studentRoles), getMyAffectationHandler);

export default router;
