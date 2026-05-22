const { PrismaClient } = require('@prisma/client');
const { createManualGroup, DomainError } = require('./groupe.service');
const { assertGroupNotFinalized } = require('./pfe-lock.service');
const { emitGroupAffectationAlerts, emitSoutenanceScheduledAlerts } = require('./pfe-alerts.service');

const prisma = new PrismaClient();

/**
 * Maps service / Prisma errors to a consistent JSON error response.
 */
function sendError(res, err, context) {
  if (err && err.code === 'PFE_FINALIZED') {
    return res.status(423).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  if (err instanceof DomainError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  if (err && typeof err.code === 'string') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: { code: 'UNIQUE_VIOLATION', message: 'Unique constraint violation' },
      });
    }
    if (err.code === 'P2003') {
      return res.status(404).json({
        success: false,
        error: { code: 'REFERENCE_NOT_FOUND', message: 'Referenced entity not found' },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'RECORD_NOT_FOUND', message: 'Record not found' },
      });
    }
  }

  console.error(context || 'Groupe controller error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: (err && err.message) || 'Internal server error',
    },
  });
}

/**
 * Authorization helper: returns true iff the authenticated user carries the
 * "admin" role. The role is NEVER read from the request body — only from
 * req.user, which is populated by the auth middleware on protected routes.
 */
function isAdmin(user) {
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.includes('admin')) return true;
  if (typeof user.role === 'string' && user.role === 'admin') return true;
  if (user.coreRole === 'admin') return true;
  return false;
}

