import { Request, Response } from "express";
import * as linkService from "../services/campaign-specialite.service";
import {
  validateLinkSpecialiteBody,
  validateUpdateQuotaBody,
} from "../validators/affectation.validators";
import { parseIdParam, respondInvalidId, sendServiceError } from "./_helpers";

export const linkSpecialiteHandler = async (req: Request, res: Response) => {
  try {
    const payload = validateLinkSpecialiteBody(req.body, req.params.id);
    const link = await linkService.linkSpecialite(payload);
    res.status(201).json({ success: true, data: link });
  } catch (error) {
    sendServiceError(res, error, "Failed to link specialite to campaign");
  }
};

export const updateLinkQuotaHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res);
  try {
    const { quota } = validateUpdateQuotaBody(req.body);
    const updated = await linkService.updateLinkQuota(id, quota);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    sendServiceError(res, error, "Failed to update quota");
  }
};

export const unlinkSpecialiteHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res);
  try {
    await linkService.unlinkSpecialite(id);
    res.status(200).json({ success: true });
  } catch (error) {
    sendServiceError(res, error, "Failed to unlink specialite");
  }
};
