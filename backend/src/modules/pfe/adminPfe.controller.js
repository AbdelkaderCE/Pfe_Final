const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PFE_SUJET_PENDING_STATUS = 'propose';

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
};

async function decideSujetLocked(sujetId, data) {
  const result = await prisma.pfeSujet.updateMany({
    where: { id: sujetId, status: PFE_SUJET_PENDING_STATUS },
    data,
  });

  if (result.count === 0) {
    const existing = await prisma.pfeSujet.findUnique({
      where: { id: sujetId },
      select: { status: true },
    });
    if (!existing) {
      return { notFound: true };
    }
    return { locked: true, currentStatus: existing.status };
  }

  const sujet = await prisma.pfeSujet.findUnique({
    where: { id: sujetId },
    include: { enseignant: { include: { user: true } } },
  });

  return { sujet };
}

class AdminPfeController {

   async togglePropositionSujets(req, res) {
  try {
    const { valeur, adminId } = req.body;
      const anneeUniversitaire = getCurrentAcademicYear();
    
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
      VALUES (${'proposition_sujets_ouverte'}, ${valeur}, ${'السماح باقتراح المواضيع من قبل الأساتذة'}, ${anneeUniversitaire}, ${parseInt(adminId)}, NOW(), NOW())
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
    const sujetId = parseInt(req.params.id);
    const { adminId, commentaire_ar, commentaire_en } = req.body;

    const decided = await decideSujetLocked(sujetId, {
      status: 'valide',
      validePar: parseInt(adminId),
      dateValidation: new Date(),
      commentaireAdmin_ar: commentaire_ar,
      commentaireAdmin_en: commentaire_en,
    });

    if (decided.notFound) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sujet non trouvé' },
      });
    }
    if (decided.locked) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_PROCESSED',
          message: `Ce sujet a déjà été traité (statut actuel: ${decided.currentStatus})`,
        },
      });
    }

    res.json({ success: true, message: 'Sujet validé avec succès', data: decided.sujet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

  // 2. Refuser un sujet
  async refuserSujet(req, res) {
    try {
      const sujetId = parseInt(req.params.id);
      const { adminId, commentaire_ar, commentaire_en } = req.body;

      // Use the canonical `refuse` enum value (added in 20260427100000_status_sujet_add_refuse).
      // Previously this was shoehorned into `termine` because the enum didn't have
      // a dedicated rejected state.
      const decided = await decideSujetLocked(sujetId, {
        status: 'refuse',
        validePar: parseInt(adminId),
        dateValidation: new Date(),
        commentaireAdmin_ar: commentaire_ar,
        commentaireAdmin_en: commentaire_en,
      });

      if (decided.notFound) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Sujet non trouvé' },
        });
      }
      if (decided.locked) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_PROCESSED',
            message: `Ce sujet a déjà été traité (statut actuel: ${decided.currentStatus})`,
          },
        });
      }

      res.json({ success: true, message: 'Sujet refusé', data: decided.sujet });
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
          sujetFinal: {
            include: {
              enseignant: { include: { user: true } },
            },
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
      
      res.json({ success: true, data: groupes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = { AdminPfeController };