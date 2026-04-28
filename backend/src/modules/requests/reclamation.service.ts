import { Prisma } from "@prisma/client";
import prisma from "../../config/database";
import { createAlert } from "../alerts/alert.service";
import { listAdminUserIds } from "../alerts/alerts.service";

type ReclamationAlertClient = typeof prisma | Prisma.TransactionClient;

type NewReclamationAlertInput = {
  reclamationId: number;
  studentUserId?: number | null;
  studentName?: string | null;
};

type ReclamationDecisionAlertInput = {
  reclamationId: number;
  studentUserId: number;
  status: "approved" | "rejected";
  adminMessage?: string | null;
};

const normalizeName = (value?: string | null): string => String(value || "").trim();

export const notifyAdminsAboutNewReclamation = async (
  input: NewReclamationAlertInput,
  client: ReclamationAlertClient = prisma
): Promise<number[]> => {
  const reclamationId = Number(input.reclamationId);
  if (!Number.isInteger(reclamationId) || reclamationId <= 0) {
    throw new Error("A valid reclamationId is required");
  }

  const adminUserIds = await listAdminUserIds(client);
  if (!adminUserIds.length) {
    console.log("[alerts] trigger new-reclamation skipped (no admins)", { reclamationId });
    return [];
  }

  const studentLabel = normalizeName(input.studentName) ||
    (Number.isInteger(Number(input.studentUserId)) && Number(input.studentUserId) > 0
      ? `Student #${Number(input.studentUserId)}`
      : "A student");

  console.log("[alerts] trigger new-reclamation", {
    reclamationId,
    adminCount: adminUserIds.length,
  });

  const createdAlerts = [] as number[];
  for (const adminUserId of adminUserIds) {
    const alert = await createAlert(
      {
        userId: adminUserId,
        type: "RECLAMATION",
        title: "New Reclamation Submitted",
        message: `${studentLabel} submitted a new reclamation.`,
        relatedId: reclamationId,
      },
      client
    );

    createdAlerts.push(alert.id);
  }

  return createdAlerts;
};

export const notifyStudentAboutReclamationDecision = async (
  input: ReclamationDecisionAlertInput,
  client: ReclamationAlertClient = prisma
) => {
  const reclamationId = Number(input.reclamationId);
  const studentUserId = Number(input.studentUserId);

  if (!Number.isInteger(reclamationId) || reclamationId <= 0) {
    throw new Error("A valid reclamationId is required");
  }

  if (!Number.isInteger(studentUserId) || studentUserId <= 0) {
    throw new Error("A valid studentUserId is required");
  }

  const normalizedMessage = normalizeName(input.adminMessage);

  console.log("[alerts] trigger reclamation-decision", {
    reclamationId,
    studentUserId,
    status: input.status,
  });

  return createAlert(
    {
      userId: studentUserId,
      type: "RECLAMATION",
      title: "Reclamation Decision",
      message: [
        `Status: ${input.status}`,
        normalizedMessage ? `Message: ${normalizedMessage}` : null,
      ]
        .filter((entry): entry is string => Boolean(entry))
        .join("\n"),
      relatedId: reclamationId,
    },
    client
  );
};
