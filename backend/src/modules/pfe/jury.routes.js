const express = require('express');
const { JuryController } = require('./jury.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();
const juryController = new JuryController();

// ── Teacher: my own jury assignments (must be declared BEFORE `/:id`) ───
router.get('/me', requireAuth, (req, res) => juryController.getMine(req, res));

// ── Teacher: available jury opportunities ────────────────────────────────
router.get('/opportunities', requireAuth, (req, res) => juryController.getOpportunities(req, res));

// ── Teacher: apply for a jury slot ───────────────────────────────────────
router.post('/apply', requireAuth, (req, res) => juryController.applyForJury(req, res));

// ── Admin: jury analytics ────────────────────────────────────────────────
router.get('/analytics', requireAuth, (req, res) => juryController.getAnalytics(req, res));

// ── List all (RBAC-scoped inside the controller) ────────────────────────
router.get('/', requireAuth, (req, res) => juryController.getAll(req, res));
router.post('/', requireAuth, (req, res) => juryController.addMembre(req, res));
router.put('/:id', requireAuth, (req, res) => juryController.updateRole(req, res));

// ── Per-group jury fetch ────────────────────────────────────────────────
router.post('/groupes/:groupId/membres', requireAuth, (req, res) => juryController.addMembre(req, res));
router.get('/groupes/:groupId', requireAuth, (req, res) => juryController.getByGroup(req, res));
router.put('/:id/role', requireAuth, (req, res) => juryController.updateRole(req, res));
router.delete('/:id', requireAuth, (req, res) => juryController.delete(req, res));

module.exports = router;