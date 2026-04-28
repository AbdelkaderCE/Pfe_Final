import { Router } from "express";
import campaignRouter, { specialiteLinkRouter } from "./campaign.routes";
import voeuRouter from "./voeu.routes";
import bulkRouter from "./bulk.routes";

const router = Router();

router.use("/campaigns", campaignRouter);
router.use("/specialites", specialiteLinkRouter);
router.use("/voeux", voeuRouter);
// Bulk admin operations: CSV import, mass promo assignment, bulk
// teacher → enseignement assignment. Mounted last so it doesn't shadow
// the campaign tree.
router.use("/bulk", bulkRouter);

export default router;
