const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NoteController {
  // 1. Saisir une note pour un groupe (par un membre du jury)
  async saisirNote(req, res) {
    try {
      const { groupId } = req.params;
      const { juryId, note, observation_ar, observation_en } = req.body;
      
      // Vérifier que le jury existe et a le bon rôle
      const jury = await prisma.pfeJury.findFirst({
        where: {
          id: parseInt(juryId),
          groupId: parseInt(groupId)
        }
      });
      
      if (!jury) {
        return res.status(404).json({ 
          success: false, 
          error: 'Membre du jury non trouvé pour ce groupe' 
        });
      }
      
      // Enregistrer la note (à stocker dans une nouvelle table ou mettre à jour)
      const noteRecord = await prisma.notePfe.upsert({
        where: {
          groupId_juryId: {
            groupId: parseInt(groupId),
            juryId: parseInt(juryId)
          }
        },
        update: {
          note: parseFloat(note),
          observation_ar: observation_ar,
          observation_en: observation_en,
          dateSaisie: new Date()
        },
        create: {
          groupId: parseInt(groupId),
          juryId: parseInt(juryId),
          note: parseFloat(note),
          observation_ar: observation_ar,
          observation_en: observation_en,
          dateSaisie: new Date()
        }
      });
      
      // Calculer la moyenne des notes du jury
      await this.calculerMoyenneGroupe(parseInt(groupId));
      
      res.json({ success: true, message: 'Note enregistrée', data: noteRecord });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 2. Calculer la moyenne du groupe
  async calculerMoyenneGroupe(groupId) {
    const notes = await prisma.notePfe.findMany({
      where: { groupId: groupId }
    });
    
    if (notes.length === 0) return;
    
    const somme = notes.reduce((acc, n) => acc + n.note, 0);
    const moyenne = somme / notes.length;
    
    // Déterminer la mention
    let mention = null;
    if (moyenne < 10) mention = null;
    else if (moyenne < 12) mention = 'passable';
    else if (moyenne < 14) mention = 'assez_bien';
    else if (moyenne < 16) mention = 'bien';
    else if (moyenne < 18) mention = 'tres_bien';
    else mention = 'excellent';
    
    // Mettre à jour le groupe
    await prisma.groupPfe.update({
      where: { id: groupId },
      data: {
        note: moyenne,
        mention: mention
      }
    });
  }
  
  // 3. Récupérer les notes d'un groupe
  async getNotesByGroup(req, res) {
    try {
      const { groupId } = req.params;
      
      const notes = await prisma.notePfe.findMany({
        where: { groupId: parseInt(groupId) },
        include: {
          jury: {
            include: {
              enseignant: {
                include: { user: true }
              }
            }
          }
        }
      });
      
      const groupe = await prisma.groupPfe.findUnique({
        where: { id: parseInt(groupId) },
        select: { note: true, mention: true }
      });
      
      res.json({ 
        success: true, 
        data: { 
          notes: notes,
          moyenne: groupe.note,
          mention: groupe.mention
        } 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 4. Valider les notes (admin)
  async validerNotes(req, res) {
    try {
      const { groupId } = req.params;
      const { adminId, commentaire_ar, commentaire_en } = req.body;
      
      const groupe = await prisma.groupPfe.update({
        where: { id: parseInt(groupId) },
        data: {
          // Ajouter un champ validation_notes si nécessaire
          updatedAt: new Date()
        }
      });
      
      res.json({ success: true, message: 'Notes validées', data: groupe });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 5. Générer PV de soutenance
  async genererPvSoutenance(req, res) {
    try {
      const { groupId } = req.params;
      
      const groupe = await prisma.groupPfe.findUnique({
        where: { id: parseInt(groupId) },
        include: {
          sujetFinal: true,
          coEncadrant: {
            include: { user: true }
          },
          groupMembers: {
            include: {
              etudiant: {
                include: { user: true }
              }
            }
          },
          pfeJury: {
            include: {
              enseignant: {
                include: { user: true }
              }
            }
          }
        }
      });
      
      const notes = await prisma.notePfe.findMany({
        where: { groupId: parseInt(groupId) },
        include: {
          jury: {
            include: {
              enseignant: {
                include: { user: true }
              }
            }
          }
        }
      });
      
      // Générer le PV (format JSON, peut être converti en PDF plus tard)
      const pv = {
        groupe: {
          id: groupe.id,
          nom: groupe.nom_ar,
          note: groupe.note,
          mention: groupe.mention,
          dateSoutenance: groupe.dateSoutenance,
          salle: groupe.salleSoutenance
        },
        sujet: {
          titre: groupe.sujetFinal.titre_ar,
          description: groupe.sujetFinal.description_ar
        },
        etudiants: groupe.groupMembers.map(m => ({
          nom: m.etudiant.user.nom,
          prenom: m.etudiant.user.prenom,
          matricule: m.etudiant.matricule
        })),
        jury: groupe.pfeJury.map(j => ({
          nom: j.enseignant.user.nom,
          prenom: j.enseignant.user.prenom,
          role: j.role
        })),
        notes: notes.map(n => ({
          jury: n.jury.enseignant.user.nom + ' ' + n.jury.enseignant.user.prenom,
          note: n.note,
          observation: n.observation_ar
        })),
        moyenne: groupe.note,
        mention: groupe.mention,
        dateGeneration: new Date()
      };
      
      res.json({ success: true, data: pv });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = { NoteController };