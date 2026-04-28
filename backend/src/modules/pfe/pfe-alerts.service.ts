import prisma from "../../config/database";
import { createAlert, listAdminUserIds } from "../alerts/alerts.service";

/**
 * PFE alert hooks. Each function emits via the existing `createAlert` —
 * we never write to the `alerts` table directly. Errors are swallowed and
 * logged so a transient alert failure can't block the actual workflow
 * mutation that triggered it.
 */

const safe = async (label: string, fn: () => Promise<unknown>): Promise<void> => {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(`[pfe-alerts] ${label} failed:`, message);
  }
};

/**
 * Group affectation: a group has just been created OR assigned to a sujet.
 * Notifies every student member + the supervising teacher (`coEncadrant`).
 */
export const emitGroupAffectationAlerts = async (groupId: number): Promise<void> => {
  await safe("group-affectation", async () => {
    const group = await prisma.groupPfe.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        coEncadrant: { select: { user: { select: { id: true } } } },
        sujetFinal: { select: { titre_ar: true, titre_en: true } },
        groupMembers: {
          select: { etudiant: { select: { user: { select: { id: true } } } } },
        },
      },
    });
    if (!group) return;

    const groupLabel = group.nom_ar || group.nom_en || `Group ${group.id}`;
    const subjectTitle = group.sujetFinal?.titre_ar || group.sujetFinal?.titre_en || "your PFE subject";

    const studentMessage = `You've been assigned to ${groupLabel} for "${subjectTitle}".`;
    const teacherMessage = `${groupLabel} has been affected to your supervision for "${subjectTitle}".`;

    for (const member of group.groupMembers) {
      const userId = member.etudiant?.user?.id;
      if (!userId) continue;
      await createAlert({
        userId,
        title: "PFE group assigned",
        message: studentMessage,
        type: "DECISION",
        relatedId: group.id,
      });
    }

    const teacherUserId = group.coEncadrant?.user?.id;
    if (teacherUserId) {
      await createAlert({
        userId: teacherUserId,
        title: "PFE group affected",
        message: teacherMessage,
        type: "DECISION",
        relatedId: group.id,
      });
    }
  });
};

/**
 * Jury membership: a teacher has been added to a jury for a group.
 * Notifies the teacher being added.
 */
export const emitJuryAssignmentAlert = async (juryId: number): Promise<void> => {
  await safe("jury-assignment", async () => {
    const entry = await prisma.pfeJury.findUnique({
      where: { id: juryId },
      select: {
        id: true,
        role: true,
        group: {
          select: {
            id: true,
            nom_ar: true,
            nom_en: true,
            sujetFinal: { select: { titre_ar: true, titre_en: true } },
          },
        },
        enseignant: { select: { user: { select: { id: true } } } },
      },
    });
    if (!entry) return;

    const userId = entry.enseignant?.user?.id;
    if (!userId) return;

    const groupLabel = entry.group?.nom_ar || entry.group?.nom_en || `group ${entry.group?.id ?? ""}`.trim();
    const role = String(entry.role || "membre").toUpperCase();
    const subjectTitle = entry.group?.sujetFinal?.titre_ar || entry.group?.sujetFinal?.titre_en || "the project";

    await createAlert({
      userId,
      title: "PFE jury assignment",
      message: `You've been added as ${role} to the jury of ${groupLabel} (${subjectTitle}).`,
      type: "MEETING",
      relatedId: entry.group?.id ?? entry.id,
    });
  });
};

/**
 * Admin opened the PFE submission window — fan-out an alert to every
 * teacher (enseignant) with a linked user account so they know they can
 * now propose subjects. Idempotent at the alert level (one alert per
 * teacher per call); we don't dedupe across calls intentionally — each
 * open-event is its own announcement.
 */
export const emitSubmissionOpenedAlerts = async (
  triggeredByUserId?: number | null
): Promise<void> => {
  await safe("submission-opened", async () => {
    const teachers = await prisma.enseignant.findMany({
      select: { user: { select: { id: true } } },
    });
    const seen = new Set<number>();
    for (const t of teachers) {
      const userId = Number(t.user?.id);
      if (!Number.isInteger(userId) || userId <= 0 || seen.has(userId)) continue;
      seen.add(userId);
      await createAlert({
        userId,
        title: "PFE submission window opened",
        message:
          "The administration has opened the PFE subject submission window. " +
          "You can now propose your subjects (up to 3 per academic year).",
        type: "DECISION",
        relatedId: triggeredByUserId ?? null,
      });
    }
  });
};

/**
 * Teacher just submitted a new subject — alert every admin so they can
 * triage it (validate / refuse). Skipped silently if no admin role exists.
 */
