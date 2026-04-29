const { PrismaClient } = require('@prisma/client');
const { isStudentVisibilityOpen, isStudentSelectionAllowed } = require('./pfe-config.service');

const prisma = new PrismaClient();

class DomainError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function resolveEtudiantByUserId(userId) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new DomainError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const etudiant = await prisma.etudiant.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!etudiant) {
    throw new DomainError(403, 'NOT_A_STUDENT', 'Current user is not a student');
  }
  return etudiant;
}

async function findCurrentMembership(etudiantId) {
  return prisma.groupMember.findFirst({
    where: { etudiantId },
    orderBy: { group: { dateCreation: 'desc' } },
    select: { groupId: true, role: true },
  });
}

async function getMyGroup(userId) {
  const etudiant = await resolveEtudiantByUserId(userId);
  const membership = await findCurrentMembership(etudiant.id);
  if (!membership) {
    return { group: null };
  }

  const group = await prisma.groupPfe.findUnique({
    where: { id: membership.groupId },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      sujetFinalId: true,
      dateCreation: true,
      dateAffectation: true,
      dateSoutenance: true,
      salleSoutenance: true,
      validationFinale: true,
      sujetFinal: {
        select: {
          id: true,
          titre_ar: true,
          titre_en: true,
          description_ar: true,
          typeProjet: true,
          status: true,
          anneeUniversitaire: true,
          promoId: true,
        },
      },
      coEncadrant: {
        select: {
          id: true,
          bureau: true,
          user: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
        },
      },
      groupMembers: {
        select: {
          role: true,
          etudiant: {
            select: {
              id: true,
              matricule: true,
              user: { select: { id: true, nom: true, prenom: true, email: true } },
            },
          },
        },
      },
    },
  });

  return { group, myRole: membership.role };
}

async function getMyDeadlines(userId) {
  const etudiant = await resolveEtudiantByUserId(userId);
  const membership = await findCurrentMembership(etudiant.id);
  if (!membership) {
    return { groupId: null, deadlines: [] };
  }

  const group = await prisma.groupPfe.findUnique({
    where: { id: membership.groupId },
    select: {
      id: true,
      dateSoutenance: true,
      salleSoutenance: true,
      compteRendus: {
        where: { prochaineReunion: { not: null } },
        orderBy: { prochaineReunion: 'asc' },
        select: {
          id: true,
          dateReunion: true,
          prochaineReunion: true,
          actionsDecidees: true,
        },
      },
    },
  });

  const deadlines = [];
  if (group && group.dateSoutenance) {
    deadlines.push({
      type: 'soutenance',
      label: 'Soutenance',
      dueAt: group.dateSoutenance,
      location: group.salleSoutenance,
      source: 'group',
      sourceId: group.id,
    });
  }
  for (const cr of (group && group.compteRendus) || []) {
    deadlines.push({
      type: 'meeting',
      label: 'Prochaine réunion',
      dueAt: cr.prochaineReunion,
      source: 'compte_rendu',
      sourceId: cr.id,
      note: cr.actionsDecidees,
    });
  }

  deadlines.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return { groupId: group ? group.id : null, deadlines };
}

async function getMyGrade(userId) {
  const etudiant = await resolveEtudiantByUserId(userId);
  const membership = await findCurrentMembership(etudiant.id);
  if (!membership) {
    return { available: false };
  }

  const group = await prisma.groupPfe.findUnique({
    where: { id: membership.groupId },
    select: {
      validationFinale: true,
      note: true,
      mention: true,
    },
  });

  if (!group || group.validationFinale !== true) {
    return { available: false };
  }

  return { available: true, note: group.note, mention: group.mention };
}

async function getAvailableSubjects(filters = {}, requesterUserId = null) {
  const { status, promoId, anneeUniversitaire, search, page = 1, limit = 20 } = filters;

  const where = {};

  // Default: show proposed and validated subjects
  if (status) {
    where.status = status;
  } else {
    where.status = { in: ['propose', 'valide'] };
  }

  // CRITICAL ENFORCEMENT — when called by a student, force the promo filter
  // to the student's own promoId regardless of what the client sent. Subjects
  // belonging to other promos must be invisible (security/scope rule). The
  // explicit `promoId` query param is honored only for non-student callers
  // (admin/teacher dashboards). If the student has no promoId on file we
  // return an empty list (defensive default).
  let resolvedStudentPromoId = null;
  if (Number.isInteger(requesterUserId) && requesterUserId > 0) {
    const student = await prisma.etudiant.findUnique({
      where: { userId: requesterUserId },
      select: { promoId: true },
    });
    if (student) {
      // Caller IS a student — also gate by the admin visibility toggle.
      const visibilityOpen = await isStudentVisibilityOpen();
      if (!visibilityOpen) {
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: Math.min(50, Math.max(1, Number(limit) || 20)), totalPages: 0 },
          visibilityClosed: true,
        };
      }
      if (!student.promoId) {
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: Math.min(50, Math.max(1, Number(limit) || 20)), totalPages: 0 },
        };
      }
      resolvedStudentPromoId = student.promoId;
    }
  }

  if (resolvedStudentPromoId) {
    where.promoId = resolvedStudentPromoId;
  } else if (promoId && Number.isInteger(Number(promoId))) {
    where.promoId = Number(promoId);
  }

  if (anneeUniversitaire) {
    where.anneeUniversitaire = String(anneeUniversitaire);
  }

  if (search) {
    where.OR = [
      { titre_ar: { contains: String(search), mode: 'insensitive' } },
      { titre_en: { contains: String(search), mode: 'insensitive' } },
      { description_ar: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, sujets] = await Promise.all([
    prisma.pfeSujet.count({ where }),
    prisma.pfeSujet.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        enseignant: {
          include: { user: { select: { nom: true, prenom: true, email: true } } },
        },
        promo: { select: { id: true, nom_ar: true, nom_en: true } },
        _count: { select: { groupsPfe: true } },
      },
    }),
  ]);

  console.log(`[PFE] getAvailableSubjects: returned ${sujets.length}/${total} subjects`);

  return {
    data: sujets,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}

