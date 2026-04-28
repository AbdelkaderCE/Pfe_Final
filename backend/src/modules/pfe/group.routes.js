const express = require('express');
const { GroupController } = require('./group.controller');

const router = express.Router();
const groupController = new GroupController();

router.post('/', (req, res) => groupController.create(req, res));
router.post('/:groupId/choose-subject', (req, res) => groupController.chooseSubject(req, res));

module.exports = router;
