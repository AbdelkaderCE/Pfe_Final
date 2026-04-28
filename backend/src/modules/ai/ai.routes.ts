import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import { chatHandler } from "./ai.controller";

const router = Router();

router.post(
  "/chat",
  requireAuth,
  requireRole(["etudiant", "enseignant", "admin"]),
  chatHandler
);

export default router;