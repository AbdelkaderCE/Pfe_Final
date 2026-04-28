const { PrismaClient } = require('@prisma/client');
const { emitJuryAssignmentAlert } = require('./pfe-alerts.service');

const prisma = new PrismaClient();

class JuryController {
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

      // One-president-per-group invariant: a new president is only allowed
      // if no other president exists for this group. Other roles are unbounded.
      if (normalizedRole === 'president') {
        const existingPresident = await prisma.pfeJury.findFirst({
          where: { groupId: groupIdNum, role: 'president' },
          select: { id: true },
        });
        if (existingPresident) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'PRESIDENT_ALREADY_EXISTS',
              message: 'This group already has a jury president. Update or remove the existing one first.',
            },
          });
        }
      }

      const juryExistant = await prisma.pfeJury.findFirst({
        where: { groupId: groupIdNum, enseignantId: enseignantIdNum },
      });

      if (juryExistant) {
        return res.status(400).json({
          success: false,
          error: "Cet enseignant est déjà membre du jury de ce groupe",
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

  async getAll(req, res) {
    try {
      const jury = await prisma.pfeJury.findMany({
        include: {
          group: true,
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

      // One-president-per-group invariant on updates too. Look up the
      // jury row's group, then check whether someone else is already
      // president there.
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

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.pfeJury.delete({
        where: { id: parseInt(id) },
      });
      res.json({ success: true, message: "Membre supprimé du jury" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = { JuryController };