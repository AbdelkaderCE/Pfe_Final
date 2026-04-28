import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as voeuService from "../services/voeu.service";
import { validateSubmitVoeuxBody } from "../validators/affectation.validators";
import { parseIdParam, respondInvalidId, sendServiceError } from "./_helpers";

export const submitVoeuxHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }
    const etudiantId = await voeuService.resolveEtudiantIdForUser(req.user.id);
    const payload = validateSubmitVoeuxBody(req.body);
    const voeux = await voeuService.submitVoeux({
      etudiantId,
      campagneId: payload.campagneId,
      choices: payload.choices,
    });
    res.status(201).json({ success: true, data: voeux });
  } catch (error) {
    sendServiceError(res, error, "Failed to submit voeux");
  }
};

export const listMyVoeuxHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }
    const etudiantId = await voeuService.resolveEtudiantIdForUser(req.user.id);
    const campagneId = req.query.campagneId
      ? Number(req.query.campagneId)
      : undefined;
    const voeux = await voeuService.getStudentVoeux(
      etudiantId,
      Number.isInteger(campagneId) && (campagneId as number) > 0 ? campagneId : undefined
    );
    res.status(200).json({ success: true, data: voeux });
  } catch (error) {
    sendServiceError(res, error, "Failed to fetch student voeux");
  }
};

export const getMyAffectationHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }
    const etudiantId = await voeuService.resolveEtudiantIdForUser(req.user.id);
    const affectation = await voeuService.getStudentAffectation(etudiantId);
    res.status(200).json({ success: true, data: affectation });
  } catch (error) {
    sendServiceError(res, error, "Failed to fetch student affectation");
  }
};

export const listCampaignVoeuxHandler = async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res, "campaignId");
  try {
    const voeux = await voeuService.listCampaignVoeux(id);
    res.status(200).json({ success: true, data: voeux });
  } catch (error) {
    sendServiceError(res, error, "Failed to list campaign voeux");
  }
};

export const getCampaignResultsHandler = async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res, "campaignId");
  try {
    const results = await voeuService.getCampaignResults(id);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    sendServiceError(res, error, "Failed to fetch campaign results");
  }
};

export const getCampaignStatsHandler = async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res, "campaignId");
  try {
    const stats = await voeuService.getCampaignStats(id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    sendServiceError(res, error, "Failed to fetch campaign stats");
  }
};
