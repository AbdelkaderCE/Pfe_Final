import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  getAlertsHandler,
  getActiveAlertsHandler,
  markAlertAsReadHandler,
} from "./alerts.controller";

const router = Router();

router.get("/active", requireAuth, getActiveAlertsHandler);
router.get("/", requireAuth, getAlertsHandler);
router.patch("/:id/read", requireAuth, markAlertAsReadHandler);

export default router;
