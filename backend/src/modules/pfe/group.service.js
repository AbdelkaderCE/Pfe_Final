const { PrismaClient } = require('@prisma/client');
const { emitGroupAffectationAlerts } = require('./pfe-alerts.service');

const prisma = new PrismaClient();

class DomainError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const GROUP_INCLUDE = {
  sujetFinal: true,
  coEncadrant: { include: { user: true } },
  groupMembers: {
    include: { etudiant: { include: { user: true } } },
  },
};

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new DomainError(400, 'INVALID_BODY', 'Request body is required');
  }

  // Group name is now optional. If omitted, the create transaction will
  // auto-generate "Group N" using a sequential counter (see createGroup).
  const nom_ar = typeof payload.nom_ar === 'string' ? payload.nom_ar.trim() : '';

  const sujetFinalId = Number.parseInt(payload.sujetFinalId, 10);
  const coEncadrantId = Number.parseInt(payload.coEncadrantId, 10);
  if (!Number.isInteger(sujetFinalId) || sujetFinalId <= 0) {
    throw new DomainError(400, 'INVALID_SUBJECT_ID', 'sujetFinalId must be a positive integer');
  }
  if (!Number.isInteger(coEncadrantId) || coEncadrantId <= 0) {
    throw new DomainError(400, 'INVALID_COENCADRANT_ID', 'coEncadrantId must be a positive integer');
  }

  if (!Array.isArray(payload.members) || payload.members.length === 0) {
    throw new DomainError(400, 'INVALID_MEMBERS', 'members must be a non-empty array');
  }

  const seen = new Set();
  let chefCount = 0;
  const members = payload.members.map((m, i) => {
    const etudiantId = Number.parseInt(m && m.etudiantId, 10);
    if (!Number.isInteger(etudiantId) || etudiantId <= 0) {
      throw new DomainError(400, 'INVALID_MEMBER', `members[${i}].etudiantId must be a positive integer`);
    }
    if (seen.has(etudiantId)) {
      throw new DomainError(400, 'DUPLICATE_MEMBER', `Duplicate etudiantId ${etudiantId} in members`);
    }
    seen.add(etudiantId);

    const role = m.role || 'membre';
    if (role !== 'membre' && role !== 'chef_groupe') {
      throw new DomainError(400, 'INVALID_ROLE', `members[${i}].role must be "membre" or "chef_groupe"`);
    }
    if (role === 'chef_groupe') chefCount += 1;

    return { etudiantId, role };
  });

  if (chefCount !== 1) {
    throw new DomainError(400, 'INVALID_LEADER_COUNT', 'Exactly one member must have role "chef_groupe"');
  }

  return {
    nom_ar,
    nom_en: typeof payload.nom_en === 'string' && payload.nom_en.trim() ? payload.nom_en.trim() : null,
    sujetFinalId,
    coEncadrantId,
    members,
  };
}

async function createGroup(rawPayload) {
  const payload = validatePayload(rawPayload);
  const etudiantIds = payload.members.map((m) => m.etudiantId);

  return prisma.$transaction(async (tx) => {
    const sujet = await tx.pfeSujet.findUnique({
      where: { id: payload.sujetFinalId },
      select: {
        id: true,
        status: true,
        promoId: true,
        maxGrps: true,
        anneeUniversitaire: true,
      },
    });
    if (!sujet) {
      throw new DomainError(404, 'SUBJECT_NOT_FOUND', `Subject ${payload.sujetFinalId} not found`);
    }
    if (sujet.status !== 'valide') {
      throw new DomainError(409, 'SUBJECT_NOT_VALIDATED', 'sujetFinal.status must be "valide"');
    }

    const coEncadrant = await tx.enseignant.findUnique({
      where: { id: payload.coEncadrantId },
      select: { id: true },
    });
    if (!coEncadrant) {
      throw new DomainError(404, 'COENCADRANT_NOT_FOUND', `coEncadrant ${payload.coEncadrantId} not found`);
    }

    const etudiants = await tx.etudiant.findMany({
      where: { id: { in: etudiantIds } },
      select: { id: true, promoId: true },
    });
    if (etudiants.length !== etudiantIds.length) {
      const found = new Set(etudiants.map((e) => e.id));
      const missing = etudiantIds.filter((id) => !found.has(id));
      throw new DomainError(404, 'STUDENT_NOT_FOUND', `Unknown etudiantId(s): ${missing.join(', ')}`);
    }

    const wrongPromo = etudiants.filter((e) => e.promoId !== sujet.promoId).map((e) => e.id);
    if (wrongPromo.length > 0) {
      throw new DomainError(
        409,
        'PROMO_MISMATCH',
        `etudiant(s) ${wrongPromo.join(', ')} do not belong to the subject's promo (${sujet.promoId})`,
      );
    }

    const conflicts = await tx.groupMember.findMany({
      where: {
        etudiantId: { in: etudiantIds },
        group: { sujetFinal: { anneeUniversitaire: sujet.anneeUniversitaire } },
      },
      select: { etudiantId: true, groupId: true },
    });
    if (conflicts.length > 0) {
      const ids = [...new Set(conflicts.map((c) => c.etudiantId))].join(', ');
      throw new DomainError(
        409,
        'STUDENT_ALREADY_IN_GROUP',
        `etudiant(s) ${ids} already belong to a group for ${sujet.anneeUniversitaire}`,
      );
    }

    const usedSlots = await tx.groupPfe.count({
      where: { sujetFinalId: sujet.id },
    });
    if (usedSlots >= sujet.maxGrps) {
      throw new DomainError(
        409,
        'SUBJECT_FULL',
        `Subject ${sujet.id} has reached its maxGrps (${sujet.maxGrps})`,
      );
    }

    const now = new Date();
    // Auto-name fallback: "Group N" where N is one past the global count.
    // Done inside the transaction so two concurrent creates can't pick the
    // same N — Prisma serializes the count + create within the txn.
    let resolvedNomAr = payload.nom_ar;
    if (!resolvedNomAr) {
      const total = await tx.groupPfe.count();
      resolvedNomAr = `Group ${total + 1}`;
    }

    const created = await tx.groupPfe.create({
      data: {
        nom_ar: resolvedNomAr,
        nom_en: payload.nom_en || resolvedNomAr,
        sujetFinalId: sujet.id,
        coEncadrantId: coEncadrant.id,
        dateCreation: now,
        dateAffectation: now,
      },
      select: { id: true },
    });

    await tx.groupMember.createMany({
      data: payload.members.map((m) => ({
        groupId: created.id,
        etudiantId: m.etudiantId,
        role: m.role,
      })),
    });

    return tx.groupPfe.findUnique({
      where: { id: created.id },
      include: GROUP_INCLUDE,
    });
  }).then(async (group) => {
    // Fire affectation alerts AFTER the transaction commits so a failed
    // alert can never roll back the group creation. Errors are swallowed
    // by emitGroupAffectationAlerts (logged-only).
    if (group?.id) {
      await emitGroupAffectationAlerts(group.id);
    }
    return group;
  });
}

