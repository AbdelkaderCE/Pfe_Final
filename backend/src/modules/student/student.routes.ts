import multer from "multer";
import { Router } from "express";
import { requireAnyPermission, requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  changeStudentPanelPasswordHandler,
  chooseSpecialiteHandler,
  createStudentPanelReclamationHandler,
  downloadStudentPanelAnnouncementDocumentHandler,
  downloadStudentPanelDocumentHandler,
  downloadStudentPanelReclamationDocumentHandler,
  getStudentPanelAnnouncementDetailsHandler,
  getStudentPanelDashboardHandler,
  getStudentPanelProfileHandler,
  getStudentPanelReclamationDetailsHandler,
  getMySpecialiteChoicesHandler,
  listStudentPanelAnnouncementsHandler,
  listStudentPanelDocumentsHandler,
  listStudentPanelReclamationTypesHandler,
  listStudentPanelReclamationsHandler,
  getSpecialiteOptionsHandler,
  getStudentDeadlinesHandler,
  getStudentDocumentsHandler,
  getStudentNotesHandler,
  getStudentProfileHandler,
  getStudentSpecialtiesHandler,
  updateStudentPanelProfileHandler,
} from "./student.controller";
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

const studentReclamationUpload = multer({
  storage: createDiskStorage("others", "student-reclamations"),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 6,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    allowedMimeTypes,
    [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".doc", ".docx", ".txt", ".zip"],
    "Unsupported file type for reclamation attachments"
  ),
});

const STUDENT_PANEL_ROLES = ["etudiant"];
const LEGACY_STUDENT_ROLES = ["etudiant", "admin"];

router.use(requireAuth);

router.use("/panel", requireRole(STUDENT_PANEL_ROLES));

router.get("/panel/dashboard", requireAnyPermission(["announcements:view", "reclamations:view:self", "reclamations:view:group"]), getStudentPanelDashboardHandler);

router.get("/panel/announcements", requireAnyPermission(["announcements:view"]), listStudentPanelAnnouncementsHandler);
router.get("/panel/announcements/:announcementId", requireAnyPermission(["announcements:view"]), getStudentPanelAnnouncementDetailsHandler);
router.get(
  "/panel/announcements/:announcementId/documents/:documentId/download",
  requireAnyPermission(["announcements:download"]),
  downloadStudentPanelAnnouncementDocumentHandler
);

router.get("/panel/reclamation-types", requireAnyPermission(["reclamations:create:self", "reclamations:create:group"]), listStudentPanelReclamationTypesHandler);
router.post(
  "/panel/reclamations",
  requireAnyPermission(["reclamations:create:self", "reclamations:create:group"]),
  studentReclamationUpload.array("files", 6),
  createStudentPanelReclamationHandler
);
router.get("/panel/reclamations", requireAnyPermission(["reclamations:view:self", "reclamations:view:group"]), listStudentPanelReclamationsHandler);
router.get("/panel/reclamations/:id", requireAnyPermission(["reclamations:view:self", "reclamations:view:group"]), getStudentPanelReclamationDetailsHandler);
router.get(
  "/panel/reclamations/:reclamationId/documents/:documentId/download",
  requireAnyPermission(["reclamations:view:self", "reclamations:view:group"]),
  downloadStudentPanelReclamationDocumentHandler
);

router.get("/panel/documents", requireAnyPermission(["documents:view:self"]), listStudentPanelDocumentsHandler);
router.get("/panel/documents/:kind/:id/download", requireAnyPermission(["documents:download:self"]), downloadStudentPanelDocumentHandler);

router.get("/panel/profile", requireAnyPermission(["profile:manage:self"]), getStudentPanelProfileHandler);
router.patch("/panel/profile", requireAnyPermission(["profile:manage:self"]), updateStudentPanelProfileHandler);
router.post("/panel/profile/change-password", requireAnyPermission(["password:change:self"]), changeStudentPanelPasswordHandler);

router.get("/profile", requireRole(LEGACY_STUDENT_ROLES), getStudentProfileHandler);
router.get("/specialties", requireRole(LEGACY_STUDENT_ROLES), getStudentSpecialtiesHandler);
router.get("/deadlines", requireRole(LEGACY_STUDENT_ROLES), getStudentDeadlinesHandler);
router.get("/documents", requireRole(LEGACY_STUDENT_ROLES), getStudentDocumentsHandler);
router.get("/notes", requireRole(LEGACY_STUDENT_ROLES), getStudentNotesHandler);
router.get("/specialite-options", requireRole(LEGACY_STUDENT_ROLES), getSpecialiteOptionsHandler);
router.get("/my-choices", requireRole(LEGACY_STUDENT_ROLES), getMySpecialiteChoicesHandler);
router.post("/choose-specialite", requireRole(LEGACY_STUDENT_ROLES), chooseSpecialiteHandler);

export default router;
