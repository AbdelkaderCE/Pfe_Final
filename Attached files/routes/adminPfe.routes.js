const express = require('express');
const { AdminPfeController } = require('../controllers/adminPfe.controller');

const router = express.Router();
const adminController = new AdminPfeController();

// Routes existantes
router.put('/sujets/:id/valider', (req, res) => adminController.validerSujet(req, res));
router.put('/sujets/:id/refuser', (req, res) => adminController.refuserSujet(req, res));
router.put('/groupes/:id/valider-affectation', (req, res) => adminController.validerAffectationGroupe(req, res));
router.get('/sujets/en-attente', (req, res) => adminController.getSujetsEnAttente(req, res));
router.get('/groupes/en-attente', (req, res) => adminController.getGroupesEnAttente(req, res));

// NOUVELLES ROUTES À AJOUTER
router.put('/config/proposition-sujets', (req, res) => adminController.togglePropositionSujets(req, res));
router.get('/config/proposition-sujets', (req, res) => adminController.getPropositionStatus(req, res));

module.exports = router;