import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware";
import { createSubmission, getMySubmissions } from "./submission.controller";

const router = Router();

router.post("/", optionalAuth, createSubmission);
router.get("/my", requireAuth, getMySubmissions);

export default router;
