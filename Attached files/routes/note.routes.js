const express = require('express');
const { NoteController } = require('../controllers/note.controller');

const router = express.Router();
const noteController = new NoteController();

// Routes pour les notes
router.post('/groupes/:groupId/notes', (req, res) => noteController.saisirNote(req, res));
router.get('/groupes/:groupId/notes', (req, res) => noteController.getNotesByGroup(req, res));
router.put('/groupes/:groupId/valider-notes', (req, res) => noteController.validerNotes(req, res));
router.get('/groupes/:groupId/pv', (req, res) => noteController.genererPvSoutenance(req, res));

module.exports = router;