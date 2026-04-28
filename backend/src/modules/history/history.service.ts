import prisma from "../../config/database";

const userIncludeForCard = {
  select: {
    id: true,
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
    photo: true,
  },
} as const;

const statusFromConseil = (status: string | null | undefined): string => {
  switch (status) {
    case "planifie":
      return "pending";
    case "en_cours":
      return "pending";
    case "termine":
      return "approved";
    default:
      return "pending";
  }
};

/**
 * Student history: disciplinary councils + reclamations + justifications.
 * `userId` is the User.id (not etudiant.id) — per spec.
 */
export const getStudentHistory = async (userId: number) => {
  const etudiant = await prisma.etudiant.findUnique({
    where: { userId },
    select: {
      id: true,
      matricule: true,
      user: userIncludeForCard,
      promo: { select: { nom_ar: true, nom_en: true, section: true } },
    },
  });

  if (!etudiant) {
    return {
      user: { id: userId },
      disciplinaryCouncils: [],
      reclamations: [],
      justifications: [],
    };
  }

  const [dossiers, reclamations, justifications] = await Promise.all([
    prisma.dossierDisciplinaire.findMany({
      where: { etudiantId: etudiant.id },
      orderBy: { createdAt: "desc" },
      include: {
        infraction: { select: { nom_ar: true, nom_en: true, gravite: true } },
        decision: { select: { nom_ar: true, nom_en: true, niveauSanction: true } },
        conseil: { select: { id: true, dateReunion: true, lieu: true, status: true } },
        enseignantSignalantR: {
          select: { id: true, user: userIncludeForCard },
        },
      },
    }),
    prisma.reclamation.findMany({
      where: { etudiantId: etudiant.id },
      orderBy: { createdAt: "desc" },
      include: { type: { select: { nom_ar: true, nom_en: true } } },
    }),
    prisma.justification.findMany({
      where: { etudiantId: etudiant.id },
      orderBy: { createdAt: "desc" },
      include: { type: { select: { nom_ar: true, nom_en: true } } },
    }),
  ]);

  return {
    user: {
      id: userId,
      etudiantId: etudiant.id,
      matricule: etudiant.matricule,
      nom: etudiant.user?.nom,
      prenom: etudiant.user?.prenom,
      email: etudiant.user?.email,
      promo: etudiant.promo,
    },
    disciplinaryCouncils: dossiers.map((d) => ({
      id: d.id,
      infraction: d.infraction,
      decision: d.decision,
      dateSignal: d.dateSignal,
      dateDecision: d.dateDecision,
      status: d.status,
      reportedBy: d.enseignantSignalantR
        ? {
            id: d.enseignantSignalantR.id,
            name:
              `${d.enseignantSignalantR.user?.prenom ?? ""} ${d.enseignantSignalantR.user?.nom ?? ""}`.trim() ||
              "Teacher",
          }
        : null,
      conseil: d.conseil,
    })),
    reclamations,
    justifications,
  };
};

/**
 * Teacher history: reported students (from disciplinary dossiers) + supervised PFE projects with group members + document requests.
 */
export const getTeacherHistory = async (userId: number) => {
  const enseignant = await prisma.enseignant.findUnique({
    where: { userId },
    select: {
      id: true,
      user: userIncludeForCard,
      grade: { select: { nom_ar: true, nom_en: true } },
    },
  });

  if (!enseignant) {
    return {
      user: { id: userId },
      reportedStudents: [],
      pfeProjects: [],
      documents: [],
    };
  }

  const [dossiers, pfeSujets, documentRequests] = await Promise.all([
    prisma.dossierDisciplinaire.findMany({
      where: { enseignantSignalant: enseignant.id },
      orderBy: { createdAt: "desc" },
      include: {
        etudiant: {
          select: {
            id: true,
            matricule: true,
            user: userIncludeForCard,
          },
        },
        infraction: { select: { nom_ar: true, nom_en: true, gravite: true } },
        conseil: { select: { id: true, status: true, dateReunion: true } },
      },
    }),
    prisma.pfeSujet.findMany({
      where: { enseignantId: enseignant.id },
      orderBy: { createdAt: "desc" },
      include: {
        promo: { select: { nom_ar: true, section: true } },
        groupsPfe: {
          include: {
            groupMembers: {
              include: {
                etudiant: {
                  select: {
                    id: true,
                    matricule: true,
                    user: userIncludeForCard,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.documentRequest.findMany({
      where: { enseignantId: enseignant.id },
      orderBy: { dateDemande: "desc" },
      include: {
        typeDoc: { select: { nom_ar: true, nom_en: true, categorie: true } },
      },
    }),
  ]);

  return {
    user: {
      id: userId,
      enseignantId: enseignant.id,
      nom: enseignant.user?.nom,
      prenom: enseignant.user?.prenom,
      email: enseignant.user?.email,
      grade: enseignant.grade,
    },
    reportedStudents: dossiers.map((d) => ({
      dossierId: d.id,
      student: d.etudiant
        ? {
            id: d.etudiant.id,
            userId: d.etudiant.user?.id,
            matricule: d.etudiant.matricule,
            nom: d.etudiant.user?.nom,
            prenom: d.etudiant.user?.prenom,
            email: d.etudiant.user?.email,
          }
        : null,
      infraction: d.infraction,
      dateSignal: d.dateSignal,
      dossierStatus: d.status,
      councilStatus: statusFromConseil(d.conseil?.status),
      council: d.conseil,
    })),
    pfeProjects: pfeSujets.map((p) => ({
      id: p.id,
      titre_ar: p.titre_ar,
      titre_en: p.titre_en,
      status: p.status,
      typeProjet: p.typeProjet,
      anneeUniversitaire: p.anneeUniversitaire,
      promo: p.promo,
      groups: p.groupsPfe.map((g) => ({
        id: g.id,
        nom_ar: g.nom_ar,
        nom_en: g.nom_en,
        dateSoutenance: g.dateSoutenance,
        note: g.note,
        mention: g.mention,
        members: g.groupMembers.map((m) => ({
          etudiantId: m.etudiant?.id,
          userId: m.etudiant?.user?.id,
          matricule: m.etudiant?.matricule,
          nom: m.etudiant?.user?.nom,
          prenom: m.etudiant?.user?.prenom,
          email: m.etudiant?.user?.email,
          role: m.role,
        })),
      })),
    })),
    documents: documentRequests.map((d) => ({
      id: d.id,
      typeDoc: d.typeDoc,
      description_ar: d.description_ar,
      description_en: d.description_en,
      dateDemande: d.dateDemande,
      status: d.status,
      dateTraitement: d.dateTraitement,
      documentUrl: d.documentUrl,
    })),
  };
};
