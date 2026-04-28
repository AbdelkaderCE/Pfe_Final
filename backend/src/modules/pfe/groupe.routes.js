const express = require('express');
const { GroupeController } = require('./groupe.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();
const groupeController = new GroupeController();

// ─── Admin-only: manual group assembly (create group + assign members) ───
// POST /api/v1/pfe/groupes/manual
router.post('/manual', requireAuth, (req, res) => groupeController.createManual(req, res));

// ─── Admin-only: schedule (or reschedule) the soutenance ─────────────────
// PATCH /api/v1/pfe/groupes/:id/soutenance
router.patch('/:id/soutenance', requireAuth, (req, res) => groupeController.scheduleSoutenance(req, res));

// ─── Existing endpoints (kept untouched) ─────────────────────────────────
router.post('/', (req, res) => groupeController.create(req, res));
router.get('/', (req, res) => groupeController.getAll(req, res));
router.get('/:id', (req, res) => groupeController.getById(req, res));
router.post('/:groupId/membres', (req, res) => groupeController.addMember(req, res));
router.delete('/:id', (req, res) => groupeController.delete(req, res));
router.post('/:groupId/affecter-sujet', (req, res) => groupeController.affecterSujet(req, res));

module.exports = router;
