const express = require('express');
const { JuryController } = require('../controllers/jury.controller');

const router = express.Router();
const juryController = new JuryController();

router.post('/groupes/:groupId/membres', (req, res) => juryController.addMembre(req, res));
router.get('/groupes/:groupId', (req, res) => juryController.getByGroup(req, res));
router.put('/:id/role', (req, res) => juryController.updateRole(req, res));
router.delete('/:id', (req, res) => juryController.delete(req, res));

module.exports = router;