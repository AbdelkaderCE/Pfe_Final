import prisma from "../../../config/database";
import logger from "../../../utils/logger";
import { StatusCampagne } from "@prisma/client";
import * as linkRepo from "../repositories/campaign-specialite.repository";
import * as campaignRepo from "../repositories/campaign.repository";
import { AffectationServiceError } from "./campaign.service";

const validateSpecialiteExists = async (specialiteId: number) => {
  const specialite = await prisma.specialite.findUnique({
    where: { id: specialiteId },
    select: { id: true },
  });
  if (!specialite) {
    throw new AffectationServiceError(
      `Specialite ${specialiteId} not found`,
      "SPECIALITE_NOT_FOUND",
      404
    );
  }
};

const assertCampaignEditable = async (campagneId: number) => {
  const campaign = await campaignRepo.findCampaignById(campagneId);
  if (!campaign) {
    throw new AffectationServiceError(
      `Campaign ${campagneId} not found`,
      "CAMPAIGN_NOT_FOUND",
      404
    );
  }
  if (campaign.status === StatusCampagne.terminee) {
    throw new AffectationServiceError(
      "Cannot change specialites on a completed campaign",
      "CAMPAIGN_LOCKED",
      409
    );
  }
  return campaign;
};

export const linkSpecialite = async (input: {
  campagneId: number;
  specialiteId: number;
  quota: number | null;
}) => {
  await assertCampaignEditable(input.campagneId);
  await validateSpecialiteExists(input.specialiteId);

  const existing = await linkRepo.findLink(input.campagneId, input.specialiteId);
  if (existing) {
    throw new AffectationServiceError(
      "This specialite is already linked to the campaign",
      "SPECIALITE_ALREADY_LINKED",
      409
    );
  }

  try {
    return await linkRepo.createLink({
      campagneId: input.campagneId,
      specialiteId: input.specialiteId,
      quota: input.quota,
    });
  } catch (error) {
    logger.error("linkSpecialite failed", error);
    throw error;
  }
};

export const updateLinkQuota = async (id: number, quota: number | null) => {
  const link = await linkRepo.findLinkById(id);
  if (!link) {
    throw new AffectationServiceError(
      `Campaign-specialite link ${id} not found`,
      "LINK_NOT_FOUND",
      404
    );
  }
  await assertCampaignEditable(link.campagneId);

  if (quota !== null && link.placesOccupees > quota) {
    throw new AffectationServiceError(
      `Cannot reduce quota below current occupancy (${link.placesOccupees})`,
      "QUOTA_BELOW_OCCUPANCY",
      409
    );
  }

  return linkRepo.updateLinkQuota(id, quota);
};

export const unlinkSpecialite = async (id: number) => {
  const link = await linkRepo.findLinkById(id);
  if (!link) {
    throw new AffectationServiceError(
      `Campaign-specialite link ${id} not found`,
      "LINK_NOT_FOUND",
      404
    );
  }
  await assertCampaignEditable(link.campagneId);

  if (link.placesOccupees > 0) {
    throw new AffectationServiceError(
      "Specialite already has affected students; cannot unlink",
      "LINK_HAS_AFFECTATIONS",
      409
    );
  }

  return linkRepo.deleteLink(id);
};
