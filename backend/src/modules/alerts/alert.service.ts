import { AlertType, Prisma } from "@prisma/client";
import prisma from "../../config/database";
import logger from "../../utils/logger";

export type AlertTypeInput =
  | AlertType
  | "MEETING"
  | "DOCUMENT"
  | "RECLAMATION"
  | "JUSTIFICATION"
  | "DECISION"
  | "REQUEST";

export type CreateAlertInput = {
  userId: number;
  type: AlertTypeInput;
  title: string;
  message: string;
  relatedId?: number | null;
};

type AlertClient = typeof prisma | Prisma.TransactionClient;

const normalizeAlertType = (value: AlertTypeInput): AlertType => {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "MEETING") return AlertType.MEETING;
  if (normalized === "DECISION") return AlertType.DECISION;
  if (["DOCUMENT", "RECLAMATION", "JUSTIFICATION", "REQUEST"].includes(normalized)) {
    return AlertType.REQUEST;
  }
  return AlertType.REQUEST;
};

const normalizeLimit = (value?: number): number | undefined => {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    return undefined;
  }

  return Math.min(Number(value), 200);
};

export const createAlert = async (
  input: CreateAlertInput,
  client: AlertClient = prisma
) => {
  const userId = Number(input.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("A valid userId is required");
  }

  const normalizedTitle = String(input.title || "").trim().slice(0, 255);
  const baseMessage = String(input.message || "").trim();
  const relatedId = Number(input.relatedId);
  const normalizedRelatedId = Number.isInteger(relatedId) && relatedId > 0 ? relatedId : null;
  const normalizedMessage = [
    baseMessage,
    normalizedRelatedId ? `Reference ID: ${normalizedRelatedId}` : null,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");

  if (!normalizedTitle || !normalizedMessage) {
    throw new Error("Alert title and message are required");
  }

  const normalizedType = normalizeAlertType(input.type);
  console.log("[alerts] trigger", {
    userId,
    type: normalizedType,
    title: normalizedTitle,
    relatedId: normalizedRelatedId,
  });

  const alert = await client.alert.create({
    data: {
      userId,
      title: normalizedTitle,
      message: normalizedMessage,
      type: normalizedType,
    },
  });

  console.log("[alerts] inserted", {
    id: alert.id,
    userId: alert.userId,
    type: alert.type,
  });
  logger.info(`Alert created for user=${userId}, alert=${alert.id}, type=${alert.type}`);
  return alert;
};

export const getUserAlerts = async (
  userId: number,
  options: {
    onlyUnread?: boolean;
    limit?: number;
  } = {},
  client: AlertClient = prisma
) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("A valid userId is required");
  }

  const where: Prisma.AlertWhereInput = {
    userId,
    ...(options.onlyUnread ? { isRead: false } : {}),
  };

  return client.alert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...(normalizeLimit(options.limit) ? { take: normalizeLimit(options.limit) } : {}),
  });
};

export const markAsRead = async (
  alertId: number,
  userId: number,
  client: AlertClient = prisma
) => {
  if (!Number.isInteger(alertId) || alertId <= 0) {
    throw new Error("A valid alertId is required");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("A valid userId is required");
  }

  const existing = await client.alert.findFirst({
    where: {
      id: alertId,
      userId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Alert not found");
  }

  return client.alert.update({
    where: { id: alertId },
    data: { isRead: true },
  });
};
