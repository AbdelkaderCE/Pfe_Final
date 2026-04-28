import { Router } from "express";
import {
  getPublicSiteSettingsHandler,
  uploadSiteSettingsMediaHandler,
  updateSiteSettingsHandler,
} from "./site-settings.controller";
import { requireAnyPermission, requireAuth, requireRole } from "../../middlewares/auth.middleware";
import siteSettingsUpload from "../../middlewares/site-settings-upload.middleware";

const router = Router();

router.get("/", getPublicSiteSettingsHandler);

router.patch(
  "/",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  updateSiteSettingsHandler
);

router.post(
  "/media/:kind",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  siteSettingsUpload.single("file"),
  uploadSiteSettingsMediaHandler
);

export default router;
