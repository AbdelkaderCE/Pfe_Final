import prisma from "../../../config/database";
import { Prisma, StatusVoeu } from "@prisma/client";
import logger from "../../../utils/logger";
import { createAlert } from "../../alerts/alert.service";

type Client = typeof prisma | Prisma.TransactionClient;

const CAMPAIGN_OPEN_TITLE = "Affectation campaign is open";
const AFFECTATION_RESULT_TITLE = "Affectation result";

const buildCampaignOpenMessage = (campaignName: string, dateFin: Date) => {
  const deadline = dateFin.toISOString().slice(0, 10);
  return `Campaign "${campaignName}" is now open. Submit your voeux before ${deadline}.`;
};

export const notifyCampaignOpened = async (
  campagneId: number,
  client: Client = prisma
) => {
  const campaign = await client.campagneAffectation.findUnique({
    where: { id: campagneId },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      niveauSource: true,
      dateFin: true,
    },
  });

  if (!campaign) return 0;

  const students = await client.etudiant.findMany({
    where: { promo: { specialite: { niveau: campaign.niveauSource } } },
    select: { user: { select: { id: true } } },
  });

  const message = buildCampaignOpenMessage(
    campaign.nom_en || campaign.nom_ar,
    campaign.dateFin
  );

  let sent = 0;
  for (const student of students) {
    const userId = Number(student.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) continue;
    try {
      await createAlert(
        {
          userId,
          type: "REQUEST",
          title: CAMPAIGN_OPEN_TITLE,
          message,
          relatedId: campaign.id,
        },
        client
      );
      sent += 1;
    } catch (error) {
      logger.warn(`Failed to notify student user=${userId} for campaign ${campagneId}`, error);
    }
  }

  logger.info(`Campaign ${campagneId} opened — notified ${sent}/${students.length} students`);
  return sent;
};

export const notifyAffectationResults = async (
  campagneId: number,
  client: Client = prisma
) => {
  const voeux = await client.voeu.findMany({
    where: { campagneId },
    include: {
      etudiant: { select: { userId: true } },
      specialite: { select: { nom_ar: true, nom_en: true } },
      campagne: { select: { nom_ar: true, nom_en: true } },
    },
  });

  const perStudent = new Map<
    number,
    {
      userId: number;
      accepted?: { specialiteName: string };
    }
  >();

  for (const voeu of voeux) {
    const etudiantId = Number(voeu.etudiantId);
    if (!Number.isInteger(etudiantId) || etudiantId <= 0) continue;
    const userId = Number(voeu.etudiant?.userId || 0);
    if (!userId) continue;

    if (!perStudent.has(etudiantId)) {
      perStudent.set(etudiantId, { userId });
    }

    if (voeu.status === StatusVoeu.accepte) {
      const specialiteName =
        voeu.specialite?.nom_en || voeu.specialite?.nom_ar || `Specialite #${voeu.specialiteId}`;
      perStudent.set(etudiantId, {
        userId,
        accepted: { specialiteName },
      });
    }
  }

  let sent = 0;
  for (const state of perStudent.values()) {
    const campaignName =
      voeux[0]?.campagne?.nom_en || voeux[0]?.campagne?.nom_ar || `Campaign #${campagneId}`;
    const message = state.accepted
      ? `You have been affected to "${state.accepted.specialiteName}" in campaign "${campaignName}".`
      : `The campaign "${campaignName}" is complete. Unfortunately, none of your voeux could be honored. Please contact administration.`;

    try {
      await createAlert(
        {
          userId: state.userId,
          type: "DECISION",
          title: AFFECTATION_RESULT_TITLE,
          message,
          relatedId: campagneId,
        },
        client
      );
      sent += 1;
    } catch (error) {
      logger.warn(
        `Failed to notify affectation result to user=${state.userId} for campaign ${campagneId}`,
        error
      );
    }
  }

  logger.info(`Campaign ${campagneId} finished — sent ${sent} result alerts`);
  return sent;
};
