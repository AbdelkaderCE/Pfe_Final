const express = require('express');
const { MeController } = require('./me.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();
const meController = new MeController();

// All /me routes require authentication
router.use(requireAuth);

// Student: get their current PFE group
router.get('/group', (req, res) => meController.getGroup(req, res));

// Student: get upcoming deadlines
router.get('/deadlines', (req, res) => meController.getDeadlines(req, res));

// Student: get their PFE grade (only when finalized)
router.get('/grade', (req, res) => meController.getGrade(req, res));

// Student: browse available PFE subjects
router.get('/subjects', (req, res) => meController.getAvailableSubjects(req, res));

// Student: select (or change) their PFE subject
router.post('/select-subject', (req, res) => meController.selectSubject(req, res));

module.exports = router;
