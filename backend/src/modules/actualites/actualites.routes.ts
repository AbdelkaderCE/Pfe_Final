import { Router } from "express";
import {
  getEventsActualitesHandler,
  getNewsActualitesHandler,
  getPinnedActualitesHandler,
} from "./actualites.controller";

const router = Router();

router.get("/pinned", getPinnedActualitesHandler);
router.get("/news", getNewsActualitesHandler);
router.get("/events", getEventsActualitesHandler);

export default router;
