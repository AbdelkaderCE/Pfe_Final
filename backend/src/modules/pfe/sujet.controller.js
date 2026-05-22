const { PrismaClient } = require('@prisma/client');
const { isSubmissionOpen, getMaxSubjectsPerTeacher, isStudentSelectionAllowed } = require('./pfe-config.service');
const { emitSubjectCreatedAlerts } = require('./pfe-alerts.service');

const prisma = new PrismaClient();

const isAdmin = (req) => {
  const u = req?.user;
  if (!u) return false;
  // 1. coreRole field (set by RBAC middleware)
  if (String(u.coreRole || '').toLowerCase() === 'admin') return true;
  // 2. roles array — strings or objects with .nom / .name
  if (Array.isArray(u.roles)) {
    const matches = u.roles.some((r) => {
      const name = typeof r === 'string' ? r : (r?.nom || r?.name || '');
      return String(name).toLowerCase() === 'admin';
    });
    if (matches) return true;
  }
  // 3. legacy single-role field
  if (String(u.role || '').toLowerCase() === 'admin') return true;
  return false;
};

const isStudent = (req) =>
  Array.isArray(req?.user?.roles) &&
  req.user.roles.some((r) => String(r || '').toLowerCase() === 'etudiant');

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
};

/**
 * Resolve the promoIds a teacher is allowed to post subjects for.
 * Derived from their `enseignement` records (modules → promo links).
 */
const getTeacherAllowedPromoIds = async (enseignantId) => {
  const enseignements = await prisma.enseignement.findMany({
    where: { enseignantId },
    select: { promoId: true },
  });
  const ids = enseignements
    .map((e) => e.promoId)
    .filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)];
};

