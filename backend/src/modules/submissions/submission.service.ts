import prisma from "../../config/database";
import { SubmissionType } from "@prisma/client";

export type SubmissionKind = "JUSTIFICATION" | "RECLAMATION";

export interface GuestSubmissionInput {
  type: SubmissionKind;
  firstName: string;
  lastName: string;
  email: string;
  subject?: string | null;
  message: string;
}

export interface AuthSubmissionInput {
  type: SubmissionKind;
  userId: number;
  subject?: string | null;
  message: string;
}

const asEnum = (value: string): SubmissionType => {
  const upper = String(value || "").toUpperCase();
  if (upper === "JUSTIFICATION") return SubmissionType.JUSTIFICATION;
  if (upper === "RECLAMATION") return SubmissionType.RECLAMATION;
  throw new Error("Invalid submission type. Expected JUSTIFICATION or RECLAMATION.");
};

export const createGuestSubmission = async (input: GuestSubmissionInput) => {
  return prisma.guestSubmission.create({
    data: {
      type: asEnum(input.type),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject?.trim() || null,
      message: input.message.trim(),
    },
  });
};

export const createUserSubmission = async (input: AuthSubmissionInput) => {
  return prisma.submission.create({
    data: {
      type: asEnum(input.type),
      userId: input.userId,
      subject: input.subject?.trim() || null,
      message: input.message.trim(),
    },
  });
};

export const listUserSubmissions = async (userId: number) => {
  return prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const listGuestSubmissions = async () => {
  return prisma.guestSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
};
