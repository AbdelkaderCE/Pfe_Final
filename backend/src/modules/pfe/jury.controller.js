const { PrismaClient } = require('@prisma/client');
const { emitJuryAssignmentAlert } = require('./pfe-alerts.service');

const prisma = new PrismaClient();

// ── Default capacity config ─────────────────────────────────
const DEFAULT_MAX_EXAMINERS = 2;

function isAdminUser(user) {
  if (!user) return false;
  if (String(user.coreRole || '').toLowerCase() === 'admin') return true;
  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => {
      const name = typeof r === 'string' ? r : (r?.nom || r?.name || '');
      return String(name).toLowerCase() === 'admin';
    });
  }
  return String(user.role || '').toLowerCase() === 'admin';
}

/**
 * Compute jury status for a group:
 *   - pending:   no jury members at all
 *   - partial:   some members but not full (missing president or examiners)
 *   - full:      president + all examiner slots filled
 *   - scheduled: full jury AND defense date set
 *   - completed: group has validationFinale or a note
 */
function computeJuryStatus(group, juryEntries) {
  const entries = Array.isArray(juryEntries) ? juryEntries : [];
  if (group?.validationFinale || group?.note != null) return 'completed';
  const hasPresident = entries.some(j => j.role === 'president');
  const examinerCount = entries.filter(j => j.role === 'examinateur').length;
  const maxExaminers = DEFAULT_MAX_EXAMINERS;

  if (entries.length === 0) return 'pending';
  if (hasPresident && examinerCount >= maxExaminers) {
    return group?.dateSoutenance ? 'scheduled' : 'full';
  }
  return 'partial';
}

/**
 * Build availability slots for a group.
 */
function getAvailableSlots(juryEntries) {
  const entries = Array.isArray(juryEntries) ? juryEntries : [];
  const hasPresident = entries.some(j => j.role === 'president');
  const examinerCount = entries.filter(j => j.role === 'examinateur').length;
  const maxExaminers = DEFAULT_MAX_EXAMINERS;

  return {
    presidentAvailable: !hasPresident,
    examinersRemaining: Math.max(0, maxExaminers - examinerCount),
    maxExaminers,
    totalMembers: entries.length,
    isFull: hasPresident && examinerCount >= maxExaminers,
  };
}

class JuryController {
  // ── Add jury member (admin or teacher self-selection) ──────
  async addMembre(req, res) {
    try {
      const groupId = req.params.groupId || req.body.groupId;
      const { enseignantId, role } = req.body;

      if (!groupId || !enseignantId || !role) {
        return res.status(400).json({
          success: false,
          error: "groupId, enseignantId et role sont requis",
        });
      }

      const normalizedRole = String(role).toLowerCase();
      if (!['president', 'examinateur', 'rapporteur'].includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ROLE', message: "role must be one of: president | examinateur | rapporteur" },
        });
      }

      const groupIdNum = parseInt(groupId);
      const enseignantIdNum = parseInt(enseignantId);

