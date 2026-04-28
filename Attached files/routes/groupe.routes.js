const express = require('express');
const { GroupeController } = require('../controllers/groupe.controller');

const router = express.Router();
const groupeController = new GroupeController();

router.post('/', (req, res) => groupeController.create(req, res));
router.get('/', (req, res) => groupeController.getAll(req, res));
router.get('/:id', (req, res) => groupeController.getById(req, res));
router.post('/:groupId/membres', (req, res) => groupeController.addMember(req, res));
router.delete('/:id', (req, res) => groupeController.delete(req, res));
router.post('/:groupId/affecter-sujet', (req, res) => groupeController.affecterSujet(req, res));
module.exports = router;