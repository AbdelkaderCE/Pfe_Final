const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class GroupeController {
  async create(req, res) {
    try {
      const data = req.body;
      
      const groupe = await prisma.groupPfe.create({
        data: {
          nom: data.nom,
          sujetFinalId: parseInt(data.sujetFinalId),
          coEncadrantId: parseInt(data.coEncadrantId),
          dateCreation: data.dateCreation ? new Date(data.dateCreation) : null,
          dateAffectation: data.dateAffectation ? new Date(data.dateAffectation) : null,
          dateSoutenance: data.dateSoutenance ? new Date(data.dateSoutenance) : null,
          salleSoutenance: data.salleSoutenance,
          note: data.note ? parseFloat(data.note) : null,
          mention: data.mention
        },
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
          }
        }
      });
      
      res.status(201).json({ success: true, data: groupe });
    } catch (error) {
      console.error('Erreur création groupe:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const groupes = await prisma.groupPfe.findMany({
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
      
      res.json({ success: true, data: groupes });
    } catch (error) {
      console.error('Erreur récupération groupes:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const groupe = await prisma.groupPfe.findUnique({
        where: { id: parseInt(id) },
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
          groupSujets: {
            include: {
              sujet: true
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
      
      if (!groupe) {
        return res.status(404).json({ success: false, error: 'Groupe non trouvé' });
      }
      
      res.json({ success: true, data: groupe });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

 async addMember(req, res) {
  try {
    const { groupId } = req.params;
    const { etudiantId, role } = req.body;
    
    // RÈGLE 1: Vérifier le nombre de membres (max 3)
    const membresCount = await prisma.groupMember.count({
      where: { groupId: parseInt(groupId) }
    });
    
    if (membresCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un groupe ne peut pas avoir plus de 3 membres' 
      });
    }
    
    // Vérifier si l'étudiant n'est pas déjà dans un groupe
    const etudiantExiste = await prisma.groupMember.findFirst({
      where: { etudiantId: parseInt(etudiantId) }
    });
    
    if (etudiantExiste) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cet étudiant est déjà dans un groupe' 
      });
    }
    
    const member = await prisma.groupMember.create({
      data: {
        groupId: parseInt(groupId),
        etudiantId: parseInt(etudiantId),
        role: role || 'membre'
      },
      include: {
        etudiant: {
          include: { user: true }
        },
        group: true
      }
    });
    
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    console.error('Erreur ajout membre:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.groupPfe.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true, message: 'Groupe supprimé avec succès' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

async affecterSujet(req, res) {
  try {
    const { groupId } = req.params;
    const { etudiantId } = req.body; // ID du leader
    
    // RÈGLE 5: Vérifier que c'est le leader qui fait la demande
    const membre = await prisma.groupMember.findFirst({
      where: {
        groupId: parseInt(groupId),
        etudiantId: parseInt(etudiantId),
        role: 'chef_groupe'
      }
    });
    
    if (!membre) {
      return res.status(403).json({ 
        success: false, 
        error: 'Seul le chef du groupe peut affecter un sujet' 
      });
    }
    
    // Récupérer les vœux du groupe par ordre
    const voeux = await prisma.groupSujet.findMany({
      where: { groupId: parseInt(groupId) },
      orderBy: { ordre: 'asc' },
      include: { sujet: true }
    });
    
    if (voeux.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le groupe n\'a pas de vœux' 
      });
    }
    
    // RÈGLE 4: Parcourir les vœux et affecter le premier disponible
    for (const voeu of voeux) {
      const sujet = await prisma.pfeSujet.findUnique({
        where: { id: voeu.sujetId },
        include: { groupsPfe: true }
      });
      
      if (sujet.groupsPfe.length < sujet.maxGrps) {
        const groupe = await prisma.groupPfe.update({
          where: { id: parseInt(groupId) },
          data: { 
            sujetFinalId: sujet.id,
            dateAffectation: new Date()
          }
        });
        
        await prisma.groupSujet.update({
          where: { id: voeu.id },
          data: { status: 'accepte' }
        });
        
        // Refuser les autres vœux
        await prisma.groupSujet.updateMany({
          where: { 
            groupId: parseInt(groupId),
            id: { not: voeu.id }
          },
          data: { status: 'refuse' }
        });
        
        return res.json({ 
          success: true, 
          message: 'Sujet affecté avec succès',
          data: { groupe, sujet }
        });
      }
    }
    
    return res.status(404).json({ 
      success: false, 
      error: 'Aucun sujet disponible pour ce groupe' 
    });
    
  } catch (error) {
    console.error('Erreur affectation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
}
module.exports = { GroupeController };