      // ── Load group with its subject to check supervisor ─────
      const group = await prisma.groupPfe.findUnique({
        where: { id: groupIdNum },
        include: {
          sujetFinal: { select: { enseignantId: true } },
          pfeJury: true,
        },
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' },
        });
      }

      // ── Prevent supervisor from being president of own group ──
      if (normalizedRole === 'president') {
        const supervisorId = group.sujetFinal?.enseignantId;
        if (supervisorId && supervisorId === enseignantIdNum) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'SUPERVISOR_CANNOT_BE_PRESIDENT',
              message: 'The supervisor of this group cannot serve as jury president.',
            },
          });
        }
      }

      // ── Capacity check ────────────────────────────────────────
      const existingJury = group.pfeJury || [];
      const slots = getAvailableSlots(existingJury);

      if (normalizedRole === 'president' && !slots.presidentAvailable) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'PRESIDENT_ALREADY_EXISTS',
            message: 'This group already has a jury president.',
          },
        });
      }

      if (normalizedRole === 'examinateur' && slots.examinersRemaining <= 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EXAMINER_SLOTS_FULL',
            message: `All ${slots.maxExaminers} examiner slots are filled for this group.`,
          },
        });
      }

      // ── Duplicate check ───────────────────────────────────────
      const juryExistant = existingJury.find(j => j.enseignantId === enseignantIdNum);
      if (juryExistant) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_JURY_MEMBER',
            message: "This teacher is already a jury member for this group.",
          },
        });
      }

      const jury = await prisma.pfeJury.create({
        data: {
          groupId: groupIdNum,
          enseignantId: enseignantIdNum,
          role: normalizedRole,
        },
        include: {
          group: true,
          enseignant: {
            include: { user: true },
          },
        },
      });

      // Notify the freshly-added teacher. Errors swallowed inside the helper.
      await emitJuryAssignmentAlert(jury.id);

      res.status(201).json({ success: true, data: jury });
    } catch (error) {
      console.error("Erreur ajout jury:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ── Get all jury entries (RBAC-scoped) ─────────────────────
  async getAll(req, res) {
    try {
      const include = {
        group: {
          include: {
            sujetFinal: {
              include: {
                enseignant: { include: { user: true } },
                promo: { include: { specialite: true } },
              },
            },
            groupMembers: { include: { etudiant: { include: { user: true } } } },
            coEncadrant: { include: { user: true } },
          },
        },
        enseignant: { include: { user: true } },
      };

      // RBAC scoping: admins see all jury rows; teachers see only their own.
      if (!isAdminUser(req.user)) {
        const userId = Number(req.user?.id);
        const enseignant = userId
          ? await prisma.enseignant.findUnique({
              where: { userId },
              select: { id: true },
            })
          : null;
        if (!enseignant) {
          return res.json({ success: true, data: [] });
        }
        const jury = await prisma.pfeJury.findMany({
          where: { enseignantId: enseignant.id },
          include,
        });
        return res.json({ success: true, data: jury });
      }

      const jury = await prisma.pfeJury.findMany({ include });
      return res.json({ success: true, data: jury });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: { code: 'JURY_FETCH_FAILED', message: error.message } });
    }
  }

  /**
   * GET /api/v1/pfe/jury/me
   *
   * Returns the jury assignments of the authenticated teacher. Used by the
   * teacher Defense Plan page. Admins get an empty array unless they happen
   * to also be a teacher.
   */
  async getMine(req, res) {
    try {
      const userId = Number(req.user?.id);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' },
        });
      }
      const enseignant = await prisma.enseignant.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!enseignant) {
        return res.json({ success: true, data: [] });
      }
      const jury = await prisma.pfeJury.findMany({
        where: { enseignantId: enseignant.id },
        include: {
          group: {
            include: {
              sujetFinal: {
                include: {
                  enseignant: { include: { user: true } },
                  promo: { include: { specialite: true } },
                },
              },
              groupMembers: { include: { etudiant: { include: { user: true } } } },
              coEncadrant: { include: { user: true } },
            },
          },
          enseignant: { include: { user: true } },
        },
        orderBy: [
          { group: { dateSoutenance: 'asc' } },
          { id: 'asc' },
        ],
      });
      return res.json({ success: true, data: jury });
    } catch (error) {
      console.error('getMine jury error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'JURY_ME_FAILED', message: error.message },
      });
    }
  }

  // ── Get jury by group ──────────────────────────────────────
  async getByGroup(req, res) {
    try {
      const { groupId } = req.params;
      const jury = await prisma.pfeJury.findMany({
        where: { groupId: parseInt(groupId) },
        include: {
          enseignant: {
            include: { user: true },
          },
        },
      });

      res.json({ success: true, data: jury });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/pfe/jury/opportunities
   *
   * Returns all groups that need jury members, with availability slots,
   * for teacher self-selection. Excludes groups the teacher already belongs to.
   */
  async getOpportunities(req, res) {
    try {
      const userId = Number(req.user?.id);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' },
        });
      }

      const enseignant = await prisma.enseignant.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!enseignant) {
        return res.json({ success: true, data: [] });
      }

      // Fetch all groups with subject, members, and jury
      const allGroups = await prisma.groupPfe.findMany({
        where: {
          sujetFinalId: { not: null },
        },
        include: {
          sujetFinal: {
            include: {
              enseignant: { include: { user: true } },
              promo: { include: { specialite: true } },
            },
          },
          groupMembers: {
            include: { etudiant: { include: { user: true } } },
          },
          coEncadrant: { include: { user: true } },
          pfeJury: {
            include: { enseignant: { include: { user: true } } },
          },
        },
      });

      const opportunities = allGroups
        .map((group) => {
          const juryEntries = group.pfeJury || [];
          const slots = getAvailableSlots(juryEntries);
          const status = computeJuryStatus(group, juryEntries);
          const alreadyMember = juryEntries.some(j => j.enseignantId === enseignant.id);
          const isSupervisor = group.sujetFinal?.enseignantId === enseignant.id;
          const isCoSupervisor = group.coEncadrantId === enseignant.id;

          return {
            group: {
              id: group.id,
              nom_ar: group.nom_ar,
              nom_en: group.nom_en,
              dateSoutenance: group.dateSoutenance,
              salleSoutenance: group.salleSoutenance,
            },
            subject: group.sujetFinal ? {
              id: group.sujetFinal.id,
              titre_ar: group.sujetFinal.titre_ar,
              titre_en: group.sujetFinal.titre_en,
              typeProjet: group.sujetFinal.typeProjet,
              supervisor: group.sujetFinal.enseignant?.user ? {
                id: group.sujetFinal.enseignant.id,
                nom: group.sujetFinal.enseignant.user.nom,
                prenom: group.sujetFinal.enseignant.user.prenom,
              } : null,
              promo: group.sujetFinal.promo ? {
                id: group.sujetFinal.promo.id,
                nom_ar: group.sujetFinal.promo.nom_ar,
                nom_en: group.sujetFinal.promo.nom_en,
                specialite: group.sujetFinal.promo.specialite ? {
                  nom_ar: group.sujetFinal.promo.specialite.nom_ar,
                  nom_en: group.sujetFinal.promo.specialite.nom_en,
                } : null,
              } : null,
            } : null,
            members: (group.groupMembers || []).map(m => ({
              nom: m.etudiant?.user?.nom,
              prenom: m.etudiant?.user?.prenom,
              role: m.role,
            })),
            jury: juryEntries.map(j => ({
              id: j.id,
              role: j.role,
              enseignant: j.enseignant?.user ? {
                id: j.enseignant.id,
                nom: j.enseignant.user.nom,
                prenom: j.enseignant.user.prenom,
              } : null,
            })),
            slots,
            juryStatus: status,
            alreadyMember,
            isSupervisor,
            isCoSupervisor,
          };
        })
        .filter(opp => !opp.slots.isFull || !opp.alreadyMember); // Show even full groups for awareness

      res.json({ success: true, data: opportunities });
    } catch (error) {
      console.error('getOpportunities error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'OPPORTUNITIES_FAILED', message: error.message },
      });
    }
  }

  /**
   * POST /api/v1/pfe/jury/apply
   *
   * Teacher self-selects for a jury slot. Validates capacity, duplicates,
   * and supervisor constraints.
   */
  async applyForJury(req, res) {
    try {
      const userId = Number(req.user?.id);
      const { groupId, role } = req.body;

      if (!userId || !groupId || !role) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'groupId and role are required.' },
        });
      }

      const enseignant = await prisma.enseignant.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!enseignant) {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_TEACHER', message: 'Only teachers can apply for jury.' },
        });
      }

      // Delegate to addMembre with the teacher's enseignantId
      req.body.enseignantId = enseignant.id;
      req.body.groupId = groupId;
      return this.addMembre(req, res);
    } catch (error) {
      console.error('applyForJury error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'APPLY_FAILED', message: error.message },
      });
    }
  }

  // ── Update jury member role ────────────────────────────────
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ success: false, error: "Le role est requis" });
      }

      const normalizedRole = String(role).toLowerCase();
      if (!['president', 'examinateur', 'rapporteur'].includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ROLE', message: "role must be one of: president | examinateur | rapporteur" },
        });
      }

      const juryId = parseInt(id);

      // One-president-per-group invariant on updates too.
      if (normalizedRole === 'president') {
        const target = await prisma.pfeJury.findUnique({
          where: { id: juryId },
          select: { groupId: true, role: true },
        });
        if (target && target.role !== 'president' && target.groupId) {
          const otherPresident = await prisma.pfeJury.findFirst({
            where: { groupId: target.groupId, role: 'president', NOT: { id: juryId } },
            select: { id: true },
          });
          if (otherPresident) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'PRESIDENT_ALREADY_EXISTS',
                message: 'This group already has a jury president. Demote them first.',
              },
            });
          }
        }
      }

      const jury = await prisma.pfeJury.update({
        where: { id: juryId },
        data: { role: normalizedRole },
        include: {
          enseignant: {
            include: { user: true },
          },
        },
      });

      res.json({ success: true, data: jury });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ── Remove jury member ─────────────────────────────────────
  async delete(req, res) {
    try {
      const { id } = req.params;

      // RBAC: teacher can only remove themselves, admin can remove anyone
      if (!isAdminUser(req.user)) {
        const userId = Number(req.user?.id);
        const enseignant = await prisma.enseignant.findUnique({
          where: { userId },
          select: { id: true },
        });
        const juryEntry = await prisma.pfeJury.findUnique({
          where: { id: parseInt(id) },
          select: { enseignantId: true },
        });
        if (!enseignant || !juryEntry || juryEntry.enseignantId !== enseignant.id) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You can only remove your own jury participation.' },
          });
        }
      }

      await prisma.pfeJury.delete({
        where: { id: parseInt(id) },
      });
      res.json({ success: true, message: "Membre supprimé du jury" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v1/pfe/jury/analytics
   *
   * Admin-only endpoint returning jury-related analytics.
   */
  async getAnalytics(req, res) {
    try {
      if (!isAdminUser(req.user)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin only.' },
        });
      }

      const allGroups = await prisma.groupPfe.findMany({
        where: { sujetFinalId: { not: null } },
        include: {
          pfeJury: true,
        },
      });

      const allJury = await prisma.pfeJury.findMany({
        include: { enseignant: { include: { user: true } } },
      });

      // Per-group status
      const statusCounts = { pending: 0, partial: 0, full: 0, scheduled: 0, completed: 0 };
      for (const group of allGroups) {
        const status = computeJuryStatus(group, group.pfeJury);
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }

      // Teacher participation counts
      const teacherMap = new Map();
      for (const j of allJury) {
        const eid = j.enseignantId;
        if (!teacherMap.has(eid)) {
          teacherMap.set(eid, {
            enseignantId: eid,
            nom: j.enseignant?.user?.nom || '',
            prenom: j.enseignant?.user?.prenom || '',
            count: 0,
            roles: [],
          });
        }
        const entry = teacherMap.get(eid);
        entry.count += 1;
        entry.roles.push(j.role);
      }

      const teacherParticipation = Array.from(teacherMap.values())
        .sort((a, b) => b.count - a.count);

      // Overloaded teachers (more than 3 juries)
      const overloadedTeachers = teacherParticipation.filter(t => t.count > 3);

      res.json({
        success: true,
        data: {
          totalGroups: allGroups.length,
          statusCounts,
          completionRate: allGroups.length > 0
            ? Math.round(((statusCounts.full + statusCounts.scheduled + statusCounts.completed) / allGroups.length) * 100)
            : 0,
          teacherParticipation: teacherParticipation.slice(0, 20),
          overloadedTeachers,
          pendingDefenses: statusCounts.full + statusCounts.partial,
        },
      });
    } catch (error) {
      console.error('getAnalytics error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ANALYTICS_FAILED', message: error.message },
      });
    }
  }
}

module.exports = { JuryController, computeJuryStatus, getAvailableSlots };