function validateChoosePayload(groupIdParam, body) {
  const groupId = Number.parseInt(groupIdParam, 10);
  if (!Number.isInteger(groupId) || groupId <= 0) {
    throw new DomainError(400, 'INVALID_GROUP_ID', 'groupId must be a positive integer');
  }
  if (!body || typeof body !== 'object') {
    throw new DomainError(400, 'INVALID_BODY', 'Request body is required');
  }

  const etudiantId = Number.parseInt(body.etudiantId, 10);
  const sujetId = Number.parseInt(body.sujetId, 10);
  if (!Number.isInteger(etudiantId) || etudiantId <= 0) {
    throw new DomainError(400, 'INVALID_ETUDIANT_ID', 'etudiantId must be a positive integer');
  }
  if (!Number.isInteger(sujetId) || sujetId <= 0) {
    throw new DomainError(400, 'INVALID_SUBJECT_ID', 'sujetId must be a positive integer');
  }

  let ordre = 1;
  if (body.ordre !== undefined && body.ordre !== null) {
    ordre = Number.parseInt(body.ordre, 10);
    if (!Number.isInteger(ordre) || ordre <= 0) {
      throw new DomainError(400, 'INVALID_ORDRE', 'ordre must be a positive integer');
    }
  }

  return { groupId, etudiantId, sujetId, ordre };
}

async function chooseSubject(groupIdParam, body) {
  const { groupId, etudiantId, sujetId, ordre } = validateChoosePayload(groupIdParam, body);

  return prisma.$transaction(async (tx) => {
    const group = await tx.groupPfe.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        validationFinale: true,
        sujetFinal: { select: { promoId: true, anneeUniversitaire: true } },
      },
    });
    if (!group) {
      throw new DomainError(404, 'GROUP_NOT_FOUND', `Group ${groupId} not found`);
    }
    if (group.validationFinale === true) {
      throw new DomainError(409, 'GROUP_ALREADY_VALIDATED', 'Group is already finally validated');
    }

    const member = await tx.groupMember.findUnique({
      where: { groupId_etudiantId: { groupId, etudiantId } },
      select: { role: true },
    });
    if (!member) {
      throw new DomainError(403, 'NOT_A_MEMBER', 'Requester is not a member of this group');
    }
    if (member.role !== 'chef_groupe') {
      throw new DomainError(403, 'NOT_GROUP_LEADER', 'Only the chef_groupe can choose a subject');
    }

    const sujet = await tx.pfeSujet.findUnique({
      where: { id: sujetId },
      select: { id: true, status: true, promoId: true, maxGrps: true },
    });
    if (!sujet) {
      throw new DomainError(404, 'SUBJECT_NOT_FOUND', `Subject ${sujetId} not found`);
    }
    if (sujet.status !== 'valide') {
      throw new DomainError(409, 'SUBJECT_NOT_VALIDATED', 'Subject must have status "valide"');
    }
    if (sujet.promoId !== group.sujetFinal.promoId) {
      throw new DomainError(
        409,
        'PROMO_MISMATCH',
        `Subject promo (${sujet.promoId}) does not match group promo (${group.sujetFinal.promoId})`,
      );
    }

    const usedSlots = await tx.groupPfe.count({
      where: { sujetFinalId: sujet.id },
    });
    if (usedSlots >= sujet.maxGrps) {
      throw new DomainError(
        409,
        'SUBJECT_FULL',
        `Subject ${sujet.id} has reached its maxGrps (${sujet.maxGrps})`,
      );
    }

    return tx.groupSujet.upsert({
      where: { groupId_sujetId: { groupId, sujetId } },
      update: { status: 'en_attente', ordre },
      create: { groupId, sujetId, ordre, status: 'en_attente' },
      include: { sujet: true, group: { select: { id: true, nom_ar: true } } },
    });
  });
}

module.exports = { createGroup, chooseSubject, DomainError };
