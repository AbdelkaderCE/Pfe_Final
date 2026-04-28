// ═══════════════════════════════════════════════════════════════
// Discipline Module — Repository Layer
// Clean Architecture: Pure Prisma queries only — no business logic
// ═══════════════════════════════════════════════════════════════

import prisma from "../../../config/database";
import type { Prisma } from "@prisma/client";
import type { TxClient } from "../types/discipline.types";

type DbClient = typeof prisma | TxClient;

// ── Reusable include shapes ──────────────────────────────────

export const dossierInclude = {
  etudiant: {
    include: {
      user: { select: { nom: true, prenom: true, email: true } },
      promo: {
        include: {
          specialite: {
            include: { filiere: { select: { id: true, nom_ar: true, nom_en: true } } },
          },
        },
      },
    },
  },
  infraction: true,
  decision: true,
  enseignantSignalantR: {
    include: { user: { select: { nom: true, prenom: true } } },
  },
  conseil: { select: { id: true, dateReunion: true, lieu: true, status: true } },
} as const;

export const dossierDetailInclude = {
  ...dossierInclude,
  conseil: {
    include: {
      membres: {
        include: {
          enseignant: {
            include: {
              user: { select: { nom: true, prenom: true } },
              grade: { select: { id: true, nom_ar: true, nom_en: true } },
            },
          },
        },
      },
    },
  },
} as const;

