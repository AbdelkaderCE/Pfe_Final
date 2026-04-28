import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { getMyEnseignements } from "./enseignants.controller";

const router = Router();

router.get("/mes-enseignements", requireAuth, getMyEnseignements);

export default router;
