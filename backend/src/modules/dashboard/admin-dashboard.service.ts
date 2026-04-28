import prisma from "../../config/database";
import {
  GraviteInfraction,
  StatusDossier,
  StatusReclamation,
} from "@prisma/client";
import logger from "../../utils/logger";

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  students: {
    total: number;
    byPromo: Record<string, number>;
  };
  teachers: {
    total: number;
  };
  pfe: {
    totalSubjects: number;
    activeGroups: number;
    defensesScheduled: number;
    defensesCompleted: number;
  };
  requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  discipline: {
    openCases: number;
    closedCases: number;
    byGravity: Record<string, number>;
  };
  announcements: {
    total: number;
    active: number;
  };
}

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      totalStudents,
      totalTeachers,
      totalPFESubjects,
      activePFEGroups,
      pfeDefensesScheduled,
      pfeDefensesCompleted,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      openDisciplinaryCases,
      closedDisciplinaryCases,
      minorCases,
      majorCases,
      severeCases,
      totalAnnouncements,
      activeAnnouncements,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { status: "inactive" } }),
      prisma.user.count({ where: { status: "suspended" } }),
      prisma.etudiant.count(),
      prisma.enseignant.count(),
      prisma.pfeSujet.count(),
      prisma.groupPfe.count({ where: { note: null } }),
      prisma.groupPfe.count({ where: { dateSoutenance: { not: null }, note: null } }),
      prisma.groupPfe.count({ where: { note: { not: null } } }),
      prisma.reclamation.count(),
      prisma.reclamation.count({ where: { status: StatusReclamation.en_attente } }),
      prisma.reclamation.count({ where: { status: StatusReclamation.traitee } }),
      prisma.reclamation.count({ where: { status: StatusReclamation.refusee } }),
      prisma.dossierDisciplinaire.count({
        where: {
          status: { in: [StatusDossier.signale, StatusDossier.en_instruction, StatusDossier.jugement] },
        },
      }),
      prisma.dossierDisciplinaire.count({ where: { status: StatusDossier.traite } }),
      prisma.dossierDisciplinaire.count({ where: { infraction: { gravite: GraviteInfraction.faible } } }),
      prisma.dossierDisciplinaire.count({ where: { infraction: { gravite: GraviteInfraction.moyenne } } }),
      prisma.dossierDisciplinaire.count({
        where: { infraction: { gravite: { in: [GraviteInfraction.grave, GraviteInfraction.tres_grave] } } },
      }),
      prisma.annonce.count(),
      prisma.annonce.count({
        where: {
          OR: [{ dateExpiration: null }, { dateExpiration: { gte: new Date() } }],
        },
      }),
    ]);

    const studentsByPromo = await prisma.etudiant.groupBy({
      by: ["promoId"],
      _count: { id: true },
    });

    const promoNames = await prisma.promo.findMany({
      select: { id: true, nom_ar: true, nom_en: true },
    });

    const promoMap = new Map(promoNames.map((p) => [p.id, p.nom_ar || p.nom_en || `Promo ${p.id}`]));
    const studentsByPromoRecord: Record<string, number> = {};

    studentsByPromo.forEach((item) => {
      if (item.promoId) {
        const promoName = promoMap.get(item.promoId) || `Promo ${item.promoId}`;
        studentsByPromoRecord[promoName] = item._count.id;
      }
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
      },
      students: {
        total: totalStudents,
        byPromo: studentsByPromoRecord,
      },
      teachers: {
        total: totalTeachers,
      },
      pfe: {
        totalSubjects: totalPFESubjects,
        activeGroups: activePFEGroups,
        defensesScheduled: pfeDefensesScheduled,
        defensesCompleted: pfeDefensesCompleted,
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
      },
      discipline: {
        openCases: openDisciplinaryCases,
        closedCases: closedDisciplinaryCases,
        byGravity: {
          faible: minorCases,
          moyenne: majorCases,
          grave: severeCases,
        },
      },
      announcements: {
        total: totalAnnouncements,
        active: activeAnnouncements,
      },
    };
  } catch (error) {
    logger.error("Error fetching admin dashboard stats:", error);
    throw error;
  }
};

export const getAdminReports = async () => {
  try {
    const [totalUsers, totalRecords] = await Promise.all([
      prisma.user.count(),
      prisma.reclamation.count(),
    ]);

    const recentRequests = await prisma.reclamation.findMany({
      take: 10,
      orderBy: { dateReclamation: "desc" },
      include: {
        etudiant: {
          include: {
            user: { select: { nom: true, prenom: true } },
          },
        },
      },
    });

    const recentDisciplinaryCases = await prisma.dossierDisciplinaire.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        infraction: true,
      },
    });

    return {
      health: {
        totalUsers,
        totalRecords,
      },
      recentActivity: {
        requests: recentRequests.map((r) => ({
          id: r.id,
          titre: r.objet_ar || r.objet_en,
          status: r.status,
          submittedAt: r.dateReclamation,
          submittedBy: `${r.etudiant.user.nom} ${r.etudiant.user.prenom}`,
        })),
        disciplinaryCases: recentDisciplinaryCases.map((c) => ({
          id: c.id,
          titre: c.infraction.nom_ar || c.infraction.nom_en,
          status: c.status,
          gravite: c.infraction.gravite,
          dateRapport: c.dateSignal,
        })),
      },
    };
  } catch (error) {
    logger.error("Error fetching admin reports:", error);
    throw error;
  }
};

export const getAnalytics = async (timeframe: "week" | "month" | "year" = "month") => {
  try {
    const now = new Date();
    const startDate = new Date(now);

    if (timeframe === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const [newUsers, newRequests, newAnnouncements] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.reclamation.count({ where: { createdAt: { gte: startDate } } }),
      prisma.annonce.count({ where: { createdAt: { gte: startDate } } }),
    ]);

    return {
      timeframe,
      since: startDate,
      metrics: {
        newUsers,
        newRequests,
        newAnnouncements,
      },
    };
  } catch (error) {
    logger.error("Error fetching analytics:", error);
    throw error;
  }
};
