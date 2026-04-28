import prisma from "../../../config/database";
import logger from "../../../utils/logger";
import { Prisma, StatusCampagne } from "@prisma/client";
import * as voeuRepo from "../repositories/voeu.repository";
import * as campaignRepo from "../repositories/campaign.repository";
import {
  AffectationServiceError,
  ensureCampaignOpen,
  listOpenCampaignsForStudent as listOpenCampaignsForLevel,
} from "./campaign.service";

export const resolveEtudiantIdForUser = async (userId: number): Promise<number> => {
  const etudiant = await prisma.etudiant.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!etudiant) {
    throw new AffectationServiceError(
      "The authenticated user is not a student",
      "NOT_A_STUDENT",
      403
    );
  }
  return etudiant.id;
};

export const listOpenCampaignsForUser = async (userId: number) => {
  const etudiant = await prisma.etudiant.findUnique({
    where: { userId },
    include: {
      promo: {
        include: {
          specialite: { select: { niveau: true } },
        },
      },
    },
  });
  if (!etudiant) {
    throw new AffectationServiceError(
      "The authenticated user is not a student",
      "NOT_A_STUDENT",
      403
    );
  }
  const niveau = etudiant.promo?.specialite?.niveau;
  if (!niveau) return [];
  return listOpenCampaignsForLevel(niveau);
};

export const submitVoeux = async (input: {
  etudiantId: number;
  campagneId: number;
  choices: Array<{ specialiteId: number; ordre: number }>;
}) => {
  const campaign = await ensureCampaignOpen(input.campagneId);

  const allowed = new Set(
    campaign.campagneSpecialites.map((cs) => Number(cs.specialiteId))
  );
  const invalid = input.choices.filter((c) => !allowed.has(c.specialiteId));
  if (invalid.length) {
    throw new AffectationServiceError(
      `Some specialites are not part of this campaign: ${invalid
        .map((c) => c.specialiteId)
        .join(", ")}`,
      "INVALID_SPECIALITE_CHOICES",
      400
    );
  }

  if (input.choices.length > allowed.size) {
    throw new AffectationServiceError(
      "You cannot submit more choices than there are specialites in the campaign",
      "TOO_MANY_CHOICES",
      400
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await voeuRepo.deleteVoeuxForStudentInCampaign(
        input.etudiantId,
        input.campagneId,
        tx
      );

      const rows: Prisma.VoeuCreateManyInput[] = input.choices.map((c) => ({
        campagneId: input.campagneId,
        etudiantId: input.etudiantId,
        specialiteId: c.specialiteId,
        ordre: c.ordre,
      }));

      await voeuRepo.createManyVoeux(rows, tx);
      return voeuRepo.findVoeuxByStudent(input.etudiantId, input.campagneId, tx);
    });
  } catch (error) {
    logger.error("submitVoeux failed", error);
    throw error;
  }
};

export const getStudentVoeux = async (etudiantId: number, campagneId?: number) =>
  voeuRepo.findVoeuxByStudent(etudiantId, campagneId);

export const getStudentAffectation = async (etudiantId: number) =>
  voeuRepo.findStudentAcceptedAffectation(etudiantId);

export const listCampaignVoeux = async (campagneId: number) => {
  const campaign = await campaignRepo.findCampaignById(campagneId);
  if (!campaign) {
    throw new AffectationServiceError(
      `Campaign ${campagneId} not found`,
      "CAMPAIGN_NOT_FOUND",
      404
    );
  }
  return voeuRepo.findVoeuxForCampaign(campagneId);
};

export const getCampaignResults = async (campagneId: number) => {
  const campaign = await campaignRepo.findCampaignById(campagneId);
  if (!campaign) {
    throw new AffectationServiceError(
      `Campaign ${campagneId} not found`,
      "CAMPAIGN_NOT_FOUND",
      404
    );
  }
  if (
    campaign.status !== StatusCampagne.terminee &&
    campaign.status !== StatusCampagne.fermee
  ) {
    throw new AffectationServiceError(
      "Results are available only after the campaign is closed",
      "RESULTS_NOT_READY",
      409
    );
  }
  return voeuRepo.findAcceptedVoeuxForCampaign(campagneId);
};

export const getCampaignStats = async (campagneId: number) => {
  const campaign = await campaignRepo.findCampaignById(campagneId);
  if (!campaign) {
    throw new AffectationServiceError(
      `Campaign ${campagneId} not found`,
      "CAMPAIGN_NOT_FOUND",
      404
    );
  }
  return voeuRepo.countVoeuxStatsForCampaign(campagneId);
};
