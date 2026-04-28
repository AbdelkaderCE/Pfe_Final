import multer from "multer";
import { Router } from "express";
import {
  createReclamation,
  getMyReclamations,
  createJustification,
  getMyJustifications,
  getReclamationTypes,
  getJustificationTypes,
  getAdminRequestsInbox,
  decideReclamation,
  decideJustification,
  decideSubmission,
  decideGuestSubmission,
  getAdminRequestWorkflowHistory,
} from "./request.controller";
import { requireAuth, requireRole, optionalAuth } from "../../middlewares/auth.middleware";
import {
  validateReclamation,
  validateJustification,
} from "./validators/request.validator";
import {
  createDiskStorage,
  createMimeAndExtensionFileFilter,
} from "../../shared/local-upload.service";

const router = Router();

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const studentRequestUpload = multer({
  storage: createDiskStorage("others", "student-requests"),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 8,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    allowedMimeTypes,
    [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".doc", ".docx", ".txt", ".zip"],
    "Unsupported file type for request attachments"
  ),
});

// ── Types (pour remplir les selects du formulaire) ──────────
router.get("/types/reclamations", getReclamationTypes);
router.get("/types/justifications", getJustificationTypes);

// ── Reclamations ────────────────────────────────────────────
router.post(
  "/reclamations",
  optionalAuth,
  studentRequestUpload.array("files", 8),
  validateReclamation,
  createReclamation
);
router.get("/reclamations", requireAuth, getMyReclamations);

// ── Justifications ──────────────────────────────────────────
router.post(
  "/justifications",
  optionalAuth,
  studentRequestUpload.array("files", 8),
  validateJustification,
  createJustification
);
router.get("/justifications", requireAuth, getMyJustifications);

// ── Admin processing ────────────────────────────────────────
router.get("/admin/inbox", requireAuth, requireRole(["admin"]), getAdminRequestsInbox);
router.post("/admin/reclamations/:id/decision", requireAuth, requireRole(["admin"]), decideReclamation);
router.post("/admin/justifications/:id/decision", requireAuth, requireRole(["admin"]), decideJustification);
router.post("/admin/submissions/:id/decision", requireAuth, requireRole(["admin"]), decideSubmission);
router.post("/admin/guest-submissions/:id/decision", requireAuth, requireRole(["admin"]), decideGuestSubmission);
router.get("/admin/:category/:id/workflow", requireAuth, requireRole(["admin"]), getAdminRequestWorkflowHistory);

export default router;