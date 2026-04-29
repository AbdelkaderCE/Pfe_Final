import type { Request, Response } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import {
  getPfeConfigSnapshotHandler,
  getStudentVisibilityHandler,
  getSubmissionFlagHandler,
  setStudentVisibilityHandler,
  setSubmissionFlagHandler,
  updatePfeConfigHandler,
} from "./pfe-config.controller";
import { listMyJuryHandler } from "./pfe-jury-me.controller";
import { getMyTeacherSubjectQuotaHandler, getTeacherPromosHandler } from "./pfe-teacher.controller";

const pfeRoutes = require("./index.js");
const { AdminPfeController } = require("./adminPfe.controller");

const adminController = new AdminPfeController();

pfeRoutes.put("/sujets/:id/valider", (req: Request, res: Response) => adminController.validerSujet(req, res));
pfeRoutes.patch("/sujets/:id/validate", (req: Request, res: Response) => adminController.validerSujet(req, res));
pfeRoutes.put("/sujets/:id/refuser", (req: Request, res: Response) => adminController.refuserSujet(req, res));
pfeRoutes.patch("/sujets/:id/reject", (req: Request, res: Response) => adminController.refuserSujet(req, res));

// ── Submission lock (admin) ────────────────────────────────────
// Any authenticated user may READ the flag (so the teacher UI can disable
// the "create" button); only admins may toggle it.
pfeRoutes.get("/admin/config/submission", requireAuth, getSubmissionFlagHandler);
pfeRoutes.put(
  "/admin/config/submission",
  requireAuth,
  requireRole(["admin"]),
  setSubmissionFlagHandler,
);

// ── Student visibility lock (admin) ────────────────────────────
pfeRoutes.get("/admin/config/student-visibility", requireAuth, getStudentVisibilityHandler);
pfeRoutes.put(
  "/admin/config/student-visibility",
  requireAuth,
  requireRole(["admin"]),
  setStudentVisibilityHandler,
);

// ── Bundled config snapshot + bulk update (admin) ──────────────
pfeRoutes.get("/admin/config", requireAuth, requireRole(["admin"]), getPfeConfigSnapshotHandler);
pfeRoutes.put("/admin/config", requireAuth, requireRole(["admin"]), updatePfeConfigHandler);

// ── Teacher jury view + subject quota + promos ─────────────────
pfeRoutes.get("/jury/me", requireAuth, listMyJuryHandler);
pfeRoutes.get("/teacher/quota", requireAuth, getMyTeacherSubjectQuotaHandler);
pfeRoutes.get("/teacher/:enseignantId/promos", requireAuth, getTeacherPromosHandler);

export default pfeRoutes;