class GroupeController {
  /**
   * POST /api/v1/pfe/groupes/manual
   *
   * Admin-only: manually assemble a group with its members (and exactly one
    * chef_groupe). sujetFinalId is optional and assigns the subject if provided.
   */
  async createManual(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }
      if (!isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin role required' },
        });
      }

      const group = await createManualGroup(req.body);

      return res.status(201).json({
        success: true,
        data: {
          group: {
            id: group.id,
            nom_ar: group.nom_ar,
            nom_en: group.nom_en,
            sujetFinalId: group.sujetFinalId,
            coEncadrantId: group.coEncadrantId,
            dateCreation: group.dateCreation,
            dateAffectation: group.dateAffectation,
            coEncadrant: group.coEncadrant,
          },
          members: group.groupMembers,
        },
      });
    } catch (err) {
      return sendError(res, err, 'Erreur création manuelle du groupe:');
    }
  }

  // ───────────────────────────── Legacy endpoints ─────────────────────────────

  async create(req, res) {
    try {
      const data = req.body || {};
      const groupe = await prisma.groupPfe.create({
        data: {
          nom_ar: data.nom_ar,
          nom_en: data.nom_en || null,
          sujetFinalId:
            data.sujetFinalId !== undefined && data.sujetFinalId !== null
              ? parseInt(data.sujetFinalId, 10)
              : undefined,
          coEncadrantId:
            data.coEncadrantId !== undefined && data.coEncadrantId !== null
              ? parseInt(data.coEncadrantId, 10)
              : undefined,
          dateCreation: data.dateCreation ? new Date(data.dateCreation) : null,
          dateAffectation: data.dateAffectation ? new Date(data.dateAffectation) : null,
          dateSoutenance: data.dateSoutenance ? new Date(data.dateSoutenance) : null,
          salleSoutenance: data.salleSoutenance || null,
          note: data.note !== undefined && data.note !== null ? parseFloat(data.note) : null,
          mention: data.mention || null,
        },
        include: {
          sujetFinal: true,
          coEncadrant: { include: { user: true } },
          groupMembers: { include: { etudiant: { include: { user: true } } } },
        },
      });

      // If the legacy create call also scheduled the soutenance up-front,
      // fire the soutenance alert too. emitSoutenanceScheduledAlerts no-ops
      // when dateSoutenance is null.
      if (groupe?.id) {
        await emitGroupAffectationAlerts(groupe.id);
        if (groupe.dateSoutenance) {
          await emitSoutenanceScheduledAlerts(groupe.id);
        }
      }

      return res.status(201).json({ success: true, data: groupe });
    } catch (err) {
      return sendError(res, err, 'Erreur création groupe:');
    }
  }

  /**
   * Admin endpoint: schedule (or reschedule) a group's soutenance.
   * Updates dateSoutenance + salleSoutenance and fires the soutenance alert
   * to every group student and every jury member.
   */
  async scheduleSoutenance(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Group id must be a positive integer' },
        });
      }

      await assertGroupNotFinalized(id);

      const data = req.body || {};
      const updated = await prisma.groupPfe.update({
        where: { id },
        data: {
          dateSoutenance: data.dateSoutenance ? new Date(data.dateSoutenance) : null,
          salleSoutenance:
            typeof data.salleSoutenance === 'string' ? data.salleSoutenance.trim() || null : null,
        },
        include: {
          sujetFinal: {
            include: {
              enseignant: { include: { user: true } },
              promo: true,
            },
          },
          coEncadrant: { include: { user: true } },
          pfeJury: { include: { enseignant: { include: { user: true } } } },
          groupMembers: { include: { etudiant: { include: { user: true } } } },
        },
      });

      if (updated.dateSoutenance) {
        await emitSoutenanceScheduledAlerts(updated.id);
      }

      return res.json({ success: true, data: updated });
    } catch (err) {
      return sendError(res, err, 'Erreur planification soutenance:');
    }
  }

  async getAll(req, res) {
    try {
      const include = {
        sujetFinal: {
          include: {
            enseignant: { include: { user: true } },
            promo: true,
          },
        },
        coEncadrant: { include: { user: true } },
        groupMembers: { include: { etudiant: { include: { user: true } } } },
        pfeJury: { include: { enseignant: { include: { user: true } } } },
      };

      // ── RBAC scoping ────────────────────────────────────────────────
      // Admins see everything. Anyone else (teacher / student) must be
      // restricted to groups they have a legitimate reason to view. Without
      // this, the endpoint leaked every university group to every teacher.
      if (!isAdmin(req.user)) {
        const userId = Number(req.user?.id);
        const [enseignant, etudiant] = userId ? await Promise.all([
          prisma.enseignant.findUnique({ where: { userId }, select: { id: true } }),
          prisma.etudiant.findUnique({ where: { userId }, select: { id: true } })
        ]) : [null, null];

        if (etudiant) {
          const studentId = etudiant.id;
          const groupes = await prisma.groupPfe.findMany({
            where: { groupMembers: { some: { etudiantId: studentId } } },
            include,
          });
          return res.json({ success: true, data: groupes });
        }

        if (!enseignant) {
          // Non-admin, non-teacher, non-student → no groups exposed via this endpoint.
          return res.json({ success: true, data: [] });
        }

        const teacherId = enseignant.id;
        const groupes = await prisma.groupPfe.findMany({
          where: {
            OR: [
              // 1. Groups whose final subject was proposed by this teacher.
              { sujetFinal: { enseignantId: teacherId } },
              // 2. Groups where this teacher is the co-supervisor.
              { coEncadrantId: teacherId },
              // 3. Groups where this teacher sits on the jury (any role).
              { pfeJury: { some: { enseignantId: teacherId } } },
            ],
          },
          include,
        });
        return res.json({ success: true, data: groupes });
      }

      // Admin path — unfiltered.
      const groupes = await prisma.groupPfe.findMany({ include });
      return res.json({ success: true, data: groupes });
    } catch (err) {
      return sendError(res, err, 'Erreur récupération groupes:');
    }
  }

  async getById(req, res) {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Group id must be a positive integer' },
        });
      }

      const groupe = await prisma.groupPfe.findUnique({
        where: { id },
        include: {
          sujetFinal: {
            include: {
              enseignant: { include: { user: true } },
              promo: true,
            },
          },
          coEncadrant: { include: { user: true } },
          groupMembers: { include: { etudiant: { include: { user: true } } } },
          groupSujets: { include: { sujet: true } },
          pfeJury: { include: { enseignant: { include: { user: true } } } },
        },
      });

      if (!groupe) {
        return res.status(404).json({
          success: false,
          error: { code: 'GROUP_NOT_FOUND', message: 'Groupe non trouvé' },
        });
      }
      return res.json({ success: true, data: groupe });
    } catch (err) {
      return sendError(res, err, 'Erreur récupération groupe:');
    }
  }

  async addMember(req, res) {
    try {
      const groupId = Number.parseInt(req.params.groupId, 10);
      const etudiantId = Number.parseInt((req.body || {}).etudiantId, 10);
      const role = (req.body || {}).role === 'chef_groupe' ? 'chef_groupe' : 'membre';

      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_GROUP_ID', message: 'groupId must be a positive integer' },
        });
      }
      if (!Number.isInteger(etudiantId) || etudiantId <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ETUDIANT_ID', message: 'etudiantId must be a positive integer' },
        });
      }

      // Lock guard — no member changes allowed on a finalized group.
      await assertGroupNotFinalized(groupId);

      const result = await prisma.$transaction(async (tx) => {
        const count = await tx.groupMember.count({ where: { groupId } });
        if (count >= 3) {
          throw new DomainError(
            400,
            'GROUP_FULL',
            'Un groupe ne peut pas avoir plus de 3 membres',
          );
        }

        const alreadyIn = await tx.groupMember.findFirst({
          where: { etudiantId },
          select: { id: true },
        });
        if (alreadyIn) {
          throw new DomainError(
            409,
            'STUDENT_ALREADY_IN_GROUP',
            'Cet étudiant est déjà dans un groupe',
          );
        }

        return tx.groupMember.create({
          data: { groupId, etudiantId, role },
          include: {
            etudiant: { include: { user: true } },
            group: true,
          },
        });
      });

      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return sendError(res, err, 'Erreur ajout membre:');
    }
  }

  async delete(req, res) {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Group id must be a positive integer' },
        });
      }

      // Lock guard — finalized groups cannot be dismantled.
      await assertGroupNotFinalized(id);

      await prisma.groupPfe.delete({ where: { id } });
      return res.json({ success: true, message: 'Groupe supprimé avec succès' });
    } catch (err) {
      return sendError(res, err, 'Erreur suppression groupe:');
    }
  }

  async affecterSujet(req, res) {
    try {
      const groupId = Number.parseInt(req.params.groupId, 10);
      const etudiantId = Number.parseInt((req.body || {}).etudiantId, 10);

      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_GROUP_ID', message: 'groupId must be a positive integer' },
        });
      }
      if (!Number.isInteger(etudiantId) || etudiantId <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ETUDIANT_ID', message: 'etudiantId must be a positive integer' },
        });
      }

      // Lock guard — a finalized group's subject choice is immutable.
      await assertGroupNotFinalized(groupId);

      const result = await prisma.$transaction(async (tx) => {
        const member = await tx.groupMember.findFirst({
          where: { groupId, etudiantId, role: 'chef_groupe' },
          select: { id: true },
        });
        if (!member) {
          throw new DomainError(
            403,
            'NOT_GROUP_LEADER',
            'Seul le chef du groupe peut affecter un sujet',
          );
        }

        const voeux = await tx.groupSujet.findMany({
          where: { groupId },
          orderBy: { ordre: 'asc' },
          include: { sujet: { include: { groupsPfe: { select: { id: true } } } } },
        });
        if (voeux.length === 0) {
          throw new DomainError(400, 'NO_WISHES', "Le groupe n'a pas de vœux");
        }

        for (const voeu of voeux) {
          const { sujet } = voeu;
          if (!sujet) continue;
          if (sujet.groupsPfe.length < sujet.maxGrps) {
            const groupe = await tx.groupPfe.update({
              where: { id: groupId },
              data: { sujetFinalId: sujet.id, dateAffectation: new Date() },
            });
            await tx.groupSujet.update({
              where: { id: voeu.id },
              data: { status: 'accepte' },
            });
            await tx.groupSujet.updateMany({
              where: { groupId, id: { not: voeu.id } },
              data: { status: 'refuse' },
            });
            return { groupe, sujet };
          }
        }

        throw new DomainError(404, 'NO_SUBJECT_AVAILABLE', 'Aucun sujet disponible pour ce groupe');
      });

      return res.json({
        success: true,
        message: 'Sujet affecté avec succès',
        data: result,
      });
    } catch (err) {
      return sendError(res, err, 'Erreur affectation:');
    }
  }

  /**
   * PATCH /api/v1/pfe/groupes/:id
   *
   * Admin-only: edit basic group info (name, co-supervisor, assigned subject).
   * Admins can edit any group at any time, regardless of status.
   */
  async update(req, res) {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only admins can edit groups.' },
        });
      }

      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid group id.' },
        });
      }

      const { nom_ar, nom_en, coEncadrantId, sujetFinalId } = req.body || {};

      const data = {};
      if (typeof nom_ar === 'string') data.nom_ar = nom_ar.trim();
      if (typeof nom_en === 'string') data.nom_en = nom_en.trim();
      if (coEncadrantId === null || Number.isInteger(Number(coEncadrantId))) {
        data.coEncadrantId = coEncadrantId === null ? null : Number(coEncadrantId);
      }
      if (sujetFinalId === null || Number.isInteger(Number(sujetFinalId))) {
        data.sujetFinalId = sujetFinalId === null ? null : Number(sujetFinalId);
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FIELDS', message: 'No editable fields provided.' },
        });
      }

      const updated = await prisma.groupPfe.update({
        where: { id },
        data,
        include: {
          sujetFinal: { include: { enseignant: { include: { user: true } } } },
          groupMembers: { include: { etudiant: { include: { user: true } } } },
          coEncadrant: { include: { user: true } },
        },
      });

      return res.json({ success: true, data: updated });
    } catch (err) {
      return sendError(res, err, 'Erreur mise à jour groupe:');
    }
  }

  /**
   * Direct assignment for group leaders and admins.
   * Enforces promo matching, availability checks, and status updates.
   */
  async assignSujetDirect(req, res) {
    try {
      const groupId = Number.parseInt(req.params.groupId, 10);
      const { sujetId } = req.body || {};

      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_GROUP_ID', message: 'groupId must be a positive integer' } });
      }
      if (!Number.isInteger(Number(sujetId)) || Number(sujetId) <= 0) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_SUJET_ID', message: 'sujetId must be a positive integer' } });
      }

      await assertGroupNotFinalized(groupId);

      const result = await prisma.$transaction(async (tx) => {
        const isAdminUser = isAdmin(req.user);

        const group = await tx.groupPfe.findUnique({
          where: { id: groupId },
          include: { groupMembers: { include: { etudiant: true } }, sujetFinal: true }
        });

        if (!group) throw new DomainError(404, 'GROUP_NOT_FOUND', 'Group not found');

        // Student Access Control
        if (!isAdminUser) {
          const studentUserId = Number(req.user.id);
          const student = await tx.etudiant.findUnique({ where: { userId: studentUserId } });
          if (!student) throw new DomainError(403, 'FORBIDDEN', 'Only students or admins can perform this action.');

          const isLeader = group.groupMembers.some(m => m.etudiantId === student.id && m.role === 'chef_groupe');
          if (!isLeader) throw new DomainError(403, 'NOT_GROUP_LEADER', 'Only the group leader can select a subject.');
        }

        const sujet = await tx.pfeSujet.findUnique({
          where: { id: Number(sujetId) },
          include: { groupsPfe: { select: { id: true } } }
        });

        if (!sujet) throw new DomainError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');

        // Promo Matching Validation
        const memberPromos = new Set(group.groupMembers.map(m => m.etudiant?.promoId).filter(Boolean));
        if (memberPromos.size > 0 && !memberPromos.has(sujet.promoId)) {
          throw new DomainError(400, 'PROMO_MISMATCH', 'Subject does not belong to your promo.');
        }

        // Availability Validation
        if (['affecte', 'termine', 'refuse'].includes(sujet.status) && sujet.groupsPfe.length >= sujet.maxGrps) {
          throw new DomainError(400, 'SUBJECT_FULL', 'This subject is no longer available.');
        }
        if (sujet.groupsPfe.length >= sujet.maxGrps) {
          throw new DomainError(400, 'SUBJECT_FULL', 'This subject has reached its maximum capacity.');
        }
        
        // Ensure no duplicate assignments
        if (group.sujetFinalId === sujet.id) {
           throw new DomainError(400, 'ALREADY_ASSIGNED', 'Your group is already assigned to this subject.');
        }

        // If replacing an old subject, adjust its status
        if (group.sujetFinalId) {
          const oldSujet = await tx.pfeSujet.findUnique({
            where: { id: group.sujetFinalId },
            include: { groupsPfe: { select: { id: true } } }
          });
          if (oldSujet && oldSujet.status === 'affecte' && oldSujet.groupsPfe.length <= oldSujet.maxGrps) {
            await tx.pfeSujet.update({
              where: { id: group.sujetFinalId },
              data: { status: 'valide' }
            });
          }
        }

        // Assign the new subject
        const updatedGroup = await tx.groupPfe.update({
          where: { id: groupId },
          data: { sujetFinalId: sujet.id, dateAffectation: new Date() }
        });

        // Update new subject status if max capacity reached
        if (sujet.groupsPfe.length + 1 >= sujet.maxGrps) {
          await tx.pfeSujet.update({
            where: { id: sujet.id },
            data: { status: 'affecte' }
          });
        }

        return updatedGroup;
      });

      return res.json({ success: true, message: 'Subject assigned successfully', data: result });
    } catch (err) {
      return sendError(res, err, 'Error assigning subject:');
    }
  }

  /**
   * Admin-only: unassign subject from group.
   */
  async unassignSujet(req, res) {
    try {
      if (!isAdmin(req.user)) {
         return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only admins can unassign subjects.' } });
      }
      const groupId = Number.parseInt(req.params.groupId, 10);
      if (!Number.isInteger(groupId) || groupId <= 0) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_GROUP_ID', message: 'groupId must be a positive integer' } });
      }

      await assertGroupNotFinalized(groupId);

      const result = await prisma.$transaction(async (tx) => {
        const group = await tx.groupPfe.findUnique({ where: { id: groupId } });
        if (!group) throw new DomainError(404, 'GROUP_NOT_FOUND', 'Group not found');
        if (!group.sujetFinalId) return group;

        const oldSujetId = group.sujetFinalId;

        const updatedGroup = await tx.groupPfe.update({
          where: { id: groupId },
          data: { sujetFinalId: null, dateAffectation: null }
        });

        // Revert subject status to valide if it was affecte and now has capacity
        const oldSujet = await tx.pfeSujet.findUnique({
          where: { id: oldSujetId },
          include: { groupsPfe: { select: { id: true } } }
        });
        
        if (oldSujet && oldSujet.status === 'affecte' && oldSujet.groupsPfe.length < oldSujet.maxGrps) {
           await tx.pfeSujet.update({
             where: { id: oldSujetId },
             data: { status: 'valide' }
           });
        }
        return updatedGroup;
      });

      return res.json({ success: true, message: 'Subject unassigned successfully', data: result });
    } catch (err) {
      return sendError(res, err, 'Error unassigning subject:');
    }
  }
}

module.exports = { GroupeController };
