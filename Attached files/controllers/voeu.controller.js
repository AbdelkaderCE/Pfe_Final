const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class VoeuController {
  // Ajouter un vœu pour un groupe
  async create(req, res) {
    try {
      const { groupId } = req.params;
      const { sujetId, ordre } = req.body;
      
      const voeu = await prisma.groupSujet.create({
        data: {
          groupId: parseInt(groupId),
          sujetId: parseInt(sujetId),
          ordre: ordre,
          status: 'en_attente'
        },
        include: {
          group: true,
          sujet: {
            include: {
              enseignant: {
                include: { user: true }
              }
            }
          }
        }
      });
      
      res.status(201).json({ success: true, data: voeu });
    } catch (error) {
      console.error('Erreur ajout vœu:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Récupérer les vœux d'un groupe
  async getByGroup(req, res) {
    try {
      const { groupId } = req.params;
      const voeux = await prisma.groupSujet.findMany({
        where: { groupId: parseInt(groupId) },
        include: {
          sujet: {
            include: {
              enseignant: {
                include: { user: true }
              }
            }
          }
        },
        orderBy: {
          ordre: 'asc'
        }
      });
      
      res.json({ success: true, data: voeux });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Accepter/Refuser un vœu (admin)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const voeu = await prisma.groupSujet.update({
        where: { id: parseInt(id) },
        data: { status: status },
        include: {
          group: true,
          sujet: true
        }
      });
      
      res.json({ success: true, data: voeu });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Supprimer un vœu
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.groupSujet.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true, message: 'Vœu supprimé' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Enseignant valide ou refuse un vœu (accepte d'encadrer)
async validerParEnseignant(req, res) {
  try {
    const { id } = req.params;
    const { enseignantId, status, commentaire_ar, commentaire_en } = req.body;
    
    const voeu = await prisma.groupSujet.update({
      where: { id: parseInt(id) },
      data: {
        status: status,
        valideParEnseignant: parseInt(enseignantId),
        dateReponseEnseignant: new Date(),
        commentaireEnseignant_ar: commentaire_ar,
        commentaireEnseignant_en: commentaire_en
      },
      include: {
        group: true,
        sujet: {
          include: {
            enseignant: {
              include: { user: true }
            }
          }
        }
      }
    });
    
    // Si le vœu est accepté, on peut mettre à jour le groupe
    if (status === 'accepte') {
      await prisma.groupPfe.update({
        where: { id: voeu.groupId },
        data: {
          sujetFinalId: voeu.sujetId,
          coEncadrantId: parseInt(enseignantId)
        }
      });
    }
    
    res.json({ success: true, message: 'Vœu traité avec succès', data: voeu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
}



module.exports = { VoeuController };