export const emitSubjectCreatedAlerts = async (sujetId: number): Promise<void> => {
  await safe("subject-created", async () => {
    const sujet = await prisma.pfeSujet.findUnique({
      where: { id: sujetId },
      select: {
        id: true,
        titre_ar: true,
        titre_en: true,
        enseignant: {
          select: { user: { select: { nom: true, prenom: true } } },
        },
      },
    });
    if (!sujet) return;

    const adminUserIds = await listAdminUserIds();
    if (adminUserIds.length === 0) return;

    const teacherName =
      `${sujet.enseignant?.user?.prenom || ""} ${sujet.enseignant?.user?.nom || ""}`.trim() ||
      "A teacher";
    const subjectTitle = sujet.titre_ar || sujet.titre_en || `subject #${sujet.id}`;

    for (const adminId of adminUserIds) {
      await createAlert({
        userId: adminId,
        title: "New PFE subject pending validation",
        message: `${teacherName} submitted "${subjectTitle}" for validation.`,
        type: "REQUEST",
        relatedId: sujet.id,
      });
    }
  });
};

/**
 * Jury fully composed for a group — fan-out to every group member +
 * every jury teacher. Used by the admin "create full jury" endpoint and
 * is safe to call multiple times (each call announces the current state).
 */
export const emitJuryComposedAlerts = async (groupId: number): Promise<void> => {
  await safe("jury-composed", async () => {
    const group = await prisma.groupPfe.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        dateSoutenance: true,
        salleSoutenance: true,
        sujetFinal: { select: { titre_ar: true, titre_en: true } },
        groupMembers: {
          select: { etudiant: { select: { user: { select: { id: true } } } } },
        },
        pfeJury: {
          select: {
            role: true,
            enseignant: {
              select: { user: { select: { id: true, nom: true, prenom: true } } },
            },
          },
        },
      },
    });
    if (!group) return;

    const groupLabel = group.nom_ar || group.nom_en || `Group ${group.id}`;
    const subjectTitle =
      group.sujetFinal?.titre_ar || group.sujetFinal?.titre_en || "your PFE";
    const date = group.dateSoutenance
      ? new Date(group.dateSoutenance).toISOString().slice(0, 16).replace("T", " ")
      : "TBD";
    const salle = group.salleSoutenance || "TBD";
    const juryNames = group.pfeJury
      .map((j) =>
        `${j.enseignant?.user?.prenom || ""} ${j.enseignant?.user?.nom || ""}`.trim()
      )
      .filter(Boolean)
      .join(", ") || "the appointed teachers";

    const studentMessage =
      `Your jury for ${groupLabel} (${subjectTitle}) has been set. ` +
      `Date: ${date}, Room: ${salle}. Members: ${juryNames}.`;
    const teacherMessage =
      `You're on the jury for ${groupLabel} (${subjectTitle}). ` +
      `Date: ${date}, Room: ${salle}.`;

    const seen = new Set<number>();
    for (const member of group.groupMembers) {
      const userId = Number(member.etudiant?.user?.id);
      if (!userId || seen.has(userId)) continue;
      seen.add(userId);
      await createAlert({
        userId,
        title: "PFE jury composed",
        message: studentMessage,
        type: "MEETING",
        relatedId: group.id,
      });
    }
    for (const j of group.pfeJury) {
      const userId = Number(j.enseignant?.user?.id);
      if (!userId || seen.has(userId)) continue;
      seen.add(userId);
      await createAlert({
        userId,
        title: "PFE jury composed",
        message: teacherMessage,
        type: "MEETING",
        relatedId: group.id,
      });
    }
  });
};

/**
 * Soutenance scheduled / rescheduled: notifies group students + every
 * jury member of the new date and salle.
 */
export const emitSoutenanceScheduledAlerts = async (groupId: number): Promise<void> => {
  await safe("soutenance-scheduled", async () => {
    const group = await prisma.groupPfe.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        dateSoutenance: true,
        salleSoutenance: true,
        sujetFinal: { select: { titre_ar: true, titre_en: true } },
        groupMembers: {
          select: { etudiant: { select: { user: { select: { id: true } } } } },
        },
        pfeJury: {
          select: { enseignant: { select: { user: { select: { id: true } } } } },
        },
      },
    });
    if (!group) return;
    if (!group.dateSoutenance) return; // nothing meaningful to announce

    const groupLabel = group.nom_ar || group.nom_en || `Group ${group.id}`;
    const subjectTitle = group.sujetFinal?.titre_ar || group.sujetFinal?.titre_en || "your PFE";
    const date = new Date(group.dateSoutenance).toISOString().slice(0, 16).replace("T", " ");
    const salle = group.salleSoutenance || "TBD";
    const message = `Soutenance for ${groupLabel} (${subjectTitle}) is scheduled on ${date} at ${salle}.`;

    const seen = new Set<number>();
    const sendOnce = async (userId: number, title: string) => {
      if (!Number.isInteger(userId) || userId <= 0 || seen.has(userId)) return;
      seen.add(userId);
      await createAlert({
        userId,
        title,
        message,
        type: "MEETING",
        relatedId: group.id,
      });
    };

    for (const member of group.groupMembers) {
      const userId = member.etudiant?.user?.id;
      if (userId) await sendOnce(userId, "Soutenance scheduled");
    }
    for (const jury of group.pfeJury) {
      const userId = jury.enseignant?.user?.id;
      if (userId) await sendOnce(userId, "Soutenance scheduled (jury)");
    }
  });
};
