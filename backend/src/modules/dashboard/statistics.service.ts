/**
 * Centralized statistics service — single source of truth for every metric
 * surfaced on the student / teacher / admin dashboards.
 *
 * Design rules:
 *   • Canonical metric definitions live here. A "pending reclamation" is
 *     defined ONCE (the PENDING_RECLAMATION_STATUSES constant below) and
 *     the same definition flows through every role.
 *   • Callers resolve their own role context (etudiantId / promoIds) and
 *     pass it in. This keeps this module free of role-specific auth logic
 *     while guaranteeing identical counting semantics across dashboards.
 *   • The service only returns numbers / summaries. It never leaks
 *     per-record data — recent lists, profiles, modules, etc. are shaped by
 *     the existing role services that call into this one.
 */

import prisma from "../../config/database";
import {
  GraviteInfraction,
  StatusCampagne,
  StatusDocumentRequest,
  StatusDossier,
  StatusReclamation,
  StatusJustification,
} from "@prisma/client";

// ── Canonical metric definitions ─────────────────────────────────────
const PENDING_RECLAMATION_STATUSES: StatusReclamation[] = [
  StatusReclamation.soumise,
  StatusReclamation.en_cours,
  StatusReclamation.en_attente,
];

const APPROVED_RECLAMATION_STATUSES: StatusReclamation[] = [StatusReclamation.traitee];
const REJECTED_RECLAMATION_STATUSES: StatusReclamation[] = [StatusReclamation.refusee];

const OPEN_DISCIPLINARY_STATUSES: StatusDossier[] = [
  StatusDossier.signale,
  StatusDossier.en_instruction,
  StatusDossier.jugement,
];

// ── Shared summary shape ─────────────────────────────────────────────
export interface DashboardSummary {
  announcements: number;
  reclamations: number;
  pendingReclamations: number;
  documents: number;
  justifications?: number;
  pendingJustifications?: number;
  treatedJustifications?: number;
  disciplineOpenCases?: number;
  disciplineClosedCases?: number;
}

// ── Student PFE info (exposed on the student dashboard) ──────────────
export interface StudentPfeInfo {
  hasPfe: boolean;
  groupId: number | null;
  subjectTitle: string | null;
  assignmentStatus: "draft" | "assigned" | "finalized" | null;
  finalizedAt: string | null;
  supervisorName: string | null;
  isLocked: boolean;
}

/**
 * Resolve the student's current PFE assignment: subject title, lock status,
 * and supervisor name. Reused by the student dashboard + admin analytics so
 * the same rules apply everywhere.
 *
 * Uses $queryRaw to access the new `assignment_status` / `finalized_at`
 * columns without depending on the Prisma client having been regenerated
 * after the schema change.
 */
