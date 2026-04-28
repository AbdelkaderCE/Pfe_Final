const express = require('express');
const sujetRoutes = require('./sujet.routes');
const groupeRoutes = require('./groupe.routes');
const groupRoutes = require('./group.routes');
const meRoutes = require('./me.routes');
const juryRoutes = require('./jury.routes');
const compteRenduRoutes = require('./compteRendu.routes');
const voeuRoutes = require('./voeu.routes');
const noteRoutes = require('./note.routes');
const adminRoutes = require('./adminPfe.routes');
const configRoutes = require('./config.routes');

const router = express.Router();

router.use('/sujets', sujetRoutes);
router.use('/groupes', groupeRoutes);
router.use('/groups', groupRoutes);
router.use('/me', meRoutes);
router.use('/jury', juryRoutes);
router.use('/notes', noteRoutes);
router.use('/comptes-rendus', compteRenduRoutes);
router.use('/voeux', voeuRoutes);
router.use('/admin', adminRoutes);
router.use('/config', configRoutes);

module.exports = router;