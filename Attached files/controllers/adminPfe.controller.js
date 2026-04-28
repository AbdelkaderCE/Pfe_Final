const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AdminPfeController {

   async togglePropositionSujets(req, res) {
  try {
    const { valeur, adminId } = req.body;
    
    // Vérifier que l'admin existe
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(adminId) }
    });
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Administrateur non trouvé' 
      });
    }
    
    // Utiliser $executeRaw pour éviter les problèmes de mapping
    await prisma.$executeRaw`
      INSERT INTO pfe_config (nom_config, valeur, description_ar, annee_universitaire, created_by, created_at, updated_at)
      VALUES (${'proposition_sujets_ouverte'}, ${valeur}, ${'السماح باقتراح المواضيع من قبل الأساتذة'}, ${'2025/2026'}, ${parseInt(adminId)}, NOW(), NOW())
      ON CONFLICT (nom_config) DO UPDATE SET 
        valeur = ${valeur},
        updated_at = NOW()
    `;
    
    // Récupérer la config mise à jour
    const config = await prisma.pfeConfig.findUnique({
      where: { nom_config: 'proposition_sujets_ouverte' }
    });
    
    res.json({ 
      success: true, 
      message: valeur === 'true' ? 'Proposition des sujets activée' : 'Proposition des sujets désactivée',
      data: config 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Vérifier l'état de la proposition
async getPropositionStatus(req, res) {
  try {
    const config = await prisma.pfeConfig.findUnique({
      where: { 
        nom_config: 'proposition_sujets_ouverte'
      }
    });
    
    res.json({ 
      success: true, 
      data: { 
        ouverte: config ? config.valeur === 'true' : false 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

  // 1. Valider un sujet proposé par un enseignant
 async validerSujet(req, res) {
  try {
    const { id } = req.params;
    const { adminId, commentaire_ar, commentaire_en } = req.body;
    
    const sujet = await prisma.pfeSujet.update({
      where: { id: parseInt(id) },
      data: {
        status: 'valide',
        validePar: parseInt(adminId),
        dateValidation: new Date(),
        commentaireAdmin_ar: commentaire_ar,
        commentaireAdmin_en: commentaire_en
      },
      include: {
        enseignant: {
          include: { user: true }
        }
      }
    });
    
    res.json({ success: true, message: 'Sujet validé avec succès', data: sujet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
  
  // 2. Refuser un sujet
  async refuserSujet(req, res) {
    try {
      const { id } = req.params;
      const { adminId, commentaire_ar, commentaire_en } = req.body;
      
      const sujet = await prisma.pfeSujet.update({
        where: { id: parseInt(id) },
        data: {
          status: 'termine',
          validePar: parseInt(adminId),
          dateValidation: new Date(),
          commentaireAdmin_ar: commentaire_ar,
          commentaireAdmin_en: commentaire_en
        }
      });
      
      res.json({ success: true, message: 'Sujet refusé', data: sujet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 3. Valider l'affectation finale d'un groupe
  async validerAffectationGroupe(req, res) {
    try {
      const { id } = req.params;
      const { adminId, commentaire_ar, commentaire_en } = req.body;
      
      const groupe = await prisma.groupPfe.update({
        where: { id: parseInt(id) },
        data: {
          validationFinale: true,
          dateValidationFinale: new Date(),
          valideParAdmin: parseInt(adminId),
          commentaireAdmin_ar: commentaire_ar,
          commentaireAdmin_en: commentaire_en
        },
        include: {
          sujetFinal: true,
          groupMembers: {
            include: {
              etudiant: {
                include: { user: true }
              }
            }
          }
        }
      });
      
      // Mettre à jour le statut du sujet
      if (groupe.sujetFinal) {
        await prisma.pfeSujet.update({
          where: { id: groupe.sujetFinal.id },
          data: { status: 'affecte' }
        });
      }
      
      res.json({ success: true, message: 'Affectation validée', data: groupe });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 4. Récupérer les sujets en attente de validation
  async getSujetsEnAttente(req, res) {
    try {
      const sujets = await prisma.pfeSujet.findMany({
        where: { status: 'propose' },
        include: {
          enseignant: {
            include: { user: true }
          },
          promo: true
        }
      });
      
      res.json({ success: true, data: sujets });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 5. Récupérer les groupes en attente de validation finale
  async getGroupesEnAttente(req, res) {
    try {
      const groupes = await prisma.groupPfe.findMany({
        where: { 
          sujetFinalId: { not: null },
          validationFinale: false
        },
        include: {
          sujetFinal: true,
          groupMembers: {
            include: {
              etudiant: {
                include: { user: true }
              }
            }
          }
        }
      });
      
      res.json({ success: true, data: groupes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = { AdminPfeController };