import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  createModuleHandler,
  deleteModuleHandler,
  getModuleHandler,
  listModulesHandler,
  updateModuleHandler,
} from "./academic-modules.controller";

const router = Router();

router.use(requireAuth);

// Reads — any authenticated user (selectors, dropdowns, role views)
router.get("/", listModulesHandler);
router.get("/:id", getModuleHandler);

// Writes — admin only
router.post("/", requireRole(["admin"]), createModuleHandler);
router.patch("/:id", requireRole(["admin"]), updateModuleHandler);
router.delete("/:id", requireRole(["admin"]), deleteModuleHandler);

export default router;
