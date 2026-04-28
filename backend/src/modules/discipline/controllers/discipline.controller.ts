// ═══════════════════════════════════════════════════════════════
// Discipline Module — Controller (Thin HTTP Layer)
// Clean Architecture: HTTP parsing only — delegates to services
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as svc from "../services/discipline.service";
import * as catalog from "../services/catalog.service";

// ── Helper: send service result ─────────────────────────────

const sendResult = (res: Response, result: any, statusOnSuccess = 200) => {
  if (result.error) {
    res.status(result.status || 500).json({ success: false, error: { message: result.error } });
    return;
  }
  if (result.message && !result.data) {
    res.status(statusOnSuccess).json({ success: true, message: result.message });
    return;
  }
  res.status(statusOnSuccess).json({ success: true, data: result.data ?? result });
};

const requireUser = (req: AuthRequest, res: Response): boolean => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: { message: "Authentification requise." } });
    return false;
  }
  return true;
};

const buildCaller = async (req: AuthRequest) =>
  svc.buildCallerContext({ id: req.user!.id, roles: req.user!.roles });


// ═══════════════════ DOSSIER HANDLERS ═══════════════════════

export const listDossiersHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    if (!caller.isAdmin && !caller.enseignantId) {
      res.status(403).json({ success: false, error: { message: "Accès refusé: profil enseignant introuvable." } });
      return;
    }
    const data = await svc.listDossiers(caller, req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getDossierHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.getDossier(Number(req.params.id), caller);
    sendResult(res, result);
  } catch (e) { next(e); }
};

export const createDossierHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.createDossiers(req.body, caller);
    sendResult(res, result, 201);
  } catch (e) { next(e); }
};

export const updateDossierHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.updateDossierService(Number(req.params.id), req.body, caller);
    sendResult(res, result);
  } catch (e) { next(e); }
};

export const deleteDossierHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.deleteDossierService(Number(req.params.id), caller);
    sendResult(res, result);
  } catch (e) { next(e); }
};

// ═══════════════════ CONSEIL HANDLERS ═══════════════════════

export const listConseilsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    if (!caller.isAdmin && !caller.enseignantId) {
      res.status(403).json({ success: false, error: { message: "Accès refusé: profil enseignant introuvable." } });
      return;
    }
    const data = await svc.listConseils(caller, req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getConseilHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.getConseil(Number(req.params.id), caller);
    sendResult(res, result);
  } catch (e) { next(e); }
};

export const createConseilHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.createConseilService(req.body, caller);
    sendResult(res, result, 201);
  } catch (e) { next(e); }
};

export const updateConseilHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.updateConseilService(Number(req.params.id), req.body, caller);
    sendResult(res, result);
  } catch (e) { next(e); }
};

export const deleteConseilHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await svc.deleteConseilService(Number(req.params.id));
    sendResult(res, result);
  } catch (e) { next(e); }
};

export const finaliserConseilHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.finaliserConseilService(Number(req.params.id), req.body, caller);
    sendResult(res, result);
  } catch (e) { next(e); }
};

// ═══════════════════ MEMBRE HANDLERS ════════════════════════

export const addMembreHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const conseilIdFromPath = Number(req.params.cid);
    const result = await svc.addMembreService(
      Number.isInteger(conseilIdFromPath) && conseilIdFromPath > 0 ? conseilIdFromPath : null,
      req.body,
    );
    sendResult(res, result, 201);
  } catch (e) { next(e); }
};

export const removeMembreHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await svc.removeMembreService(Number(req.params.mid));
    sendResult(res, result);
  } catch (e) { next(e); }
};

// ═══════════════════ INFRACTION HANDLERS ════════════════════

export const listInfractionsHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await catalog.listInfractions() }); } catch (e) { next(e); }
};

export const getInfractionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.getInfraction(Number(req.params.id))); } catch (e) { next(e); }
};

export const createInfractionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.createInfractionService(req.body), 201); } catch (e) { next(e); }
};

export const updateInfractionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.updateInfractionService(Number(req.params.id), req.body)); } catch (e) { next(e); }
};

export const deleteInfractionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.deleteInfractionService(Number(req.params.id))); } catch (e) { next(e); }
};

// ═══════════════════ DECISION HANDLERS ══════════════════════

export const listDecisionsHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await catalog.listDecisions() }); } catch (e) { next(e); }
};

export const getDecisionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.getDecisionService(Number(req.params.id))); } catch (e) { next(e); }
};

export const createDecisionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.createDecisionService(req.body), 201); } catch (e) { next(e); }
};

export const updateDecisionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.updateDecisionService(Number(req.params.id), req.body)); } catch (e) { next(e); }
};

export const deleteDecisionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.deleteDecisionService(Number(req.params.id))); } catch (e) { next(e); }
};

// ═══════════════════ RECORD DECISION ════════════════════════

export const recordDecisionHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const caller = await buildCaller(req);
    const result = await svc.recordDecisionService(req.body, caller);
    sendResult(res, result);
  } catch (e) { next(e); }
};

// ═══════════════════ STUDENT / STAFF / STATS ════════════════

export const listDisciplineStudentsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const q = String(req.query.q || "").trim();
    res.json({ success: true, data: await catalog.listStudents(q, null) });
  } catch (e) { next(e); }
};

export const getDisciplineStudentProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try { sendResult(res, await catalog.getStudentProfile(Number(req.params.id))); } catch (e) { next(e); }
};

export const listStaffHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await catalog.listStaff() }); } catch (e) { next(e); }
};

export const searchStaffHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || "").trim();
    res.json({ success: true, data: await catalog.searchStaff(q) });
  } catch (e) { next(e); }
};

export const getAvailableMembersHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const conseilId = Number(req.params.cid);
    const q = String(req.query.q || "").trim();
    const result = await svc.getAvailableMembersService(conseilId, q);
    sendResult(res, result);
  } catch (e) { next(e); }
};

export const statsHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await catalog.getStats() }); } catch (e) { next(e); }
};

// ═══════════════════ STUDENT SELF-ACCESS ════════════════════

export const studentOwnDossiersHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const result = await svc.getStudentOwnDossiers(req.user!.id);
    sendResult(res, result);
  } catch (e) { next(e); }
};

export const studentNotificationsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireUser(req, res)) return;
    const result = await svc.getStudentNotifications(req.user!.id);
    sendResult(res, result);
  } catch (e) { next(e); }
};

// Alias
export const scheduleMeetingHandler = createConseilHandler;
