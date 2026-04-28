import { Prisma, StatusDocumentRequest } from "@prisma/client";
import prisma from "../../config/database";
import logger from "../../utils/logger";
import { createAlert } from "./alert.service";

export { createAlert, getUserAlerts, markAsRead } from "./alert.service";

type AlertEventClient = typeof prisma | Prisma.TransactionClient;

const normalizeText = (value: unknown): string => String(value || "").trim();

const formatDateTime = (value: Date | string | null | undefined): string => {
  if (!value) return "TBD";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toISOString().replace("T", " ").slice(0, 16);
};

const resolveDossierEventTargets = async (dossierId: number, client: AlertEventClient) => {
  const dossier = await client.dossierDisciplinaire.findUnique({
    where: { id: dossierId },
    include: {
      etudiant: { select: { userId: true } },
      enseignantSignalantR: { select: { userId: true } },
      decision: { select: { nom_ar: true, nom_en: true } },
      conseil: {
        select: {
          dateReunion: true,
          lieu: true,
          description_ar: true,
          description_en: true,
        },
      },
    },
  });

  if (!dossier) {
    throw new Error(`Disciplinary case ${dossierId} not found`);
  }

  return dossier;
};

const resolveUserLabel = async (
  userId: number | null | undefined,
  client: AlertEventClient
): Promise<string> => {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    return "Administration";
  }

  const user = await client.user.findUnique({
    where: { id: normalizedUserId },
    select: { nom: true, prenom: true },
  });

  const fullName = `${normalizeText(user?.prenom)} ${normalizeText(user?.nom)}`.trim();
  return fullName || "Administration";
};

export const listAdminUserIds = async (
  client: AlertEventClient = prisma
): Promise<number[]> => {
  const rows = await client.userRole.findMany({
    where: {
      role: {
        nom: {
          equals: "admin",
          mode: "insensitive",
        },
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  return rows
    .map((row) => Number(row.userId))
    .filter((userId): userId is number => Number.isInteger(userId) && userId > 0);
};

export const createMeetingScheduledAlert = async (
  input: { dossierId: number; adminUserId?: number | null },
  client: AlertEventClient = prisma
) => {
  const dossierId = Number(input.dossierId);
  if (!Number.isInteger(dossierId) || dossierId <= 0) {
    throw new Error("A valid dossierId is required");
  }

  const dossier = await resolveDossierEventTargets(dossierId, client);
  const studentUserId = Number(dossier.etudiant?.userId || 0);

  if (!studentUserId) {
    logger.warn(`Meeting alert skipped: student user not found for dossier ${dossierId}`);
    return null;
  }

  const meetingDate = formatDateTime(dossier.conseil?.dateReunion || null);
  const meetingDescription =
    normalizeText(dossier.conseil?.description_ar || dossier.conseil?.description_en) ||
    "A disciplinary meeting has been scheduled for your case.";
  const senderLabel = await resolveUserLabel(input.adminUserId, client);

  console.log("[alerts] trigger meeting", {
    dossierId,
    studentUserId,
    adminUserId: input.adminUserId || null,
  });

  return createAlert(
    {
      userId: studentUserId,
      type: "MEETING",
      title: "Disciplinary Meeting Scheduled",
      message: `Meeting date: ${meetingDate}\nDescription: ${meetingDescription}\nSender: ${senderLabel}`,
      relatedId: dossierId,
    },
    client
  );
};

export const createDisciplinaryDecisionAlerts = async (
  dossierId: number,
  client: AlertEventClient = prisma
) => {
  const dossier = await resolveDossierEventTargets(dossierId, client);
  const studentUserId = Number(dossier.etudiant?.userId || 0);
  const reportingTeacherUserId = Number(dossier.enseignantSignalantR?.userId || 0);
  const decisionValue =
    normalizeText(dossier.decision?.nom_en) ||
    normalizeText(dossier.decision?.nom_ar) ||
    "sanction";
  const explanation =
    normalizeText(dossier.remarqueDecision_en) ||
    normalizeText(dossier.remarqueDecision_ar) ||
    "No explanation provided.";

  const payload = `Decision: ${decisionValue}\nExplanation: ${explanation}`;
  const created: number[] = [];

  if (studentUserId > 0) {
    const studentAlert = await createAlert(
      {
        userId: studentUserId,
        type: "DECISION",
        title: "Disciplinary Decision",
        message: payload,
        relatedId: dossierId,
      },
      client
    );
    created.push(studentAlert.id);
  }

  if (reportingTeacherUserId > 0) {
    const teacherAlert = await createAlert(
      {
        userId: reportingTeacherUserId,
        type: "DECISION",
        title: "Disciplinary Decision",
        message: payload,
        relatedId: dossierId,
      },
      client
    );
    created.push(teacherAlert.id);
  }

  return created;
};

const DOCUMENT_STATUS_LABEL: Record<StatusDocumentRequest, string> = {
  en_attente: "pending",
  en_traitement: "pending",
  valide: "approved",
  refuse: "rejected",
};

export const createDocumentRequestStatusAlert = async (
  documentRequestId: number,
  options: { optionalMessage?: string } = {},
  client: AlertEventClient = prisma
) => {
  const request = await client.documentRequest.findUnique({
    where: { id: documentRequestId },
    include: {
      enseignant: {
        select: {
          userId: true,
        },
      },
      typeDoc: {
        select: {
          nom_ar: true,
          nom_en: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error(`Document request ${documentRequestId} not found`);
  }

  if (
    request.status !== StatusDocumentRequest.valide &&
    request.status !== StatusDocumentRequest.refuse
  ) {
    return null;
  }

  const requesterUserId = Number(request.enseignant?.userId || 0);
  if (!requesterUserId) {
    logger.warn(`Document request alert skipped: requester user not found for request ${documentRequestId}`);
    return null;
  }

  const typeLabel =
    normalizeText(request.typeDoc?.nom_en) ||
    normalizeText(request.typeDoc?.nom_ar) ||
    `Request #${request.id}`;
  const statusLabel = DOCUMENT_STATUS_LABEL[request.status] || String(request.status);
  const optional = normalizeText(options.optionalMessage);
  const message = [
    `Status: ${statusLabel}`,
    `Request: ${typeLabel}`,
    optional ? `Message: ${optional}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  console.log("[alerts] trigger document-status", {
    documentRequestId,
    requesterUserId,
    status: request.status,
  });

  return createAlert(
    {
      userId: requesterUserId,
      type: "DOCUMENT",
      title: "Document Request Update",
      message,
      relatedId: request.id,
    },
    client
  );
};
