const { createGroup, chooseSubject, DomainError } = require('./group.service');
const { assertGroupNotFinalized } = require('./pfe-lock.service');

function sendError(res, err, fallbackLog) {
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
  if (err && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { code: 'UNIQUE_VIOLATION', message: 'Unique constraint violation' },
    });
  }
  console.error(fallbackLog, err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}

class GroupController {
  async create(req, res) {
    try {
      const group = await createGroup(req.body);
      return res.status(201).json({ success: true, data: group });
    } catch (err) {
      return sendError(res, err, 'Erreur création groupe:');
    }
  }

  async chooseSubject(req, res) {
    try {
      // Lock guard — can't switch subject if PFE is finalized.
      await assertGroupNotFinalized(parseInt(req.params.groupId));
      const wish = await chooseSubject(req.params.groupId, req.body);
      return res.status(200).json({ success: true, data: wish });
    } catch (err) {
      return sendError(res, err, 'Erreur choix sujet:');
    }
  }
}

module.exports = { GroupController };