export const getStudentPfeInfo = async (
  etudiantId: number
): Promise<StudentPfeInfo> => {
  const rows = await prisma.$queryRaw<
    Array<{
      groupId: number;
      subjectTitle: string | null;
      assignmentStatus: string | null;
      finalizedAt: Date | null;
      supervisorFirstName: string | null;
      supervisorLastName: string | null;
    }>
  >`
    SELECT gp.id                               AS "groupId",
           COALESCE(ps.titre_en, ps.titre_ar)  AS "subjectTitle",
           ps.assignment_status                AS "assignmentStatus",
           ps.finalized_at                     AS "finalizedAt",
           u.prenom                            AS "supervisorFirstName",
           u.nom                               AS "supervisorLastName"
      FROM group_members gm
      JOIN groups_pfe  gp ON gp.id = gm.group_id
      JOIN pfe_sujets  ps ON ps.id = gp.sujet_final_id
      JOIN enseignants e  ON e.id  = gp.co_encadrant_id
      JOIN users       u  ON u.id  = e.user_id
     WHERE gm.etudiant_id = ${etudiantId}
     LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return {
      hasPfe: false,
      groupId: null,
      subjectTitle: null,
      assignmentStatus: null,
      finalizedAt: null,
      supervisorName: null,
      isLocked: false,
    };
  }

  const normalizedStatus =
    row.assignmentStatus === "assigned"
      ? "assigned"
      : row.assignmentStatus === "finalized"
        ? "finalized"
        : "draft";

  const supervisorName =
    [row.supervisorFirstName, row.supervisorLastName]
      .filter((part) => part && String(part).trim().length > 0)
      .join(" ")
      .trim() || null;

  return {
    hasPfe: true,
    groupId: row.groupId,
    subjectTitle: row.subjectTitle || null,
    assignmentStatus: normalizedStatus,
    finalizedAt: row.finalizedAt ? row.finalizedAt.toISOString() : null,
    supervisorName,
    isLocked: normalizedStatus === "finalized",
  };
};

export interface TeacherDashboardSummary extends DashboardSummary {
  // Back-compat alias: now means "students this teacher supervises through
  // PFE" (GroupMember whose group.coEncadrantId === enseignantId). The
  // academic group/section/course concepts are removed.
  students: number;
  pendingDocuments: number;
  processingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  // ── PFE-based teacher metrics ──────────────────────────────────────
  supervisedStudents: number;
  pfeGroups: number;
  pfeProjects: number;
  activePfeProjects: number;
  finalizedPfeProjects: number;
  averagePfeGroupSize: number;
}

export interface TeacherPfeGroupBreakdownEntry {
  groupId: number;
  groupName: string;
  subjectTitle: string | null;
  studentCount: number;
  isFinalized: boolean;
}

// ── Student-scoped summary ───────────────────────────────────────────
/**
 * Caller (student-panel.service) has already resolved the student's
 * announcement / document visibility counts via its paginated list helpers.
 * We only need the student's etudiantId to count reclamations directly —
 * which fixes a latent bug where pendingReclamations was computed from the
 * first page of items (at most 5) instead of the full dataset.
 */
export const buildStudentStatistics = async (input: {
  etudiantId: number;
  announcementsVisible: number;
  documentsVisible: number;
}): Promise<DashboardSummary> => {
  const [
    reclamations,
    pendingReclamations,
    justifications,
    pendingJustifications,
    disciplineOpenCases,
    disciplineClosedCases,
  ] = await Promise.all([
    prisma.reclamation.count({ where: { etudiantId: input.etudiantId } }),
    prisma.reclamation.count({
      where: {
        etudiantId: input.etudiantId,
        status: { in: PENDING_RECLAMATION_STATUSES },
      },
    }),
    prisma.justification.count({ where: { etudiantId: input.etudiantId } }),
    prisma.justification.count({
      where: {
        etudiantId: input.etudiantId,
        status: { in: [StatusJustification.soumis, StatusJustification.en_verification] },
      },
    }),
    prisma.dossierDisciplinaire.count({
      where: {
        etudiantId: input.etudiantId,
        status: { in: OPEN_DISCIPLINARY_STATUSES },
      },
    }),
    prisma.dossierDisciplinaire.count({
      where: {
        etudiantId: input.etudiantId,
        status: StatusDossier.traite,
      },
    }),
  ]);

  return {
    announcements: input.announcementsVisible,
    reclamations,
    pendingReclamations,
    documents: input.documentsVisible,
    justifications,
    pendingJustifications,
    treatedJustifications: justifications - pendingJustifications,
    disciplineOpenCases,
    disciplineClosedCases,
  };
};

// ── Teacher-scoped summary ───────────────────────────────────────────
/**
 * Statistics for the teacher dashboard. Scoped by:
 *   • userId         — for things authored by the teacher (announcements, doc requests).
 *   • enseignantId   — for PFE supervision (GroupPfe.coEncadrantId, PfeSujet.enseignantId).
 *   • promoIds       — kept for the reclamation scope (a teacher sees reclamations
 *                      from students enrolled in promos they teach). Promo is part of
 *                      the *kept* model. Section is no longer read or filtered on.
 *
 * The previous "students" count read every Etudiant in the teacher's promos
 * (effectively all-students-in-the-class). That conflated "I teach this promo"
 * with "I supervise this student" and was the only consumer of the academic
 * group/section concept on this dashboard. It is replaced by a count of
 * GroupMember rows whose group is co-supervised by this teacher.
 */
export const buildTeacherStatistics = async (input: {
  userId: number;
  enseignantId: number;
  promoIds: number[];
}): Promise<TeacherDashboardSummary> => {
  const hasPromos = input.promoIds.length > 0;

  const reclamationScope = hasPromos
    ? { etudiant: { promoId: { in: input.promoIds } } }
    : { id: -1 };

  const docScope = { enseignant: { userId: input.userId } };
  // Widen scope: a teacher supervises students through BOTH coEncadrantId
  // (group supervisor) AND sujetFinal.enseignantId (subject owner).
  const pfeSupervisionScope = {
    group: {
      OR: [
        { coEncadrantId: input.enseignantId },
        { sujetFinal: { enseignantId: input.enseignantId } },
      ],
    },
  };
  const pfeGroupScope = {
    OR: [
      { coEncadrantId: input.enseignantId },
      { sujetFinal: { enseignantId: input.enseignantId } },
    ],
  };
  const pfeSubjectScope = { enseignantId: input.enseignantId };

  const [
    announcements,
    reclamations,
    pendingReclamations,
    totalDocuments,
    pendingDocuments,
    processingDocuments,
    approvedDocuments,
    rejectedDocuments,
    supervisedStudents,
    pfeGroups,
    pfeProjects,
    finalizedPfeProjects,
  ] = await Promise.all([
    prisma.annonce.count({ where: { auteurId: input.userId } }),
    prisma.reclamation.count({ where: reclamationScope }),
    prisma.reclamation.count({
      where: { ...reclamationScope, status: { in: PENDING_RECLAMATION_STATUSES } },
    }),
    prisma.documentRequest.count({ where: docScope }),
    prisma.documentRequest.count({ where: { ...docScope, status: StatusDocumentRequest.en_attente } }),
    prisma.documentRequest.count({ where: { ...docScope, status: StatusDocumentRequest.en_traitement } }),
    prisma.documentRequest.count({ where: { ...docScope, status: StatusDocumentRequest.valide } }),
    prisma.documentRequest.count({ where: { ...docScope, status: StatusDocumentRequest.refuse } }),
    prisma.groupMember.count({ where: pfeSupervisionScope }),
    prisma.groupPfe.count({ where: pfeGroupScope }),
    prisma.pfeSujet.count({ where: pfeSubjectScope }),
    prisma.pfeSujet.count({
      where: { ...pfeSubjectScope, assignmentStatus: "finalized" },
    }),
  ]);

  const activePfeProjects = Math.max(0, pfeProjects - finalizedPfeProjects);
  const averagePfeGroupSize =
    pfeGroups > 0 ? Math.round((supervisedStudents / pfeGroups) * 10) / 10 : 0;

  return {
    announcements,
    reclamations,
    pendingReclamations,
    documents: totalDocuments,
    // Back-compat alias: old field, new meaning (PFE-supervised students only).
    students: supervisedStudents,
    pendingDocuments,
    processingDocuments,
    approvedDocuments,
    rejectedDocuments,
    supervisedStudents,
    pfeGroups,
    pfeProjects,
    activePfeProjects,
    finalizedPfeProjects,
    averagePfeGroupSize,
  };
};

// ── Teacher breakdown entry types ────────────────────────────────────

export interface TeacherSpecialiteEntry {
  specialiteId: number | null;
  specialiteName: string;
  count: number;
}

export interface TeacherModuleSpecialiteEntry {
  specialiteId: number | null;
  specialiteName: string;
  modules: string[];
  count: number;
}

export interface TeacherDocumentTypeEntry {
  typeId: number | null;
  typeName: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface TeacherDisciplineTypeEntry {
  infractionId: number;
  infractionName: string;
  count: number;
}

/**
 * Document requests grouped by DocumentType for a teacher's dashboard.
 * Scoped to the teacher's own requests (enseignant.userId = userId).
 * Returns one entry per document type, plus an "Unknown type" bucket for
 * requests with no typeDoc.
 */
export const getTeacherDocumentBreakdown = async (
  enseignantId: number
): Promise<TeacherDocumentTypeEntry[]> => {
  const requests = await prisma.documentRequest.findMany({
    where: { enseignantId },
    select: {
      status: true,
      typeDoc: {
        select: { id: true, nom_ar: true, nom_en: true },
      },
    },
  });

  const map = new Map<string, TeacherDocumentTypeEntry>();

  for (const req of requests) {
    const key = req.typeDoc ? String(req.typeDoc.id) : "null";
    if (!map.has(key)) {
      map.set(key, {
        typeId: req.typeDoc?.id ?? null,
        typeName: req.typeDoc?.nom_en || req.typeDoc?.nom_ar || "Unknown type",
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      });
    }
    const entry = map.get(key)!;
    entry.total += 1;
    if (req.status === StatusDocumentRequest.en_attente || req.status === StatusDocumentRequest.en_traitement) {
      entry.pending += 1;
    } else if (req.status === StatusDocumentRequest.valide) {
      entry.approved += 1;
    } else if (req.status === StatusDocumentRequest.refuse) {
      entry.rejected += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
};

/**
 * PFE subjects owned by this teacher, grouped by the specialite of their
 * target promo. Includes subjects in all statuses (propose, valide, etc.).
 */
export const getTeacherPfeBySpecialite = async (
  enseignantId: number
): Promise<TeacherSpecialiteEntry[]> => {
  const subjects = await prisma.pfeSujet.findMany({
    where: { enseignantId },
    select: {
      promo: {
        select: {
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
    },
  });

  const map = new Map<string, TeacherSpecialiteEntry>();
  for (const s of subjects) {
    const spec = s.promo?.specialite;
    const key = spec ? String(spec.id) : "null";
    if (!map.has(key)) {
      map.set(key, {
        specialiteId: spec?.id ?? null,
        specialiteName: spec?.nom_en || spec?.nom_ar || "Unknown specialite",
        count: 0,
      });
    }
    map.get(key)!.count += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
};

/**
 * Teaching assignments (Enseignement) for this teacher, grouped by the
 * specialite of the assigned promo. Provides one entry per specialite with
 * a deduplicated list of module names and the assignment count.
 */
export const getTeacherModuleBySpecialite = async (
  enseignantId: number
): Promise<TeacherModuleSpecialiteEntry[]> => {
  const rows = await prisma.enseignement.findMany({
    where: { enseignantId },
    select: {
      module: { select: { id: true, nom_ar: true, nom_en: true } },
      promo: {
        select: {
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
    },
  });

  const map = new Map<string, TeacherModuleSpecialiteEntry>();
  for (const row of rows) {
    const spec = row.promo?.specialite;
    const key = spec ? String(spec.id) : "null";
    if (!map.has(key)) {
      map.set(key, {
        specialiteId: spec?.id ?? null,
        specialiteName: spec?.nom_en || spec?.nom_ar || "Unknown specialite",
        modules: [],
        count: 0,
      });
    }
    const entry = map.get(key)!;
    entry.count += 1;
    const moduleName = row.module?.nom_en || row.module?.nom_ar;
    if (moduleName && !entry.modules.includes(moduleName)) {
      entry.modules.push(moduleName);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
};

/**
 * Disciplinary cases reported by this teacher (enseignantSignalant),
 * grouped by infraction type.
 */
export const getTeacherDisciplineByType = async (
  enseignantId: number
): Promise<TeacherDisciplineTypeEntry[]> => {
  const dossiers = await prisma.dossierDisciplinaire.findMany({
    where: { enseignantSignalant: enseignantId },
    select: {
      infraction: { select: { id: true, nom_ar: true, nom_en: true } },
    },
  });

  const map = new Map<number, TeacherDisciplineTypeEntry>();
  for (const d of dossiers) {
    const id = d.infraction.id;
    if (!map.has(id)) {
      map.set(id, {
        infractionId: id,
        infractionName: d.infraction.nom_en || d.infraction.nom_ar,
        count: 0,
      });
    }
    map.get(id)!.count += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
};

/**
 * Per-group breakdown for the "Students per PFE Group" chart on the teacher
 * dashboard. One row per GroupPfe co-supervised by the teacher; uses a single
 * query with a relational `_count` to avoid N+1.
 */
export const getTeacherPfeBreakdown = async (
  enseignantId: number
): Promise<TeacherPfeGroupBreakdownEntry[]> => {
  const groups = await prisma.groupPfe.findMany({
    where: {
      OR: [
        { coEncadrantId: enseignantId },
        { sujetFinal: { enseignantId } },
      ],
    },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      sujetFinal: { select: { titre_ar: true, titre_en: true, assignmentStatus: true } },
      _count: { select: { groupMembers: true } },
    },
    orderBy: { id: "asc" },
  });

  return groups.map((group) => ({
    groupId: group.id,
    groupName: group.nom_en || group.nom_ar || `Group #${group.id}`,
    subjectTitle:
      group.sujetFinal?.titre_en || group.sujetFinal?.titre_ar || null,
    studentCount: group._count.groupMembers,
    isFinalized: group.sujetFinal?.assignmentStatus === "finalized",
  }));
};

