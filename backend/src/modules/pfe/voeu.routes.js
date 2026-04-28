const express = require('express');
const { VoeuController } = require('./voeu.controller');

const router = express.Router();
const voeuController = new VoeuController();

router.post('/groupes/:groupId', (req, res) => voeuController.create(req, res));
router.get('/groupes/:groupId', (req, res) => voeuController.getByGroup(req, res));
router.put('/:id/status', (req, res) => voeuController.updateStatus(req, res));
router.delete('/:id', (req, res) => voeuController.delete(req, res));
router.put('/:id/valider-enseignant', (req, res) => voeuController.validerParEnseignant(req, res));
module.exports = router;