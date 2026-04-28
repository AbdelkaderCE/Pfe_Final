const express = require('express');
const { SujetController } = require('./sujet.controller');
const { AdminPfeController } = require('./adminPfe.controller');

const router = express.Router();
const sujetController = new SujetController();
const adminController = new AdminPfeController();

router.post('/', (req, res) => sujetController.create(req, res));
router.get('/', (req, res) => sujetController.getAll(req, res));
router.get('/:id', (req, res) => sujetController.getById(req, res));
router.put('/:id', (req, res) => sujetController.update(req, res));
router.patch('/:id/validate', (req, res) => adminController.validerSujet(req, res));
router.patch('/:id/reject', (req, res) => adminController.refuserSujet(req, res));
router.put('/:id/valider', (req, res) => adminController.validerSujet(req, res));
router.put('/:id/refuser', (req, res) => adminController.refuserSujet(req, res));
router.delete('/:id', (req, res) => sujetController.delete(req, res));

module.exports = router;