// ── Admin global analytics ───────────────────────────────────────────
export interface AdminAnalytics {
  generatedAt: string;
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    students: number;
    teachers: number;
  };
  academic: {
    promos: number;
    modules: number;
  };
  reclamations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  justifications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  announcements: {
    total: number;
    active: number;
  };
  documents: {
    total: number;
    pending: number;
    processing: number;
    approved: number;
    rejected: number;
  };
  pfe: {
    totalSubjects: number;
    activeGroups: number;
    totalSupervisors: number;
    averageStudentsPerSupervisor: number;
    studentsInPfeGroup: number;
  };
  discipline: {
    openCases: number;
    closedCases: number;
    byGravity: Record<string, number>;
  };
  campaigns: {
    total: number;
    draft: number;
    open: number;
    closed: number;
    finalized: number;
  };
}

export const getAdminStatistics = async (): Promise<AdminAnalytics> => {
  const now = new Date();

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    totalStudents,
    totalTeachers,
    totalPromos,
    totalModules,
    totalReclamations,
    pendingReclamations,
    approvedReclamations,
    rejectedReclamations,
    totalJustifications,
    pendingJustifications,
    approvedJustifications,
    rejectedJustifications,
    totalAnnouncements,
    activeAnnouncements,
    totalPfeSubjects,
    activePfeGroups,
    pfeGroupsWithStudents,
    openDisciplinary,
    closedDisciplinary,
    minorDisciplinary,
    mediumDisciplinary,
    graveDisciplinary,
    totalCampaigns,
    draftCampaigns,
    openCampaigns,
    closedCampaigns,
    finalizedCampaigns,
    totalDocumentRequests,
    pendingDocumentRequests,
    processingDocumentRequests,
    approvedDocumentRequests,
    rejectedDocumentRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "inactive" } }),
    prisma.user.count({ where: { status: "suspended" } }),
    prisma.etudiant.count(),
    prisma.enseignant.count(),
    prisma.promo.count(),
    prisma.module.count(),
    prisma.reclamation.count(),
    prisma.reclamation.count({ where: { status: { in: PENDING_RECLAMATION_STATUSES } } }),
    prisma.reclamation.count({ where: { status: { in: APPROVED_RECLAMATION_STATUSES } } }),
    prisma.reclamation.count({ where: { status: { in: REJECTED_RECLAMATION_STATUSES } } }),
    prisma.justification.count(),
    prisma.justification.count({ where: { status: { in: ['soumis', 'en_verification'] } } }),
    prisma.justification.count({ where: { status: 'valide' } }),
    prisma.justification.count({ where: { status: 'refuse' } }),
    prisma.annonce.count(),
    prisma.annonce.count({
      where: {
        OR: [{ dateExpiration: null }, { dateExpiration: { gte: now } }],
      },
    }),
    prisma.pfeSujet.count(),
    prisma.groupPfe.count({ where: { note: null } }),
    prisma.groupMember.count(),
    prisma.dossierDisciplinaire.count({
      where: { status: { in: OPEN_DISCIPLINARY_STATUSES } },
    }),
    prisma.dossierDisciplinaire.count({ where: { status: StatusDossier.traite } }),
    prisma.dossierDisciplinaire.count({
      where: { infraction: { gravite: GraviteInfraction.faible } },
    }),
    prisma.dossierDisciplinaire.count({
      where: { infraction: { gravite: GraviteInfraction.moyenne } },
    }),
    prisma.dossierDisciplinaire.count({
      where: {
        infraction: { gravite: { in: [GraviteInfraction.grave, GraviteInfraction.tres_grave] } },
      },
    }),
    prisma.campagneAffectation.count(),
    prisma.campagneAffectation.count({ where: { status: StatusCampagne.brouillon } }),
    prisma.campagneAffectation.count({ where: { status: StatusCampagne.ouverte } }),
    prisma.campagneAffectation.count({ where: { status: StatusCampagne.fermee } }),
    prisma.campagneAffectation.count({ where: { status: StatusCampagne.terminee } }),
    prisma.documentRequest.count(),
    prisma.documentRequest.count({ where: { status: StatusDocumentRequest.en_attente } }),
    prisma.documentRequest.count({ where: { status: StatusDocumentRequest.en_traitement } }),
    prisma.documentRequest.count({ where: { status: StatusDocumentRequest.valide } }),
    prisma.documentRequest.count({ where: { status: StatusDocumentRequest.refuse } }),
  ]);

  // Supervisor load — derive from GroupPfe.coEncadrantId, since there is
  // no standalone Encadrement model. Each GroupPfe contributes one supervision
  // for its coEncadrantId; total supervised students = groupMember count (above).
  const supervisorGroups = await prisma.groupPfe.groupBy({
    by: ["coEncadrantId"],
    _count: { id: true },
  });

  const totalSupervisors = supervisorGroups.length;
  const averageStudentsPerSupervisor =
    totalSupervisors > 0
      ? Math.round((pfeGroupsWithStudents / totalSupervisors) * 10) / 10
      : 0;

  return {
    generatedAt: now.toISOString(),
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      suspended: suspendedUsers,
      students: totalStudents,
      teachers: totalTeachers,
    },
    academic: {
      promos: totalPromos,
      modules: totalModules,
    },
    reclamations: {
      total: totalReclamations,
      pending: pendingReclamations,
      approved: approvedReclamations,
      rejected: rejectedReclamations,
    },
    justifications: {
      total: totalJustifications,
      pending: pendingJustifications,
      approved: approvedJustifications,
      rejected: rejectedJustifications,
    },
    announcements: {
      total: totalAnnouncements,
      active: activeAnnouncements,
    },
    documents: {
      total: totalDocumentRequests,
      pending: pendingDocumentRequests,
      processing: processingDocumentRequests,
      approved: approvedDocumentRequests,
      rejected: rejectedDocumentRequests,
    },
    pfe: {
      totalSubjects: totalPfeSubjects,
      activeGroups: activePfeGroups,
      totalSupervisors,
      averageStudentsPerSupervisor,
      studentsInPfeGroup: pfeGroupsWithStudents,
    },
    discipline: {
      openCases: openDisciplinary,
      closedCases: closedDisciplinary,
      byGravity: {
        faible: minorDisciplinary,
        moyenne: mediumDisciplinary,
        grave: graveDisciplinary,
      },
    },
    campaigns: {
      total: totalCampaigns,
      draft: draftCampaigns,
      open: openCampaigns,
      closed: closedCampaigns,
      finalized: finalizedCampaigns,
    },
  };
};
