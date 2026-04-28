const express = require('express');
const sujetRoutes = require('./sujet.routes');
const groupeRoutes = require('./groupe.routes');
const juryRoutes = require('./jury.routes');
const compteRenduRoutes = require('./compteRendu.routes');
const voeuRoutes = require('./voeu.routes');
const noteRoutes = require('./note.routes');
const adminRoutes = require('./adminPfe.routes');  // ← AJOUTER

const router = express.Router();

router.use('/sujets', sujetRoutes);
router.use('/groupes', groupeRoutes);
router.use('/jury', juryRoutes);
router.use('/notes', noteRoutes);
router.use('/comptes-rendus', compteRenduRoutes);
router.use('/voeux', voeuRoutes);
router.use('/admin', adminRoutes);  // ← AJOUTER

module.exports = router;