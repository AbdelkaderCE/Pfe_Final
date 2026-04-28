const express = require('express');
const { CompteRenduController } = require('./compteRendu.controller');

const router = express.Router();
const compteRenduController = new CompteRenduController();

router.post('/', (req, res) => compteRenduController.create(req, res));
router.get('/groupes/:groupId', (req, res) => compteRenduController.getByGroup(req, res));
router.get('/:id', (req, res) => compteRenduController.getById(req, res));
router.put('/:id', (req, res) => compteRenduController.update(req, res));
router.delete('/:id', (req, res) => compteRenduController.delete(req, res));

module.exports = router;