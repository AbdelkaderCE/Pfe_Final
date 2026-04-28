import prisma from "../../../config/database";
import { Prisma, StatusCampagne } from "@prisma/client";

type Client = typeof prisma | Prisma.TransactionClient;

export const findCampaigns = (
  filters: {
    status?: StatusCampagne;
    anneeUniversitaire?: string;
  } = {},
  client: Client = prisma
) => {
  const where: Prisma.CampagneAffectationWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.anneeUniversitaire) where.anneeUniversitaire = filters.anneeUniversitaire;

  return client.campagneAffectation.findMany({
    where,
    include: {
      campagneSpecialites: {
        include: {
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
    },
    orderBy: [{ dateDebut: "desc" }, { id: "desc" }],
  });
};

export const findCampaignById = (id: number, client: Client = prisma) =>
  client.campagneAffectation.findUnique({
    where: { id },
    include: {
      campagneSpecialites: {
        include: {
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
    },
  });

export const findCampaignWithVoeux = (id: number, client: Client = prisma) =>
  client.campagneAffectation.findUnique({
    where: { id },
    include: {
      campagneSpecialites: {
        include: {
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
      voeux: {
        include: {
          etudiant: {
            include: {
              user: { select: { id: true, nom: true, prenom: true, email: true } },
            },
          },
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
        orderBy: [{ etudiantId: "asc" }, { ordre: "asc" }],
      },
    },
  });

export const createCampaign = (
  data: Prisma.CampagneAffectationCreateInput,
  client: Client = prisma
) => client.campagneAffectation.create({ data });

export const updateCampaign = (
  id: number,
  data: Prisma.CampagneAffectationUpdateInput,
  client: Client = prisma
) => client.campagneAffectation.update({ where: { id }, data });

export const deleteCampaign = (id: number, client: Client = prisma) =>
  client.campagneAffectation.delete({ where: { id } });

export const countVoeuxForCampaign = (campagneId: number, client: Client = prisma) =>
  client.voeu.count({ where: { campagneId } });

export const findOpenCampaignsForLevel = (
  niveauSource: Prisma.CampagneAffectationWhereInput["niveauSource"],
  client: Client = prisma
) =>
  client.campagneAffectation.findMany({
    where: {
      status: StatusCampagne.ouverte,
      niveauSource,
    },
    include: {
      campagneSpecialites: {
        include: {
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
    },
    orderBy: { dateFin: "asc" },
  });
