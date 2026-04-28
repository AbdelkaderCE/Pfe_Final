import prisma from "../../../config/database";
import {
  Prisma,
  StatusCampagne,
} from "@prisma/client";
import logger from "../../../utils/logger";
import * as campaignRepo from "../repositories/campaign.repository";
import * as linkRepo from "../repositories/campaign-specialite.repository";
import { notifyCampaignOpened } from "./notification.service";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
} from "../types/affectation.types";

export class AffectationServiceError extends Error {
  public readonly code: string;
  public readonly status: number;
  constructor(message: string, code = "AFFECTATION_ERROR", status = 400) {
    super(message);
    this.name = "AffectationServiceError";
    this.code = code;
    this.status = status;
  }
}

const notFound = (id: number) =>
  new AffectationServiceError(`Campaign ${id} not found`, "CAMPAIGN_NOT_FOUND", 404);

export const listCampaigns = async (filters: {
  status?: string;
  anneeUniversitaire?: string;
}) => {
  const statusFilter =
    filters.status && (Object.values(StatusCampagne) as string[]).includes(filters.status)
      ? (filters.status as StatusCampagne)
      : undefined;

  return campaignRepo.findCampaigns({
    status: statusFilter,
    anneeUniversitaire: filters.anneeUniversitaire,
  });
};

export const getCampaign = async (id: number) => {
  const campaign = await campaignRepo.findCampaignWithVoeux(id);
  if (!campaign) throw notFound(id);
  return campaign;
};

export const createCampaign = async (input: CreateCampaignInput) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const campaign = await campaignRepo.createCampaign(
        {
          nom_ar: input.nom_ar,
          nom_en: input.nom_en ?? null,
          anneeUniversitaire: input.anneeUniversitaire,
          dateDebut: input.dateDebut,
          dateFin: input.dateFin,
          niveauSource: input.niveauSource,
          niveauCible: input.niveauCible,
          status: StatusCampagne.brouillon,
        },
        tx
      );

      if (input.specialites?.length) {
        const unique = new Map<number, number | null>();
        for (const entry of input.specialites) {
          unique.set(entry.specialiteId, entry.quota ?? null);
        }
        for (const [specialiteId, quota] of unique.entries()) {
          await linkRepo.createLink(
            { campagneId: campaign.id, specialiteId, quota },
            tx
          );
        }
      }

      const full = await campaignRepo.findCampaignById(campaign.id, tx);
      if (!full) throw notFound(campaign.id);
      return full;
    });
  } catch (error) {
    logger.error("createCampaign failed", error);
    throw error;
  }
};

export const updateCampaign = async (id: number, patch: UpdateCampaignInput) => {
  const existing = await campaignRepo.findCampaignById(id);
  if (!existing) throw notFound(id);

  if (existing.status === StatusCampagne.terminee && patch.status !== undefined) {
    throw new AffectationServiceError(
      "Completed campaigns cannot be updated",
      "CAMPAIGN_LOCKED",
      409
    );
  }

  const data: Prisma.CampagneAffectationUpdateInput = {};
  if (patch.nom_ar !== undefined) data.nom_ar = patch.nom_ar;
  if (patch.nom_en !== undefined) data.nom_en = patch.nom_en;
  if (patch.anneeUniversitaire !== undefined) data.anneeUniversitaire = patch.anneeUniversitaire;
  if (patch.dateDebut !== undefined) data.dateDebut = patch.dateDebut;
  if (patch.dateFin !== undefined) data.dateFin = patch.dateFin;
  if (patch.niveauSource !== undefined) data.niveauSource = patch.niveauSource;
  if (patch.niveauCible !== undefined) data.niveauCible = patch.niveauCible;
  if (patch.status !== undefined) data.status = patch.status;

  try {
    return await campaignRepo.updateCampaign(id, data);
  } catch (error) {
    logger.error(`updateCampaign(${id}) failed`, error);
    throw error;
  }
};

const assertStatusTransition = (
  current: StatusCampagne,
  target: StatusCampagne
): void => {
  const allowed: Record<StatusCampagne, StatusCampagne[]> = {
    brouillon: [StatusCampagne.ouverte, StatusCampagne.fermee],
    ouverte: [StatusCampagne.fermee],
    fermee: [StatusCampagne.ouverte, StatusCampagne.terminee],
    terminee: [],
  };
  if (!allowed[current].includes(target)) {
    throw new AffectationServiceError(
      `Transition ${current} -> ${target} is not allowed`,
      "INVALID_STATUS_TRANSITION",
      409
    );
  }
};

export const openCampaign = async (id: number) => {
  const existing = await campaignRepo.findCampaignById(id);
  if (!existing) throw notFound(id);

  assertStatusTransition(existing.status, StatusCampagne.ouverte);

  if (!existing.campagneSpecialites?.length) {
    throw new AffectationServiceError(
      "Cannot open a campaign without at least one target specialite",
      "CAMPAIGN_MISSING_SPECIALITES",
      409
    );
  }

  const updated = await campaignRepo.updateCampaign(id, {
    status: StatusCampagne.ouverte,
  });

  try {
    await notifyCampaignOpened(id);
  } catch (error) {
    logger.warn(`Campaign ${id} opened, but notifications failed`, error);
  }

  return updated;
};

export const closeCampaign = async (id: number) => {
  const existing = await campaignRepo.findCampaignById(id);
  if (!existing) throw notFound(id);
  assertStatusTransition(existing.status, StatusCampagne.fermee);
  return campaignRepo.updateCampaign(id, { status: StatusCampagne.fermee });
};

export const deleteCampaign = async (id: number) => {
  const existing = await campaignRepo.findCampaignById(id);
  if (!existing) throw notFound(id);

  if (existing.status !== StatusCampagne.brouillon) {
    throw new AffectationServiceError(
      "Only draft campaigns can be deleted",
      "CAMPAIGN_NOT_DRAFT",
      409
    );
  }

  const voeuxCount = await campaignRepo.countVoeuxForCampaign(id);
  if (voeuxCount > 0) {
    throw new AffectationServiceError(
      "Campaign cannot be deleted while voeux exist",
      "CAMPAIGN_HAS_VOEUX",
      409
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.campagneSpecialite.deleteMany({ where: { campagneId: id } });
    return campaignRepo.deleteCampaign(id, tx);
  });
};

export const ensureCampaignOpen = async (id: number) => {
  const campaign = await campaignRepo.findCampaignById(id);
  if (!campaign) throw notFound(id);
  if (campaign.status !== StatusCampagne.ouverte) {
    throw new AffectationServiceError(
      "Campaign is not open for voeux",
      "CAMPAIGN_NOT_OPEN",
      409
    );
  }
  const now = new Date();
  if (now < campaign.dateDebut || now > campaign.dateFin) {
    throw new AffectationServiceError(
      "Campaign is outside its scheduling window",
      "CAMPAIGN_OUT_OF_WINDOW",
      409
    );
  }
  return campaign;
};

export const listOpenCampaignsForStudent = async (niveauSource: string) => {
  return campaignRepo.findOpenCampaignsForLevel(niveauSource as any);
};
