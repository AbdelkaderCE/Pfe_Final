/**
 * Groupe Service — Admin Group Management
 *
 * Exposes a transactional "manual group assembly" operation used by the admin UI:
 *   - Validates the request payload (names, coEncadrant, members list, single chef)
 *   - Verifies referenced entities (coEncadrant, etudiants) exist
 *   - Prevents assigning a student who already belongs to another group for the
 *     current academic year
 *   - Persists the new GroupPfe and its GroupMember rows in a single Prisma
 *     transaction so partial writes are impossible
 *
 * The existing createGroupWithMembers / assignSubjectToGroup helpers are kept
 * intact for backward compatibility with legacy callers.
 */

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const GROUP_NAME_MAX = 100;

/**
 * Domain-level error — carries the HTTP status and a stable error code so the
 * controller can translate it into a JSON response without inspecting strings.
 */
class DomainError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'DomainError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Computes the academic year for a given date in the form "YYYY-YYYY".
 * Academic year rolls over in September.
 */
function computeAcademicYear(reference = new Date()) {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth(); // 0 = January
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Validates the POST /manual request body.
 * Throws DomainError(400,...) on any invalid input.
 */
function validateManualGroupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new DomainError(400, 'INVALID_BODY', 'Request body is required');
  }

  const nom_ar = typeof payload.nom_ar === 'string' ? payload.nom_ar.trim() : '';
  if (!nom_ar) {
    throw new DomainError(400, 'INVALID_NAME_AR', 'nom_ar is required');
  }
  if (nom_ar.length > GROUP_NAME_MAX) {
    throw new DomainError(
      400,
      'INVALID_NAME_AR',
      `nom_ar must be at most ${GROUP_NAME_MAX} characters`,
    );
  }

  const nom_en_raw = typeof payload.nom_en === 'string' ? payload.nom_en.trim() : '';
  if (nom_en_raw && nom_en_raw.length > GROUP_NAME_MAX) {
    throw new DomainError(
      400,
      'INVALID_NAME_EN',
      `nom_en must be at most ${GROUP_NAME_MAX} characters`,
    );
  }
  const nom_en = nom_en_raw || null;

  const coEncadrantId = Number.parseInt(payload.coEncadrantId, 10);
  if (!Number.isInteger(coEncadrantId) || coEncadrantId <= 0) {
    throw new DomainError(
      400,
      'INVALID_COENCADRANT_ID',
      'coEncadrantId must be a positive integer',
    );
  }

  if (!Array.isArray(payload.members) || payload.members.length === 0) {
    throw new DomainError(
      400,
      'INVALID_MEMBERS',
      'members must be a non-empty array (min 1, max 3)',
    );
  }
  if (payload.members.length > 3) {
    throw new DomainError(400, 'INVALID_MEMBERS', 'A group cannot have more than 3 members');
  }

  const seen = new Set();
  let chefCount = 0;
  const members = payload.members.map((m, i) => {
    if (!m || typeof m !== 'object') {
      throw new DomainError(400, 'INVALID_MEMBER', `members[${i}] must be an object`);
    }
    const etudiantId = Number.parseInt(m.etudiantId, 10);
    if (!Number.isInteger(etudiantId) || etudiantId <= 0) {
      throw new DomainError(
        400,
        'INVALID_MEMBER',
        `members[${i}].etudiantId must be a positive integer`,
      );
    }
    if (seen.has(etudiantId)) {
      throw new DomainError(
        400,
        'DUPLICATE_MEMBER',
        `Duplicate etudiantId ${etudiantId} in members array`,
      );
    }
    seen.add(etudiantId);

    const role = typeof m.role === 'string' ? m.role.trim() : '';
    if (role !== 'membre' && role !== 'chef_groupe') {
      throw new DomainError(
        400,
        'INVALID_ROLE',
        `members[${i}].role must be "membre" or "chef_groupe"`,
      );
    }
    if (role === 'chef_groupe') chefCount += 1;

    return { etudiantId, role };
  });

  if (chefCount !== 1) {
    throw new DomainError(
      400,
      'INVALID_LEADER_COUNT',
      'Exactly one member must have role "chef_groupe"',
    );
  }

  return { nom_ar, nom_en, coEncadrantId, members };
}

