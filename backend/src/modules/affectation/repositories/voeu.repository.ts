import prisma from "../../../config/database";
import { Prisma, StatusVoeu } from "@prisma/client";

type Client = typeof prisma | Prisma.TransactionClient;

export const findVoeuxForCampaign = (campagneId: number, client: Client = prisma) =>
  client.voeu.findMany({
    where: { campagneId },
    include: {
      etudiant: {
        include: {
          user: { select: { id: true, nom: true, prenom: true, email: true } },
        },
      },
      specialite: { select: { id: true, nom_ar: true, nom_en: true } },
    },
    orderBy: [
      { etudiant: { moyenne: "desc" } },
      { etudiantId: "asc" },
      { ordre: "asc" },
    ],
  });

export const findVoeuxByStudent = (
  etudiantId: number,
  campagneId?: number,
  client: Client = prisma
) => {
  const where: Prisma.VoeuWhereInput = { etudiantId };
  if (campagneId) where.campagneId = campagneId;
  return client.voeu.findMany({
    where,
    include: {
      specialite: { select: { id: true, nom_ar: true, nom_en: true } },
      campagne: { select: { id: true, nom_ar: true, status: true } },
    },
    orderBy: [{ campagneId: "desc" }, { ordre: "asc" }],
  });
};

export const deleteVoeuxForStudentInCampaign = (
  etudiantId: number,
  campagneId: number,
  client: Client = prisma
) =>
  client.voeu.deleteMany({
    where: { etudiantId, campagneId },
  });

export const createManyVoeux = (
  data: Prisma.VoeuCreateManyInput[],
  client: Client = prisma
) =>
  client.voeu.createMany({
    data,
  });

export const resetVoeuxStatusForCampaign = (campagneId: number, client: Client = prisma) =>
  client.voeu.updateMany({
    where: { campagneId },
    data: { status: StatusVoeu.en_attente },
  });

export const updateVoeuStatus = (
  id: number,
  status: StatusVoeu,
  client: Client = prisma
) => client.voeu.update({ where: { id }, data: { status } });

export const findStudentAcceptedAffectation = (
  etudiantId: number,
  client: Client = prisma
) =>
  client.voeu.findFirst({
    where: { etudiantId, status: StatusVoeu.accepte },
    include: {
      specialite: { select: { id: true, nom_ar: true, nom_en: true } },
      campagne: { select: { id: true, nom_ar: true, status: true } },
    },
    orderBy: { dateSaisie: "desc" },
  });

export const findAcceptedVoeuxForCampaign = (
  campagneId: number,
  client: Client = prisma
) =>
  client.voeu.findMany({
    where: { campagneId, status: StatusVoeu.accepte },
    include: {
      etudiant: {
        include: {
          user: { select: { id: true, nom: true, prenom: true, email: true } },
        },
      },
      specialite: { select: { id: true, nom_ar: true, nom_en: true } },
    },
    orderBy: { specialiteId: "asc" },
  });

export const countVoeuxStatsForCampaign = async (
  campagneId: number,
  client: Client = prisma
) => {
  const [total, accepted, refused, pending, distinctStudents] = await Promise.all([
    client.voeu.count({ where: { campagneId } }),
    client.voeu.count({ where: { campagneId, status: StatusVoeu.accepte } }),
    client.voeu.count({ where: { campagneId, status: StatusVoeu.refuse } }),
    client.voeu.count({ where: { campagneId, status: StatusVoeu.en_attente } }),
    client.voeu.findMany({
      where: { campagneId },
      distinct: ["etudiantId"],
      select: { etudiantId: true },
    }),
  ]);

  return {
    total,
    accepted,
    refused,
    pending,
    studentsWithVoeux: distinctStudents.length,
  };
};

export const findDistinctStudentIdsForCampaign = async (
  campagneId: number,
  client: Client = prisma
): Promise<number[]> => {
  const rows = await client.voeu.findMany({
    where: { campagneId },
    distinct: ["etudiantId"],
    select: { etudiantId: true },
  });
  return rows
    .map((row) => Number(row.etudiantId))
    .filter((id): id is number => Number.isInteger(id) && id > 0);
};
