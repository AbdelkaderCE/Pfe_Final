const express = require('express');
const { SujetController } = require('../controllers/sujet.controller');

const router = express.Router();
const sujetController = new SujetController();

router.post('/', (req, res) => sujetController.create(req, res));
router.get('/', (req, res) => sujetController.getAll(req, res));
router.get('/:id', (req, res) => sujetController.getById(req, res));
router.put('/:id', (req, res) => sujetController.update(req, res));
router.delete('/:id', (req, res) => sujetController.delete(req, res));

module.exports = router;