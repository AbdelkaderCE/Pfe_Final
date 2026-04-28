const { getMyGroup, getMyDeadlines, getMyGrade, getAvailableSubjects, selectSubject, DomainError } = require('./me.service');

function extractUserId(req) {
  const id = req.user && req.user.id;
  return Number.isInteger(id) && id > 0 ? id : null;
}

function unauthorized(res) {
  return res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  });
}

function sendError(res, err, fallbackLog) {
  if (err instanceof DomainError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  console.error(fallbackLog, err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}

class MeController {
  async getGroup(req, res) {
    const userId = extractUserId(req);
    if (!userId) return unauthorized(res);
    try {
      const data = await getMyGroup(userId);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return sendError(res, err, 'Erreur me/group:');
    }
  }

  async getDeadlines(req, res) {
    const userId = extractUserId(req);
    if (!userId) return unauthorized(res);
    try {
      const data = await getMyDeadlines(userId);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return sendError(res, err, 'Erreur me/deadlines:');
    }
  }

  async getGrade(req, res) {
    const userId = extractUserId(req);
    if (!userId) return unauthorized(res);
    try {
      const data = await getMyGrade(userId);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return sendError(res, err, 'Erreur me/grade:');
    }
  }

  async getAvailableSubjects(req, res) {
    try {
      const userId = extractUserId(req);
      const result = await getAvailableSubjects({
        status: req.query.status,
        promoId: req.query.promoId,
        anneeUniversitaire: req.query.anneeUniversitaire,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      }, userId);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return sendError(res, err, 'Erreur me/subjects:');
    }
  }

  async selectSubject(req, res) {
    const userId = extractUserId(req);
    if (!userId) return unauthorized(res);

    const sujetId = Number(req.body?.sujetId);
    if (!Number.isInteger(sujetId) || sujetId <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SUBJECT_ID', message: 'sujetId must be a positive integer' },
      });
    }

    try {
      const data = await selectSubject(userId, sujetId);
      return res.status(200).json({ success: true, data, message: 'PFE subject selected successfully' });
    } catch (err) {
      return sendError(res, err, 'Erreur me/select-subject:');
    }
  }
}

module.exports = { MeController };
