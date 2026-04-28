import prisma from "../../../config/database";
import { StatusCampagne, StatusVoeu } from "@prisma/client";
import logger from "../../../utils/logger";
import * as campaignRepo from "../repositories/campaign.repository";
import * as linkRepo from "../repositories/campaign-specialite.repository";
import * as voeuRepo from "../repositories/voeu.repository";
import { AffectationServiceError } from "./campaign.service";
import { notifyAffectationResults } from "./notification.service";
import type { AffectationRunResult } from "../types/affectation.types";

type VoeuForAlgorithm = {
  id: number;
  ordre: number;
  specialiteId: number | null;
  etudiantId: number | null;
  moyenne: number;
};

const toMoyenneNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Runs the affectation algorithm for a campaign.
 *
 * Rules:
 *  - Students sorted by moyenne DESC (ties kept stable by etudiantId ASC).
 *  - For each student, walk their voeux in ordre ASC.
 *  - Assign the first voeu whose specialite still has quota, respecting the
 *    per-specialite quota (null quota = unlimited).
 *  - A student receives AT MOST one acceptance; the remaining voeux are refused.
 *  - All DB writes happen inside a single Prisma transaction.
 *  - Campaign status transitions to `terminee` only on success.
 */
export const runAffectationAlgorithm = async (
  campagneId: number
): Promise<AffectationRunResult> => {
  const campaign = await campaignRepo.findCampaignById(campagneId);
  if (!campaign) {
    throw new AffectationServiceError(
      `Campaign ${campagneId} not found`,
      "CAMPAIGN_NOT_FOUND",
      404
    );
  }

  if (
    campaign.status !== StatusCampagne.fermee &&
    campaign.status !== StatusCampagne.ouverte
  ) {
    throw new AffectationServiceError(
      `Cannot run affectation on a campaign in status ${campaign.status}`,
      "CAMPAIGN_NOT_READY",
      409
    );
  }

  if (!campaign.campagneSpecialites?.length) {
    throw new AffectationServiceError(
      "Campaign has no linked specialites",
      "CAMPAIGN_MISSING_SPECIALITES",
      409
    );
  }

  const quotaTracker = new Map<
    number,
    { linkId: number; quota: number | null; occupees: number }
  >();
  for (const link of campaign.campagneSpecialites) {
    quotaTracker.set(Number(link.specialiteId), {
      linkId: link.id,
      quota: link.quota ?? null,
      occupees: 0,
    });
  }

  const voeuxRows = await prisma.voeu.findMany({
    where: { campagneId },
    include: { etudiant: { select: { moyenne: true } } },
  });

  if (!voeuxRows.length) {
    throw new AffectationServiceError(
      "No voeux were submitted for this campaign",
      "NO_VOEUX",
      409
    );
  }

  const voeuxByStudent = new Map<number, VoeuForAlgorithm[]>();
  for (const voeu of voeuxRows) {
    const etudiantId = Number(voeu.etudiantId);
    if (!Number.isInteger(etudiantId) || etudiantId <= 0) continue;
    const normalized: VoeuForAlgorithm = {
      id: voeu.id,
      ordre: voeu.ordre,
      specialiteId: voeu.specialiteId,
      etudiantId: voeu.etudiantId,
      moyenne: toMoyenneNumber(voeu.etudiant?.moyenne),
    };
    const bucket = voeuxByStudent.get(etudiantId);
    if (bucket) bucket.push(normalized);
    else voeuxByStudent.set(etudiantId, [normalized]);
  }

  for (const list of voeuxByStudent.values()) {
    list.sort((a, b) => a.ordre - b.ordre);
  }

  const sortedStudents = Array.from(voeuxByStudent.entries()).sort(
    ([aId, aList], [bId, bList]) => {
      const diff = (bList[0]?.moyenne ?? 0) - (aList[0]?.moyenne ?? 0);
      if (diff !== 0) return diff;
      return aId - bId;
    }
  );

  const updates: Array<{ id: number; status: StatusVoeu }> = [];
  let totalAffected = 0;

  for (const [, voeuxList] of sortedStudents) {
    let assigned = false;
    for (const voeu of voeuxList) {
      const sid = Number(voeu.specialiteId);
      const tracker = quotaTracker.get(sid);
      if (!tracker) {
        updates.push({ id: voeu.id, status: StatusVoeu.refuse });
        continue;
      }

      const hasRoom =
        tracker.quota === null || tracker.occupees < tracker.quota;

      if (!assigned && hasRoom) {
        assigned = true;
        tracker.occupees += 1;
        totalAffected += 1;
        updates.push({ id: voeu.id, status: StatusVoeu.accepte });
      } else {
        updates.push({ id: voeu.id, status: StatusVoeu.refuse });
      }
    }
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await linkRepo.resetLinksOccupancy(campagneId, tx);

        for (const update of updates) {
          await voeuRepo.updateVoeuStatus(update.id, update.status, tx);
        }

        for (const tracker of quotaTracker.values()) {
          await linkRepo.updateLinkOccupancy(tracker.linkId, tracker.occupees, tx);
        }

        await campaignRepo.updateCampaign(
          campagneId,
          {
            status: StatusCampagne.terminee,
            dateAffectation: new Date(),
          },
          tx
        );
      },
      { timeout: 60_000 }
    );
  } catch (error) {
    logger.error(`Affectation algorithm failed for campaign ${campagneId}`, error);
    throw error;
  }

  try {
    await notifyAffectationResults(campagneId);
  } catch (error) {
    logger.warn(
      `Affectation algorithm ran for campaign ${campagneId}, but notifications failed`,
      error
    );
  }

  return {
    campagneId,
    totalStudents: voeuxByStudent.size,
    totalAffected,
    unaffectedStudents: voeuxByStudent.size - totalAffected,
    perSpecialite: Array.from(quotaTracker.entries()).map(([specialiteId, tracker]) => ({
      specialiteId,
      quota: tracker.quota ?? -1,
      placesOccupees: tracker.occupees,
    })),
    completedAt: new Date(),
  };
};