class SujetController {
  // Créer un sujet PFE
  async create(req, res) {
  try {
    const data = req.body;
    const enseignantId = toPositiveInt(data.enseignantId);
    const anneeUniversitaire =
      typeof data.anneeUniversitaire === 'string' && data.anneeUniversitaire.trim()
        ? data.anneeUniversitaire.trim()
        : getCurrentAcademicYear();
    const maxGrps = Number(data.maxGrps ?? data.max_grps ?? 1) || 1;

    if (!enseignantId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ENSEIGNANT_ID_REQUIRED',
          message: 'enseignantId est requis et doit être un entier positif.',
        },
      });
    }

    // Submission lock — admin always bypasses, everyone else must wait until
    // the submission window is opened from the admin PFE config screen.
    if (!isAdmin(req)) {
      const open = await isSubmissionOpen();
      if (!open) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SUBMISSION_CLOSED',
            message: "PFE subject submission is currently closed. Please contact the administration.",
          },
        });
      }
    }

    // ── Promo enforcement ─────────────────────────────────────────
    let promoId = toPositiveInt(data.promoId);

    if (!promoId) {
      const fallbackPromo = await prisma.promo.findFirst({
        orderBy: { id: 'asc' },
        select: { id: true },
      });
      promoId = fallbackPromo?.id || null;
    }

    if (!promoId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROMO_REQUIRED',
          message: 'Aucune promo disponible. Veuillez configurer les promotions ou fournir promoId.',
        },
      });
    }
    
    // ── Max subjects per teacher (config-driven) ──────────────────
    const maxSubjects = await getMaxSubjectsPerTeacher();
    const sujetsCount = await prisma.pfeSujet.count({
      where: { 
        enseignantId,
        anneeUniversitaire
      }
    });
    
    if (sujetsCount >= maxSubjects && !isAdmin(req)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUBJECT_QUOTA_EXCEEDED',
          message: `Un enseignant ne peut pas proposer plus de ${maxSubjects} sujets par année universitaire. (${sujetsCount}/${maxSubjects})`,
        },
      });
    }
    
    const sujet = await prisma.pfeSujet.create({
      data: {
        titre_ar:         data.titre_ar        ?? data.titre         ?? '',
        titre_en:         data.titre_en        ?? null,
        description_ar:   data.description_ar  ?? data.description   ?? '',
        description_en:   data.description_en  ?? null,
        keywords_ar:      data.keywords_ar     ?? data.keywords      ?? null,
        keywords_en:      data.keywords_en     ?? null,
        workplan_ar:      data.workplan_ar     ?? data.workplan      ?? null,
        workplan_en:      data.workplan_en     ?? null,
        bibliographie_ar: data.bibliographie_ar ?? data.bibliographie ?? null,
        bibliographie_en: data.bibliographie_en ?? null,
        enseignantId,
        promoId,
        typeProjet: data.typeProjet || 'application',
        status: data.status || 'propose',
        anneeUniversitaire,
        maxGrps
      },
      include: {
        enseignant: {
          include: { user: true }
        },
        promo: true
      }
    });
    
    // Fan-out to admins. Async, swallowed errors — never blocks the response.
    emitSubjectCreatedAlerts(sujet.id).catch(() => {});

    res.status(201).json({ success: true, data: sujet });
  } catch (error) {
    console.error('Erreur création sujet PFE:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    res.status(500).json({
      success: false,
      error: {
        code: error?.code || 'SUBJECT_CREATE_FAILED',
        message: error?.message || 'Échec de la création du sujet.',
      },
    });
  }
}
  // Récupérer tous les sujets
  async getAll(req, res) {
    try {
      const teacherId = toPositiveInt(req.query.enseignantId ?? req.query.teacherId ?? req.query.teacherProfileId);
      const status = typeof req.query.status === 'string' && req.query.status.trim() ? req.query.status.trim() : null;
      const anneeUniversitaire =
        typeof req.query.anneeUniversitaire === 'string' && req.query.anneeUniversitaire.trim()
          ? req.query.anneeUniversitaire.trim()
          : null;

      const where = {};

      if (teacherId) {
        where.enseignantId = teacherId;
      }

      if (status) {
        where.status = status;
      }

      if (anneeUniversitaire) {
        where.anneeUniversitaire = anneeUniversitaire;
      }

      // ── Student promo isolation ───────────────────────────────────
      // When the caller is a student, restrict to their promo only.
      if (isStudent(req) && req.user?.id) {
        const student = await prisma.etudiant.findUnique({
          where: { userId: Number(req.user.id) },
          select: { promoId: true },
        });
        if (student?.promoId) {
          where.promoId = student.promoId;
        } else {
          // Student has no promo → return empty
          return res.json({ success: true, data: [] });
        }
      }

      const sujets = await prisma.pfeSujet.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        include: {
          enseignant: {
            include: { user: true }
          },
          promo: true,
          groupsPfe: true,
          groupSujets: true,
        }
      });
      res.json({ success: true, data: sujets });
    } catch (error) {
      console.error('Erreur récupération sujets:', error);
      res.status(500).json({
        success: false,
        error: {
          code: error?.code || 'SUBJECT_FETCH_FAILED',
          message: error?.message || 'Échec de la récupération des sujets.',
        },
      });
    }
  }

  // Récupérer un sujet par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const sujet = await prisma.pfeSujet.findUnique({
        where: { id: parseInt(id) },
        include: {
          enseignant: {
            include: { user: true }
          },
          promo: true,
          groupSujets: true
        }
      });
      
      if (!sujet) {
        return res.status(404).json({ success: false, error: 'Sujet non trouvé' });
      }
      
      res.json({ success: true, data: sujet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
  }

  // Mettre à jour un sujet
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      // Edit guard:
      //   - Admin: may edit any subject in any state.
      //   - Anyone else: only the owning teacher may edit, AND only while the
      //     subject is still in `propose` (= pending). Once it's been validated
      //     or rejected, edits are admin-only.
      const sujetId = parseInt(id);
      const existing = await prisma.pfeSujet.findUnique({
        where: { id: sujetId },
        select: { id: true, status: true, enseignantId: true },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sujet non trouvé' },
        });
      }
      if (!isAdmin(req)) {
        const userEnseignant = await prisma.enseignant.findUnique({
          where: { userId: Number(req?.user?.id) || -1 },
          select: { id: true },
        });
        if (!userEnseignant || userEnseignant.id !== existing.enseignantId) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You can only edit subjects you own.' },
          });
        }
        if (existing.status !== 'propose' && existing.status !== 'refuse') {
          return res.status(409).json({
            success: false,
            error: {
              code: 'SUBJECT_LOCKED',
              message: `This subject is in state "${existing.status}" and can no longer be edited by the teacher. Ask an admin.`,
            },
          });
        }
      }

      const updateData = {
        enseignantId: data.enseignantId ? parseInt(data.enseignantId) : undefined,
        promoId: data.promoId ? parseInt(data.promoId) : undefined,
        typeProjet: data.typeProjet,
        status: data.status,
        anneeUniversitaire: data.anneeUniversitaire,
        maxGrps: data.maxGrps,
      };

      if (!isAdmin(req) && existing.status === 'refuse') {
        updateData.status = 'propose';
      }

      // Map bilingual fields only when provided (supports legacy single-language payload).
      if (data.titre_ar !== undefined)         updateData.titre_ar = data.titre_ar;
      else if (data.titre !== undefined)       updateData.titre_ar = data.titre;
      if (data.titre_en !== undefined)         updateData.titre_en = data.titre_en;

      if (data.description_ar !== undefined)   updateData.description_ar = data.description_ar;
      else if (data.description !== undefined) updateData.description_ar = data.description;
      if (data.description_en !== undefined)   updateData.description_en = data.description_en;

      if (data.keywords_ar !== undefined)      updateData.keywords_ar = data.keywords_ar;
      else if (data.keywords !== undefined)    updateData.keywords_ar = data.keywords;
      if (data.keywords_en !== undefined)      updateData.keywords_en = data.keywords_en;

      if (data.workplan_ar !== undefined)      updateData.workplan_ar = data.workplan_ar;
      else if (data.workplan !== undefined)    updateData.workplan_ar = data.workplan;
      if (data.workplan_en !== undefined)      updateData.workplan_en = data.workplan_en;

      if (data.bibliographie_ar !== undefined)    updateData.bibliographie_ar = data.bibliographie_ar;
      else if (data.bibliographie !== undefined)  updateData.bibliographie_ar = data.bibliographie;
      if (data.bibliographie_en !== undefined)    updateData.bibliographie_en = data.bibliographie_en;

      const sujet = await prisma.pfeSujet.update({
        where: { id: parseInt(id) },
        data: updateData
      });
      res.json({ success: true, data: sujet });
    } catch (error) {
      console.error('Erreur mise à jour sujet:', error);
      res.status(500).json({
        success: false,
        error: {
          code: error?.code || 'SUBJECT_UPDATE_FAILED',
          message: error?.message || 'Erreur lors de la mise à jour.',
        },
      });
    }
  }

  // Supprimer un sujet
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.pfeSujet.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true, message: 'Sujet supprimé avec succès' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
  }
}

module.exports = { SujetController };
