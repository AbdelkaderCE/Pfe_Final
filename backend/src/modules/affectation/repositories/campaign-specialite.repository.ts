import prisma from "../../../config/database";
import { Prisma } from "@prisma/client";

type Client = typeof prisma | Prisma.TransactionClient;

export const findLink = (
  campagneId: number,
  specialiteId: number,
  client: Client = prisma
) =>
  client.campagneSpecialite.findFirst({
    where: { campagneId, specialiteId },
  });

export const findLinkById = (id: number, client: Client = prisma) =>
  client.campagneSpecialite.findUnique({ where: { id } });

export const createLink = (
  data: { campagneId: number; specialiteId: number; quota?: number | null },
  client: Client = prisma
) =>
  client.campagneSpecialite.create({
    data: {
      campagneId: data.campagneId,
      specialiteId: data.specialiteId,
      quota: data.quota ?? null,
    },
  });

export const updateLinkQuota = (
  id: number,
  quota: number | null,
  client: Client = prisma
) => client.campagneSpecialite.update({ where: { id }, data: { quota } });

export const deleteLink = (id: number, client: Client = prisma) =>
  client.campagneSpecialite.delete({ where: { id } });

export const resetLinksOccupancy = (campagneId: number, client: Client = prisma) =>
  client.campagneSpecialite.updateMany({
    where: { campagneId },
    data: { placesOccupees: 0 },
  });

export const updateLinkOccupancy = (
  id: number,
  placesOccupees: number,
  client: Client = prisma
) => client.campagneSpecialite.update({ where: { id }, data: { placesOccupees } });
