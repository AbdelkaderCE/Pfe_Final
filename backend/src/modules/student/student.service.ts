import { Prisma, StatusCampagne } from "@prisma/client";
import prisma from "../../config/database";

const toNumber = (value: Prisma.Decimal | null | undefined): number => {
  if (value == null) {
    return 0;
  }
  return Number(value);
};

const getStudentByUserId = async (userId: number) => {
  const student = await prisma.etudiant.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          photo: true,
          createdAt: true,
          emailVerified: true,
          status: true,
          lastLogin: true,
        },
      },
      promo: {
        include: {
          specialite: {
            include: {
              filiere: {
                include: { departement: true },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return student;
};

const toUrgency = (date: Date | null): "urgent" | "soon" | "normal" | "later" => {
  if (!date) {
    return "normal";
  }
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) {
    return "urgent";
  }
  if (diffDays <= 7) {
    return "soon";
  }
  if (diffDays <= 21) {
    return "normal";
  }
  return "later";
};

export const getStudentProfile = async (userId: number) => {
  const student = await getStudentByUserId(userId);

  return {
    id: student.user.id,
    nom: student.user.nom,
    prenom: student.user.prenom,
    email: student.user.email,
    telephone: student.user.telephone,
    photo: student.user.photo,
    createdAt: student.user.createdAt,
    emailVerified: student.user.emailVerified,
    status: student.user.status,
    lastLogin: student.user.lastLogin,
    etudiant: {
      id: student.id,
      matricule: student.matricule,
      anneeInscription: student.anneeInscription,
      moyenne: toNumber(student.moyenne),
      promo: student.promo
        ? {
            id: student.promo.id,
            nom: student.promo.nom_ar || student.promo.nom_en || null,
            section: student.promo.section,
            anneeUniversitaire: student.promo.anneeUniversitaire,
          }
        : null,
      specialite: student.promo?.specialite
        ? {
            id: student.promo.specialite.id,
            nom: student.promo.specialite.nom_ar || student.promo.specialite.nom_en || null,
            niveau: student.promo.specialite.niveau,
            filiere: student.promo.specialite.filiere
              ? {
                  id: student.promo.specialite.filiere.id,
                  nom: student.promo.specialite.filiere.nom_ar || student.promo.specialite.filiere.nom_en || null,
                  departement:
                    student.promo.specialite.filiere.departement?.nom_ar ||
                    student.promo.specialite.filiere.departement?.nom_en ||
                    null,
                }
              : null,
          }
        : null,
    },
  };
};

export const getStudentSpecialties = async (userId: number) => {
  const student = await getStudentByUserId(userId);

  if (!student.promoId) {
    return [];
  }

  const enseignements = await prisma.enseignement.findMany({
    where: { promoId: student.promoId },
    include: {
      module: true,
      enseignant: {
        include: {
          user: {
            select: { nom: true, prenom: true },
          },
        },
      },
    },
    orderBy: [{ anneeUniversitaire: "desc" }, { id: "asc" }],
  });

  return enseignements.map((enseignement) => ({
    id: enseignement.id,
    code: enseignement.module?.code ?? `MOD-${enseignement.id}`,
    name: enseignement.module?.nom_ar || enseignement.module?.nom_en || "Module",
    teacher: enseignement.enseignant
      ? `${enseignement.enseignant.user.prenom} ${enseignement.enseignant.user.nom}`
      : "N/A",
    type: enseignement.type ? enseignement.type.toUpperCase() : "Cours",
    credits: enseignement.module?.credit ?? 0,
    coefficient: toNumber(enseignement.module?.coef),
    progress: 0,
  }));
};

export const getStudentDeadlines = async (userId: number) => {
  const student = await getStudentByUserId(userId);

  const groups = await prisma.groupMember.findMany({
    where: { etudiantId: student.id },
    include: {
      group: {
        include: {
          sujetFinal: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });

  return groups
    .filter((item) => item.group.dateSoutenance)
    .map((item) => ({
      id: `pfe-${item.group.id}`,
      title: item.group.sujetFinal.titre_ar || item.group.sujetFinal.titre_en || "PFE",
      type: "presentation",
      module: "PFE",
      due: item.group.dateSoutenance,
      urgency: toUrgency(item.group.dateSoutenance),
    }));
};

export const getStudentDocuments = async () => {
  const types = await prisma.documentType.findMany({
    orderBy: { id: "asc" },
    take: 8,
  });

  return types.map((type) => ({
    id: type.id,
    name: type.nom_ar || type.nom_en || "Document",
    format: "PDF",
    size: "N/A",
    category: type.categorie,
    type: "guide",
    updatedAt: null,
  }));
};

export const getStudentNotes = async (userId: number) => {
  const student = await getStudentByUserId(userId);

  if (!student.promoId) {
    return {
      moyenneGenerale: toNumber(student.moyenne),
      modules: [],
    };
  }

  const modules = await prisma.module.findMany({
    where: { specialiteId: student.promo?.specialiteId ?? -1 },
    orderBy: [{ semestre: "asc" }, { nom_ar: "asc" }],
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      code: true,
      credit: true,
      coef: true,
      semestre: true,
    },
  });

  return {
    moyenneGenerale: toNumber(student.moyenne),
    modules: modules.map((module) => ({
      id: module.id,
      nom: module.nom_ar || module.nom_en || null,
      code: module.code,
      semestre: module.semestre,
      credit: module.credit,
      coef: toNumber(module.coef),
      note: null,
    })),
  };
};

export const getSpecialiteOptions = async (userId: number) => {
  const student = await getStudentByUserId(userId);
  const filiereId = student.promo?.specialite?.filiereId;

  if (!filiereId) {
    return [];
  }

  const specialites = await prisma.specialite.findMany({
    where: { filiereId },
    orderBy: { nom_ar: "asc" },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      niveau: true,
    },
  });

  return specialites;
};

export const chooseSpecialite = async (
  userId: number,
  input: {
    campagneId: number;
    specialiteIds: number[];
  }
) => {
  const student = await getStudentByUserId(userId);

  const campagne = await prisma.campagneAffectation.findUnique({
    where: { id: input.campagneId },
    include: {
      campagneSpecialites: {
        select: { specialiteId: true },
      },
    },
  });

  if (!campagne) {
    throw new Error("Campagne not found");
  }

  if (campagne.status !== StatusCampagne.ouverte) {
    throw new Error("Campagne is not open for choices");
  }

  if (!input.specialiteIds.length) {
    throw new Error("At least one specialite is required");
  }

  const allowed = new Set(campagne.campagneSpecialites.map((cs) => cs.specialiteId));
  for (const specialiteId of input.specialiteIds) {
    if (!allowed.has(specialiteId)) {
      throw new Error(`Specialite ${specialiteId} is not available in this campagne`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.voeu.deleteMany({
      where: {
        campagneId: campagne.id,
        etudiantId: student.id,
      },
    });

    await tx.voeu.createMany({
      data: input.specialiteIds.map((specialiteId, index) => ({
        campagneId: campagne.id,
        etudiantId: student.id,
        specialiteId,
        ordre: index + 1,
      })),
    });
  });

  return {
    campagneId: campagne.id,
    savedChoices: input.specialiteIds.length,
  };
};

export const getMySpecialiteChoices = async (userId: number) => {
  const student = await getStudentByUserId(userId);

  const voeux = await prisma.voeu.findMany({
    where: { etudiantId: student.id },
    include: {
      campagne: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
          anneeUniversitaire: true,
          status: true,
        },
      },
      specialite: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
          niveau: true,
        },
      },
    },
    orderBy: [{ campagneId: "desc" }, { ordre: "asc" }],
  });

  return voeux;
};

export const getOpenCampagnes = async () => {
  return prisma.campagneAffectation.findMany({
    where: { status: StatusCampagne.ouverte },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      anneeUniversitaire: true,
      dateDebut: true,
      dateFin: true,
      status: true,
    },
    orderBy: { dateDebut: "desc" },
  });
};
