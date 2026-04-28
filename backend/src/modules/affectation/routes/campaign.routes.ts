import { Router } from "express";
import { requireAuth, requireRole } from "../../../middlewares/auth.middleware";
import {
  closeCampaignHandler,
  createCampaignHandler,
  deleteCampaignHandler,
  getCampaignHandler,
  listCampaignsHandler,
  listOpenCampaignsForStudentHandler,
  openCampaignHandler,
  updateCampaignHandler,
} from "../controllers/campaign.controller";
import {
  linkSpecialiteHandler,
  unlinkSpecialiteHandler,
  updateLinkQuotaHandler,
} from "../controllers/campaign-specialite.controller";
import { runAlgorithmHandler } from "../controllers/algorithm.controller";
import {
  getCampaignResultsHandler,
  getCampaignStatsHandler,
  listCampaignVoeuxHandler,
} from "../controllers/voeu.controller";

const router = Router();

const adminRoles = ["admin"];
const readRoles = ["admin", "enseignant"];

router.get("/open", requireAuth, requireRole(["etudiant"]), listOpenCampaignsForStudentHandler);

router.get("/", requireAuth, requireRole(readRoles), listCampaignsHandler);
router.post("/", requireAuth, requireRole(adminRoles), createCampaignHandler);

router.get("/:id", requireAuth, requireRole(readRoles), getCampaignHandler);
router.patch("/:id", requireAuth, requireRole(adminRoles), updateCampaignHandler);
router.delete("/:id", requireAuth, requireRole(adminRoles), deleteCampaignHandler);

router.patch("/:id/open", requireAuth, requireRole(adminRoles), openCampaignHandler);
router.patch("/:id/close", requireAuth, requireRole(adminRoles), closeCampaignHandler);

router.post("/:id/specialites", requireAuth, requireRole(adminRoles), linkSpecialiteHandler);

router.post("/:id/run", requireAuth, requireRole(adminRoles), runAlgorithmHandler);

router.get("/:id/voeux", requireAuth, requireRole(readRoles), listCampaignVoeuxHandler);
router.get("/:id/results", requireAuth, requireRole(readRoles), getCampaignResultsHandler);
router.get("/:id/stats", requireAuth, requireRole(readRoles), getCampaignStatsHandler);

export const specialiteLinkRouter = Router();
specialiteLinkRouter.patch(
  "/:id",
  requireAuth,
  requireRole(adminRoles),
  updateLinkQuotaHandler
);
specialiteLinkRouter.delete(
  "/:id",
  requireAuth,
  requireRole(adminRoles),
  unlinkSpecialiteHandler
);

export default router;
