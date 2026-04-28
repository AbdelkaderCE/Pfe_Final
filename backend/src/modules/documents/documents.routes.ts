import { Router } from "express";
import {
  getAllRequests,
  getMyRequests,
  validerDocument,
  createDocumentType,
  createRequest,
  deleteDocument,
  downloadDocument,
  getDocuments,
  uploadDocument,
} from "./documents.controller";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import documentsUpload from "../../middlewares/documents-upload.middleware";

const router = Router();
const ADMIN_ROLES = ["admin"];

router.get("/", getDocuments);
router.get("/my-requests", requireAuth, requireRole(["enseignant", ...ADMIN_ROLES]), getMyRequests);
router.get("/all-requests", requireAuth, requireRole(ADMIN_ROLES), getAllRequests);
router.post("/request", requireAuth, requireRole(["enseignant", ...ADMIN_ROLES]), createRequest);
router.post("/upload", requireAuth, requireRole(ADMIN_ROLES), documentsUpload.single("file"), uploadDocument);
router.patch("/:id/valider", requireAuth, requireRole(ADMIN_ROLES), validerDocument);
router.post("/type", requireAuth, requireRole(ADMIN_ROLES), createDocumentType);
router.get("/download/:id", requireAuth, downloadDocument);
router.delete("/:id", requireAuth, deleteDocument);

export default router;
