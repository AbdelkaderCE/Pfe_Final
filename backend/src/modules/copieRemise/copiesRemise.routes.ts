import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  createCopieRemise,
  deleteRemise,
  getAllRemises,
  getMyEnseignements,
  getMyRemises,
  updateRemiseStatus,
} from "./copiesRemise.controller";

const router = Router();

router.get("/enseignements/my", requireAuth, getMyEnseignements);
router.get("/my", requireAuth, getMyRemises);
router.get("/all", requireAuth, requireRole(["admin"]), getAllRemises);

router.post("/", requireAuth, createCopieRemise);
router.patch("/:id/status", requireAuth, requireRole(["admin"]), updateRemiseStatus);
router.delete("/:id", requireAuth, requireRole(["admin"]), deleteRemise);

export default router;
