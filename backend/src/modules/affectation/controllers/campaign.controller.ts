import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as campaignService from "../services/campaign.service";
import * as voeuService from "../services/voeu.service";
import {
  validateCreateCampaignBody,
  validateUpdateCampaignBody,
} from "../validators/affectation.validators";
import { parseIdParam, respondInvalidId, sendServiceError } from "./_helpers";

export const listCampaignsHandler = async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignService.listCampaigns({
      status: req.query.status ? String(req.query.status) : undefined,
      anneeUniversitaire: req.query.anneeUniversitaire
        ? String(req.query.anneeUniversitaire)
        : undefined,
    });
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    sendServiceError(res, error, "Failed to list affectation campaigns");
  }
};

export const getCampaignHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res);
  try {
    const campaign = await campaignService.getCampaign(id);
    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    sendServiceError(res, error, "Failed to fetch affectation campaign");
  }
};

export const createCampaignHandler = async (req: Request, res: Response) => {
  try {
    const input = validateCreateCampaignBody(req.body);
    const campaign = await campaignService.createCampaign(input);
    res.status(201).json({
      success: true,
      message: "Campaign created in draft mode. Open it to start the voeux window.",
      data: campaign,
    });
  } catch (error) {
    sendServiceError(res, error, "Failed to create affectation campaign");
  }
};

export const updateCampaignHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res);
  try {
    const patch = validateUpdateCampaignBody(req.body);
    const updated = await campaignService.updateCampaign(id, patch);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    sendServiceError(res, error, "Failed to update affectation campaign");
  }
};

export const deleteCampaignHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res);
  try {
    await campaignService.deleteCampaign(id);
    res.status(200).json({ success: true });
  } catch (error) {
    sendServiceError(res, error, "Failed to delete affectation campaign");
  }
};

export const openCampaignHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res);
  try {
    const updated = await campaignService.openCampaign(id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    sendServiceError(res, error, "Failed to open affectation campaign");
  }
};

export const closeCampaignHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res);
  try {
    const updated = await campaignService.closeCampaign(id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    sendServiceError(res, error, "Failed to close affectation campaign");
  }
};

export const listOpenCampaignsForStudentHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }
    const campaigns = await voeuService.listOpenCampaignsForUser(req.user.id);
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    sendServiceError(res, error, "Failed to list open campaigns");
  }
};