async function selectSubject(userId, sujetId) {
  const id = Number(sujetId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new DomainError(400, 'INVALID_SUBJECT_ID', 'sujetId must be a positive integer');
  }

  // Config gate: admin may disable student selection entirely
  const selectionAllowed = await isStudentSelectionAllowed();
  if (!selectionAllowed) {
    throw new DomainError(403, 'SELECTION_DISABLED', 'Student subject selection is currently disabled by the administration.');
  }

  const etudiant = await resolveEtudiantByUserId(userId);

  // Verify subject exists
  const sujet = await prisma.pfeSujet.findUnique({
    where: { id },
    select: {
      id: true,
      titre_ar: true,
      titre_en: true,
      status: true,
      enseignantId: true,
      maxGrps: true,
      assignmentStatus: true,
      _count: { select: { groupsPfe: true } },
    },
  });

  if (!sujet) {
    throw new DomainError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
  }

  if (sujet.assignmentStatus === 'finalized') {
    throw new DomainError(423, 'SUBJECT_FINALIZED', 'This PFE assignment is locked and cannot be changed');
  }

  if (!['propose', 'valide'].includes(sujet.status)) {
    throw new DomainError(409, 'SUBJECT_NOT_AVAILABLE', `Subject status "${sujet.status}" does not allow new selections`);
  }

  // Find student's existing group membership
  const existingMembership = await prisma.groupMember.findFirst({
    where: { etudiantId: etudiant.id },
    orderBy: { group: { dateCreation: 'desc' } },
    select: { groupId: true, role: true },
  });

  let groupId;

  if (existingMembership) {
    groupId = existingMembership.groupId;

    // Check the group is not finalized
    const existingGroup = await prisma.groupPfe.findUnique({
      where: { id: groupId },
      select: { validationFinale: true, sujetFinalId: true },
    });

    if (existingGroup?.validationFinale) {
      throw new DomainError(423, 'GROUP_FINALIZED', 'Your PFE group is finalized and cannot be changed');
    }
  } else {
    // Check subject capacity
    if (sujet._count.groupsPfe >= sujet.maxGrps) {
      throw new DomainError(409, 'SUBJECT_FULL', 'This subject has reached its maximum number of groups');
    }

    // Auto-create a group for the student
    const group = await prisma.groupPfe.create({
      data: {
        nom_ar: 'Groupe PFE',
        nom_en: 'PFE Group',
        coEncadrantId: sujet.enseignantId,
        dateCreation: new Date(),
      },
    });
    groupId = group.id;

    await prisma.groupMember.create({
      data: { groupId, etudiantId: etudiant.id, role: 'chef_groupe' },
    });

    console.log(`[PFE] Created group groupId=${groupId} for etudiantId=${etudiant.id}`);
  }

  // Update group: set chosen subject as final subject
  await prisma.groupPfe.update({
    where: { id: groupId },
    data: {
      sujetFinalId: id,
      coEncadrantId: sujet.enseignantId,
    },
  });

  // Upsert voeu as accepted
  await prisma.groupSujet.upsert({
    where: { groupId_sujetId: { groupId, sujetId: id } },
    create: { groupId, sujetId: id, ordre: 1, status: 'accepte' },
    update: { status: 'accepte' },
  });

  console.log(`[PFE] etudiantId=${etudiant.id} selected sujetId=${id}, groupId=${groupId}`);

  // Return updated group details
  const updatedGroup = await prisma.groupPfe.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      sujetFinalId: true,
      sujetFinal: {
        select: {
          id: true, titre_ar: true, titre_en: true, status: true, typeProjet: true,
          enseignant: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
        },
      },
      coEncadrant: {
        select: { id: true, user: { select: { nom: true, prenom: true, email: true } } },
      },
      groupMembers: {
        select: {
          role: true,
          etudiant: { select: { id: true, matricule: true, user: { select: { nom: true, prenom: true } } } },
        },
      },
    },
  });

  return { group: updatedGroup, selectedSubjectId: id };
}

module.exports = { getMyGroup, getMyDeadlines, getMyGrade, getAvailableSubjects, selectSubject, DomainError };