export const conseilInclude = {
  membres: {
    include: {
      enseignant: {
        include: {
          user: { select: { nom: true, prenom: true } },
          grade: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
    },
  },
  dossiers: {
    include: {
      etudiant: {
        include: {
          user: { select: { nom: true, prenom: true } },
          promo: {
            include: {
              specialite: {
                include: { filiere: { select: { id: true, nom_ar: true, nom_en: true } } },
              },
            },
          },
        },
      },
      infraction: true,
      decision: true,
      enseignantSignalantR: {
        include: { user: { select: { nom: true, prenom: true } } },
      },
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// Enseignant / Etudiant look-ups
// ═══════════════════════════════════════════════════════════════

export const findEnseignantByUserId = (userId: number, client: DbClient = prisma) =>
  client.enseignant.findUnique({ where: { userId }, select: { id: true } });

export const findEtudiantByUserId = (userId: number, client: DbClient = prisma) =>
  client.etudiant.findUnique({ where: { userId }, select: { id: true } });

// ═══════════════════════════════════════════════════════════════
// Dossier Disciplinaire
// ═══════════════════════════════════════════════════════════════

export const findManyDossiers = (
  where: Prisma.DossierDisciplinaireWhereInput,
  client: DbClient = prisma,
) =>
  client.dossierDisciplinaire.findMany({
    where,
    include: dossierInclude,
    orderBy: { dateSignal: "desc" },
  });

export const findDossierById = (id: number, client: DbClient = prisma) =>
  client.dossierDisciplinaire.findUnique({
    where: { id },
    include: dossierDetailInclude,
  });

export const findDossierBasicById = (
  id: number,
  select: Prisma.DossierDisciplinaireSelect,
  client: DbClient = prisma,
) => client.dossierDisciplinaire.findUnique({ where: { id }, select });

export const findDossiersByIds = (
  ids: number[],
  client: DbClient = prisma,
) =>
  client.dossierDisciplinaire.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, enseignantSignalant: true, conseilId: true },
  });

export const createDossier = (
  data: Prisma.DossierDisciplinaireUncheckedCreateInput,
  client: DbClient = prisma,
) =>
  client.dossierDisciplinaire.create({ data, include: dossierInclude });

export const updateDossier = (
  id: number,
  data: Prisma.DossierDisciplinaireUncheckedUpdateInput,
  client: DbClient = prisma,
) =>
  client.dossierDisciplinaire.update({ where: { id }, data, include: dossierInclude });

export const deleteDossier = (id: number, client: DbClient = prisma) =>
  client.dossierDisciplinaire.delete({ where: { id } });

export const updateManyDossiers = (
  where: Prisma.DossierDisciplinaireWhereInput,
  data: Prisma.DossierDisciplinaireUncheckedUpdateManyInput,
  client: DbClient = prisma,
) => client.dossierDisciplinaire.updateMany({ where, data });

export const countDossiers = (
  where?: Prisma.DossierDisciplinaireWhereInput,
  client: DbClient = prisma,
) => client.dossierDisciplinaire.count({ where });

export const findStudentDossiers = (
  etudiantId: number,
  client: DbClient = prisma,
) =>
  client.dossierDisciplinaire.findMany({
    where: { etudiantId },
    include: {
      infraction: true,
      decision: true,
      conseil: { select: { dateReunion: true } },
    },
    orderBy: { dateSignal: "desc" },
  });

// ═══════════════════════════════════════════════════════════════
// Conseil Disciplinaire
// ═══════════════════════════════════════════════════════════════

export const findManyConseils = (
  where: Prisma.ConseilDisciplinaireWhereInput,
  client: DbClient = prisma,
) =>
  client.conseilDisciplinaire.findMany({
    where,
    include: conseilInclude,
    orderBy: { dateReunion: "desc" },
  });

export const findConseilById = (id: number, client: DbClient = prisma) =>
  client.conseilDisciplinaire.findUnique({
    where: { id },
    include: conseilInclude,
  });

export const findConseilBasicById = (
  id: number,
  client: DbClient = prisma,
) =>
  client.conseilDisciplinaire.findUnique({
    where: { id },
    include: {
      membres: { select: { id: true, enseignantId: true, role: true } },
      dossiers: { select: { id: true, enseignantSignalant: true } },
    },
  });

export const createConseil = (
  data: Prisma.ConseilDisciplinaireUncheckedCreateInput,
  client: DbClient = prisma,
) => client.conseilDisciplinaire.create({ data });

export const updateConseil = (
  id: number,
  data: Prisma.ConseilDisciplinaireUncheckedUpdateInput,
  client: DbClient = prisma,
) => client.conseilDisciplinaire.update({ where: { id }, data });

// Find conseils that should be "en_cours" based on date/time
export const findConseilsNeedingStatusUpdate = async (
  client: DbClient = prisma,
) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get all "planifie" conseils where the meeting time has passed
  const conseils = await client.conseilDisciplinaire.findMany({
    where: {
      status: "planifie",
      dateReunion: {
        lte: today, // Date is today or before
      },
    },
    select: {
      id: true,
      dateReunion: true,
      heure: true,
    },
  });

  // Filter to only those where the time has passed (if time is set)
  return conseils.filter((c) => {
    if (!c.heure) {
      // No specific time, if date is today or before, it should be in progress
      return c.dateReunion <= today;
    }
    // Combine date and time for comparison
    const meetingDateTime = new Date(c.dateReunion);
    meetingDateTime.setHours(c.heure.getHours(), c.heure.getMinutes(), 0, 0);
    return meetingDateTime <= now;
  });
};

// Bulk update conseil statuses
export const updateManyConseilsStatus = async (
  ids: number[],
  status: "planifie" | "en_cours" | "termine",
  client: DbClient = prisma,
) => {
  if (ids.length === 0) return;
  await client.conseilDisciplinaire.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
};

export const deleteConseil = (id: number, client: DbClient = prisma) =>
  client.conseilDisciplinaire.delete({ where: { id } });

export const countConseils = (
  where?: Prisma.ConseilDisciplinaireWhereInput,
  client: DbClient = prisma,
) => client.conseilDisciplinaire.count({ where });

// ═══════════════════════════════════════════════════════════════
// Membre Conseil
// ═══════════════════════════════════════════════════════════════

export const createManyMembres = (
  data: Prisma.MembreConseilCreateManyInput[],
  client: DbClient = prisma,
) => client.membreConseil.createMany({ data });

export const createMembre = (
  data: Prisma.MembreConseilUncheckedCreateInput,
  client: DbClient = prisma,
) =>
  client.membreConseil.create({
    data,
    include: {
      enseignant: {
        include: { user: { select: { nom: true, prenom: true } } },
      },
    },
  });

export const deleteMembre = (id: number, client: DbClient = prisma) =>
  client.membreConseil.delete({ where: { id } });

export const deleteManyMembresByConseil = (
  conseilId: number,
  client: DbClient = prisma,
) => client.membreConseil.deleteMany({ where: { conseilId } });

export const deleteMembresByConseilRaw = (
  conseilId: number,
  client: DbClient = prisma,
) =>
  (client as typeof prisma).$executeRaw`
    DELETE FROM "membres_conseil"
    WHERE "conseil_id" = ${conseilId}
  `;

export const findPresidentByConseil = (
  conseilId: number,
  client: DbClient = prisma,
) =>
  client.membreConseil.findFirst({
    where: { conseilId, role: "president" },
    select: { enseignantId: true },
  });

// ═══════════════════════════════════════════════════════════════
// Infraction
// ═══════════════════════════════════════════════════════════════

export const findManyInfractions = (client: DbClient = prisma) =>
  client.infraction.findMany({ orderBy: { nom_ar: "asc" } });

export const findInfractionById = (id: number, client: DbClient = prisma) =>
  client.infraction.findUnique({ where: { id } });

export const findInfractionByName = (name: string, client: DbClient = prisma) =>
  client.infraction.findFirst({
    where: { OR: [{ nom_ar: name }, { nom_en: name }] },
  });

export const createInfraction = (
  data: Prisma.InfractionUncheckedCreateInput,
  client: DbClient = prisma,
) => client.infraction.create({ data });

export const updateInfraction = (
  id: number,
  data: Prisma.InfractionUncheckedUpdateInput,
  client: DbClient = prisma,
) => client.infraction.update({ where: { id }, data });

export const deleteInfraction = (id: number, client: DbClient = prisma) =>
  client.infraction.delete({ where: { id } });

export const countInfractions = (client: DbClient = prisma) =>
  client.infraction.count();

// ═══════════════════════════════════════════════════════════════
// Decision
// ═══════════════════════════════════════════════════════════════

export const findManyDecisions = (client: DbClient = prisma) =>
  client.decision.findMany({ orderBy: { nom_ar: "asc" } });

export const findDecisionById = (id: number, client: DbClient = prisma) =>
  client.decision.findUnique({ where: { id } });

export const createDecision = (
  data: Prisma.DecisionUncheckedCreateInput,
  client: DbClient = prisma,
) => client.decision.create({ data });

export const updateDecision = (
  id: number,
  data: Prisma.DecisionUncheckedUpdateInput,
  client: DbClient = prisma,
) => client.decision.update({ where: { id }, data });

export const deleteDecisionById = (id: number, client: DbClient = prisma) =>
  client.decision.delete({ where: { id } });

export const countDecisions = (client: DbClient = prisma) =>
  client.decision.count();

// ═══════════════════════════════════════════════════════════════
// Student / Staff helpers
// ═══════════════════════════════════════════════════════════════

const pfeScopeWhere = (enseignantId: number) => ({
  groupMembers: {
    some: {
      group: {
        OR: [
          { coEncadrantId: enseignantId },
          { sujetFinal: { enseignantId } },
        ],
      },
    },
  },
});

export const getTeacherPfeStudentIds = async (enseignantId: number, client: DbClient = prisma) => {
  const rows = await client.etudiant.findMany({
    where: pfeScopeWhere(enseignantId),
    select: { id: true },
  });
  return rows.map((r) => r.id);
};

export const searchStudents = (q: string, enseignantId?: number, client: DbClient = prisma) =>
  client.etudiant.findMany({
    where: {
      ...(enseignantId ? pfeScopeWhere(enseignantId) : {}),
      ...(q ? {
        OR: [
          { user: { nom: { contains: q, mode: "insensitive" } } },
          { user: { prenom: { contains: q, mode: "insensitive" } } },
          { matricule: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: {
      id: true,
      matricule: true,
      user: { select: { nom: true, prenom: true } },
    },
    take: 50,
  });

export const findStudentProfile = (id: number, client: DbClient = prisma) =>
  client.etudiant.findUnique({
    where: { id },
    include: {
      user: { select: { nom: true, prenom: true, email: true } },
      promo: {
        include: {
          specialite: { select: { id: true, nom_ar: true, nom_en: true } },
        },
      },
    },
  });

export const findAllStaff = (client: DbClient = prisma) =>
  client.enseignant.findMany({
    select: {
      id: true,
      user: { select: { nom: true, prenom: true, email: true } },
      grade: { select: { id: true, nom_ar: true, nom_en: true } },
    },
    orderBy: { user: { nom: "asc" } },
  });

export const findAvailableMembers = async (
  conseilId: number,
  searchQuery: string,
  client: DbClient = prisma,
) => {
  const existing = await client.membreConseil.findMany({
    where: { conseilId },
    select: { enseignantId: true },
  });
  const excludedIds = existing.map((m) => m.enseignantId);

  return client.enseignant.findMany({
    where: {
      id: { notIn: excludedIds },
      ...(searchQuery.length >= 2
        ? {
            OR: [
              { user: { nom: { contains: searchQuery, mode: "insensitive" } } },
              { user: { prenom: { contains: searchQuery, mode: "insensitive" } } },
              { grade: { nom_ar: { contains: searchQuery, mode: "insensitive" } } },
              { grade: { nom_en: { contains: searchQuery, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      user: { select: { nom: true, prenom: true, email: true } },
      grade: { select: { id: true, nom_ar: true, nom_en: true } },
    },
    orderBy: [{ user: { nom: "asc" } }, { user: { prenom: "asc" } }],
    take: 20,
  });
};

export const searchStaffByQuery = (query: string, client: DbClient = prisma) =>
  client.enseignant.findMany({
    where: {
      OR: [
        { user: { nom: { contains: query, mode: "insensitive" } } },
        { user: { prenom: { contains: query, mode: "insensitive" } } },
        { grade: { nom_ar: { contains: query, mode: "insensitive" } } },
        { grade: { nom_en: { contains: query, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      user: { select: { nom: true, prenom: true, email: true } },
      grade: { select: { id: true, nom_ar: true, nom_en: true } },
    },
    orderBy: [{ user: { nom: "asc" } }, { user: { prenom: "asc" } }],
    take: 20,
  });

// ═══════════════════════════════════════════════════════════════
// Transaction wrapper
// ═══════════════════════════════════════════════════════════════

export const runTransaction = <T>(
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> => prisma.$transaction(fn);
