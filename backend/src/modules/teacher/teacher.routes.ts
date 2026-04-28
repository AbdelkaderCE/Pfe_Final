import multer from "multer";
import { Router } from "express";
import {
  changeTeacherPasswordHandler,
  createTeacherAnnouncementHandler,
  createTeacherDocumentHandler,
  deleteTeacherAnnouncementHandler,
  deleteTeacherDocumentHandler,
  downloadTeacherDocumentHandler,
  getTeacherDashboardHandler,
  getTeacherProfileHandler,
  getTeacherStudentReclamationHistoryHandler,
  listTeacherAnnouncementsHandler,
  listTeacherDocumentsHandler,
  listTeacherReclamationsHandler,
  listTeacherStudentsHandler,
  updateTeacherAnnouncementHandler,
  updateTeacherDocumentHandler,
  updateTeacherProfileHandler,
  updateTeacherReclamationHandler,
} from "./teacher.controller";
import { requireAnyPermission, requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  createDiskStorage,
  createMimeAndExtensionFileFilter,
} from "../../shared/local-upload.service";

const router = Router();

const allowedAnnouncementMimeTypes = new Set([
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

const allowedDocumentMimeTypes = new Set([
  ...allowedAnnouncementMimeTypes,
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const teacherAnnouncementUpload = multer({
  storage: createDiskStorage("others", "teacher-announcements"),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    allowedAnnouncementMimeTypes,
    [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".doc", ".docx", ".txt", ".zip"],
    "Unsupported file type for announcement attachments"
  ),
});

const teacherDocumentUpload = multer({
  storage: createDiskStorage("documents", "teacher"),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    allowedDocumentMimeTypes,
    [
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".gif",
      ".doc",
      ".docx",
      ".txt",
      ".zip",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
    ],
    "Unsupported file type for document uploads"
  ),
});

router.use(requireAuth, requireRole(["enseignant"]));

router.get("/dashboard", requireAnyPermission(["announcements:manage:course", "students:view:course", "reclamations:view:course"]), getTeacherDashboardHandler);

router.get("/announcements", requireAnyPermission(["announcements:manage:course"]), listTeacherAnnouncementsHandler);
router.post(
  "/announcements",
  requireAnyPermission(["announcements:manage:course"]),
  teacherAnnouncementUpload.array("files", 10),
  createTeacherAnnouncementHandler
);
router.patch(
  "/announcements/:id",
  requireAnyPermission(["announcements:manage:course"]),
  teacherAnnouncementUpload.array("files", 10),
  updateTeacherAnnouncementHandler
);
router.delete("/announcements/:id", requireAnyPermission(["announcements:manage:course"]), deleteTeacherAnnouncementHandler);

router.get("/reclamations", requireAnyPermission(["reclamations:view:course"]), listTeacherReclamationsHandler);
router.patch("/reclamations/:id/status", requireAnyPermission(["reclamations:update-status:course", "reclamations:respond:course"]), updateTeacherReclamationHandler);

router.get("/students", requireAnyPermission(["students:view:course"]), listTeacherStudentsHandler);
router.get("/students/:studentId/reclamations", requireAnyPermission(["students:view:course"]), getTeacherStudentReclamationHistoryHandler);

router.get("/documents", requireAnyPermission(["documents:manage:course"]), listTeacherDocumentsHandler);
router.post("/documents", requireAnyPermission(["documents:manage:course"]), teacherDocumentUpload.single("file"), createTeacherDocumentHandler);
router.patch("/documents/:id", requireAnyPermission(["documents:manage:course"]), teacherDocumentUpload.single("file"), updateTeacherDocumentHandler);
router.delete("/documents/:id", requireAnyPermission(["documents:manage:course"]), deleteTeacherDocumentHandler);
router.get("/documents/:id/download", requireAnyPermission(["documents:manage:course"]), downloadTeacherDocumentHandler);

router.get("/profile", requireAnyPermission(["profile:manage:self"]), getTeacherProfileHandler);
router.patch("/profile", requireAnyPermission(["profile:manage:self"]), updateTeacherProfileHandler);
router.post("/profile/change-password", requireAnyPermission(["password:change:self"]), changeTeacherPasswordHandler);

export default router;
