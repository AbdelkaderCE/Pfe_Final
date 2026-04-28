import multer from "multer";
import { Router } from "express";
import {
  createAdminAnnouncementHandler,
  deleteAdminAnnouncementHandler,
  deleteAdminDocumentHandler,
  deleteAdminUserHandler,
  downloadAdminDocumentHandler,
  getAdminAnalyticsHandler,
  getAdminDashboardOverviewHandler,
  getAdminUserStatsHandler,
  getUniversalHistoryHandler,
  listAdminAnnouncementsHandler,
  listAdminDocumentsHandler,
  listAdminReclamationsHandler,
  listAdminUsersHandler,
  updateAdminAnnouncementHandler,
  updateAdminReclamationHandler,
  updateAdminUserRoleHandler,
} from "./admin.controller";
import { listAdminAuditLogsHandler } from "./audit.controller";
import { requireAnyPermission, requireAuth, requireRole } from "../../middlewares/auth.middleware";
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
]);

const announcementUpload = multer({
  storage: createDiskStorage("others", "announcements"),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    allowedMimeTypes,
    [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".doc", ".docx", ".txt"],
    "Unsupported file type for announcement attachments"
  ),
});

router.use(requireAuth, requireRole(["admin"]));

router.get("/dashboard/overview", requireAnyPermission(["users:manage"]), getAdminDashboardOverviewHandler);
router.get("/analytics", requireAnyPermission(["users:manage"]), getAdminAnalyticsHandler);
router.get("/user/:id/stats", requireAnyPermission(["users:manage"]), getAdminUserStatsHandler);
router.get("/audit-logs", requireAnyPermission(["users:manage", "reclamations:manage:global"]), listAdminAuditLogsHandler);

router.get("/users", requireAnyPermission(["users:manage"]), listAdminUsersHandler);
router.get("/users/:userId/history", requireAnyPermission(["users:manage"]), getUniversalHistoryHandler);
router.patch("/users/:userId/role", requireAnyPermission(["users:manage", "roles:assign"]), updateAdminUserRoleHandler);
router.delete("/users/:userId", requireAnyPermission(["users:manage"]), deleteAdminUserHandler);

router.get("/announcements", requireAnyPermission(["announcements:manage:global"]), listAdminAnnouncementsHandler);
router.post("/announcements", requireAnyPermission(["announcements:manage:global"]), announcementUpload.array("files", 10), createAdminAnnouncementHandler);
router.patch("/announcements/:id", requireAnyPermission(["announcements:manage:global"]), announcementUpload.array("files", 10), updateAdminAnnouncementHandler);
router.delete("/announcements/:id", requireAnyPermission(["announcements:manage:global"]), deleteAdminAnnouncementHandler);

router.get("/reclamations", requireAnyPermission(["reclamations:manage:global"]), listAdminReclamationsHandler);
router.patch("/reclamations/:id/status", requireAnyPermission(["reclamations:manage:global"]), updateAdminReclamationHandler);

router.get("/documents", requireAnyPermission(["users:manage", "reclamations:manage:global"]), listAdminDocumentsHandler);
router.get("/documents/:kind/:id/download", requireAnyPermission(["users:manage", "reclamations:manage:global"]), downloadAdminDocumentHandler);
router.delete("/documents/:kind/:id", requireAnyPermission(["users:manage", "reclamations:manage:global"]), deleteAdminDocumentHandler);

export default router;