/**
 * Creates a GroupPfe with its members in a single atomic transaction.
 *
 * Per the admin manual-assembly spec, sujetFinalId is NOT assigned by this
 * endpoint — the subject is attached later through the dedicated flow.
 *
 * @param {Object} rawPayload - Raw request body
 * @returns {Promise<Object>} Created group with members (and coEncadrant)
 */
async function createManualGroup(rawPayload) {
  const payload = validateManualGroupPayload(rawPayload);
  const etudiantIds = payload.members.map((m) => m.etudiantId);
  const anneeUniversitaire = computeAcademicYear();

  return prisma.$transaction(async (tx) => {
    // 1. coEncadrant must exist (lookup by id or userId)
    const coEncadrant = await tx.enseignant.findFirst({
      where: {
        OR: [
          { id: payload.coEncadrantId },
          { userId: payload.coEncadrantId }
        ]
      },
      select: { id: true },
    });
    if (!coEncadrant) {
      throw new DomainError(
        404,
        'COENCADRANT_NOT_FOUND',
        `coEncadrant ${payload.coEncadrantId} not found`,
      );
    }

    // 2. All students must exist (lookup by id or userId)
    const etudiants = await tx.etudiant.findMany({
      where: {
        OR: [
          { id: { in: etudiantIds } },
          { userId: { in: etudiantIds } }
        ]
      },
      select: { id: true, userId: true },
    });
    
    // Map the incoming IDs to the actual Etudiant IDs
    const resolvedEtudiantIds = payload.members.map(m => {
      const e = etudiants.find(e => e.id === m.etudiantId || e.userId === m.etudiantId);
      return e ? e.id : null;
    }).filter(id => id !== null);

    if (resolvedEtudiantIds.length !== etudiantIds.length) {
      const found = new Set(etudiants.map((e) => e.id).concat(etudiants.map(e => e.userId)));
      const missing = etudiantIds.filter((id) => !found.has(id));
      throw new DomainError(
        404,
        'STUDENT_NOT_FOUND',
        `Unknown etudiantId(s): ${missing.join(', ')}`,
      );
    }
    
    // Update the payload members with resolved Etudiant IDs
    const resolvedMembers = payload.members.map(m => {
      const e = etudiants.find(e => e.id === m.etudiantId || e.userId === m.etudiantId);
      return { ...m, etudiantId: e.id };
    });
    const finalEtudiantIds = resolvedMembers.map(m => m.etudiantId);

    // 3. No student may already belong to another group for this academic year
    const conflicts = await tx.groupMember.findMany({
      where: {
        etudiantId: { in: finalEtudiantIds },
        group: { sujetFinal: { anneeUniversitaire } },
      },
      select: { etudiantId: true, groupId: true },
    });
    if (conflicts.length > 0) {
      const ids = [...new Set(conflicts.map((c) => c.etudiantId))].join(', ');
      throw new DomainError(
        409,
        'STUDENT_ALREADY_IN_GROUP',
        `Student(s) ${ids} already belong to a group for academic year ${anneeUniversitaire}`,
      );
    }

    // 4. Persist the group (no sujet — to be assigned later)
    const now = new Date();
    const created = await tx.groupPfe.create({
      data: {
        nom_ar: payload.nom_ar,
        nom_en: payload.nom_en,
        coEncadrantId: coEncadrant.id,
        sujetFinalId: null,
        dateCreation: now,
      },
      select: { id: true },
    });

    // 5. Bulk-insert members in the same transaction
    await tx.groupMember.createMany({
      data: resolvedMembers.map((m) => ({
        groupId: created.id,
        etudiantId: m.etudiantId,
        role: m.role,
      })),
      skipDuplicates: true,
    });

    // 6. Return the full group with its members
    return tx.groupPfe.findUnique({
      where: { id: created.id },
      include: {
        coEncadrant: {
          include: { user: { select: { id: true, nom: true, prenom: true, email: true } } },
        },
        groupMembers: {
          include: {
            etudiant: {
              include: { user: { select: { id: true, nom: true, prenom: true, email: true } } },
            },
          },
        },
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy helpers kept for backward compatibility with older callers.
// ─────────────────────────────────────────────────────────────────────────────

function validateAdminGroupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body is required');
  }

  const nom_ar = typeof payload.nom_ar === 'string' ? payload.nom_ar.trim() : '';
  const nom_en = typeof payload.nom_en === 'string' ? payload.nom_en.trim() : null;

  if (!nom_ar) {
    throw new Error('nom_ar (group name in Arabic) is required');
  }

  const sujetFinalId = Number.parseInt(payload.sujetFinalId, 10);
  const coEncadrantId = Number.parseInt(payload.coEncadrantId, 10);

  if (!Number.isInteger(sujetFinalId) || sujetFinalId <= 0) {
    throw new Error('sujetFinalId must be a positive integer');
  }
  if (!Number.isInteger(coEncadrantId) || coEncadrantId <= 0) {
    throw new Error('coEncadrantId must be a positive integer');
  }

  if (!Array.isArray(payload.members) || payload.members.length === 0) {
    throw new Error('members must be a non-empty array with at least 1 student');
  }
  if (payload.members.length > 3) {
    throw new Error('A group cannot have more than 3 members');
  }

  const seen = new Set();
  const members = payload.members.map((m, i) => {
    const etudiantId = Number.parseInt(m && m.etudiantId, 10);
    if (!Number.isInteger(etudiantId) || etudiantId <= 0) {
      throw new Error(`members[${i}].etudiantId must be a positive integer`);
    }
    if (seen.has(etudiantId)) {
      throw new Error(`Duplicate etudiantId ${etudiantId} in members array`);
    }
    seen.add(etudiantId);

    const role = (m && m.role) || 'membre';
    if (role !== 'membre' && role !== 'chef_groupe') {
      throw new Error(`members[${i}].role must be "membre" or "chef_groupe"`);
    }

    return { etudiantId, role };
  });

  return { nom_ar, nom_en: nom_en || null, sujetFinalId, coEncadrantId, members };
}

async function createGroupWithMembers(payload) {
  const validated = validateAdminGroupPayload(payload);
  const etudiantIds = validated.members.map((m) => m.etudiantId);

  return prisma.$transaction(async (tx) => {
    const sujet = await tx.pfeSujet.findUnique({
      where: { id: validated.sujetFinalId },
      select: {
        id: true,
        status: true,
        promoId: true,
        maxGrps: true,
        anneeUniversitaire: true,
        groupsPfe: { select: { id: true } },
      },
    });

    if (!sujet) {
      throw new Error(`Subject with ID ${validated.sujetFinalId} not found`);
    }
    if (sujet.status !== 'valide') {
      throw new Error(`Subject must have status "valide" (current: ${sujet.status})`);
    }
    if (sujet.groupsPfe.length >= sujet.maxGrps) {
      throw new Error(`Subject has reached its maximum capacity of ${sujet.maxGrps} groups`);
    }

    const coEncadrant = await tx.enseignant.findUnique({
      where: { id: validated.coEncadrantId },
      select: { id: true },
    });
    if (!coEncadrant) {
      throw new Error(`Co-encadrant with ID ${validated.coEncadrantId} not found`);
    }

    const etudiants = await tx.etudiant.findMany({
      where: { id: { in: etudiantIds } },
      select: { id: true, promoId: true },
    });
    if (etudiants.length !== etudiantIds.length) {
      const found = new Set(etudiants.map((e) => e.id));
      const missing = etudiantIds.filter((id) => !found.has(id));
      throw new Error(`Students not found: ${missing.join(', ')}`);
    }

    const wrongPromo = etudiants.filter((e) => e.promoId !== sujet.promoId);
    if (wrongPromo.length > 0) {
      const ids = wrongPromo.map((e) => e.id).join(', ');
      throw new Error(
        `Students ${ids} do not belong to the subject's promotion (required: ${sujet.promoId})`,
      );
    }

    const conflicts = await tx.groupMember.findMany({
      where: {
        etudiantId: { in: etudiantIds },
        group: { sujetFinal: { anneeUniversitaire: sujet.anneeUniversitaire } },
      },
      select: { etudiantId: true },
    });
    if (conflicts.length > 0) {
      const ids = [...new Set(conflicts.map((c) => c.etudiantId))].join(', ');
      throw new Error(
        `Students ${ids} are already assigned to a group for academic year ${sujet.anneeUniversitaire}`,
      );
    }

    const now = new Date();
    const created = await tx.groupPfe.create({
      data: {
        nom_ar: validated.nom_ar,
        nom_en: validated.nom_en,
        sujetFinalId: sujet.id,
        coEncadrantId: coEncadrant.id,
        dateCreation: now,
        dateAffectation: now,
      },
      select: { id: true },
    });

    await tx.groupMember.createMany({
      data: validated.members.map((m) => ({
        groupId: created.id,
        etudiantId: m.etudiantId,
        role: m.role,
      })),
    });

    return tx.groupPfe.findUnique({
      where: { id: created.id },
      include: {
        sujetFinal: { select: { id: true, titre_ar: true, titre_en: true, status: true } },
        coEncadrant: { include: { user: { select: { prenom: true, nom: true } } } },
        groupMembers: {
          include: { etudiant: { include: { user: { select: { prenom: true, nom: true } } } } },
        },
      },
    });
  });
}

async function assignSubjectToGroup(groupId, sujetId) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.groupPfe.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        sujetFinalId: true,
        groupMembers: { select: { etudiantId: true } },
      },
    });
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }

    const sujet = await tx.pfeSujet.findUnique({
      where: { id: sujetId },
      select: {
        id: true,
        status: true,
        promoId: true,
        maxGrps: true,
        groupsPfe: { select: { id: true } },
      },
    });
    if (!sujet) {
      throw new Error(`Subject with ID ${sujetId} not found`);
    }
    if (sujet.status !== 'valide') {
      throw new Error(`Subject must have status "valide" (current: ${sujet.status})`);
    }

    const usedSlots = sujet.groupsPfe.filter((g) => g.id !== groupId).length;
    if (usedSlots >= sujet.maxGrps) {
      throw new Error(`Subject has reached its maximum capacity of ${sujet.maxGrps} groups`);
    }

    const groupStudents = await tx.etudiant.findMany({
      where: { id: { in: group.groupMembers.map((m) => m.etudiantId) } },
      select: { id: true, promoId: true },
    });
    const wrongPromo = groupStudents.filter((e) => e.promoId !== sujet.promoId);
    if (wrongPromo.length > 0) {
      throw new Error(
        `Group members do not belong to the subject's promotion (required: ${sujet.promoId})`,
      );
    }

    return tx.groupPfe.update({
      where: { id: groupId },
      data: { sujetFinalId: sujetId, dateAffectation: new Date() },
      include: {
        sujetFinal: { select: { id: true, titre_ar: true, titre_en: true } },
        coEncadrant: { include: { user: { select: { prenom: true, nom: true } } } },
        groupMembers: {
          include: { etudiant: { include: { user: { select: { prenom: true, nom: true } } } } },
        },
      },
    });
  });
}

module.exports = {
  // New admin manual assembly
  createManualGroup,
  validateManualGroupPayload,
  computeAcademicYear,
  DomainError,
  // Legacy
  createGroupWithMembers,
  assignSubjectToGroup,
  validateAdminGroupPayload,
  // Expose Prisma namespace for callers that need to inspect error codes
  Prisma,
};
