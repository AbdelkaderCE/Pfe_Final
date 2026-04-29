import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import { chatHandler, analyzeDocumentHandler, moderateImageHandler, analyzeReclamationHandler } from "./ai.controller";

const router = Router();

router.post(
  "/chat",
  requireAuth,
  requireRole(["etudiant", "enseignant", "admin"]),
  chatHandler
);

router.post(
  "/analyze-document",
  requireAuth,
  requireRole(["admin", "enseignant"]),
  analyzeDocumentHandler
);

router.post(
  "/analyze-reclamation",
  requireAuth,
  requireRole(["admin"]),
  analyzeReclamationHandler
);

router.post(
  "/moderate-image",
  requireAuth,
  requireRole(["admin", "enseignant"]),
  moderateImageHandler
);

export default router;