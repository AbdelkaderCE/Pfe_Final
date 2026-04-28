const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class SujetController {
  // Créer un sujet PFE
  async create(req, res) {
  try {
    const data = req.body;

    // Vérifier si la proposition des sujets est ouverte
const propositionOuverte = await prisma.pfeConfig.findFirst({
  where: { 
    nom_config: 'proposition_sujets_ouverte',
    anneeUniversitaire: data.anneeUniversitaire
  }
});

if (!propositionOuverte || propositionOuverte.valeur !== 'true') {
  return res.status(403).json({ 
    success: false, 
    error: 'La proposition des sujets est fermée pour le moment. Veuillez contacter l\'administration.' 
  });
}
    
    // RÈGLE 2: Vérifier le nombre de sujets par enseignant (max 3)
    const sujetsCount = await prisma.pfeSujet.count({
      where: { 
        enseignantId: parseInt(data.enseignantId),
        anneeUniversitaire: data.anneeUniversitaire
      }
    });
    
    if (sujetsCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un enseignant ne peut pas proposer plus de 3 sujets par année universitaire' 
      });
    }
    
    const sujet = await prisma.pfeSujet.create({
      data: {
        titre: data.titre,
        description: data.description,
        keywords: data.keywords,
        enseignantId: parseInt(data.enseignantId),
        promoId: parseInt(data.promoId),
        workplan: data.workplan,
        bibliographie: data.bibliographie,
        typeProjet: data.typeProjet || 'application',
        status: data.status || 'propose',
        anneeUniversitaire: data.anneeUniversitaire,
        maxGrps: data.maxGrps || 1
      },
      include: {
        enseignant: {
          include: { user: true }
        },
        promo: true
      }
    });
    
    res.status(201).json({ success: true, data: sujet });
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
  // Récupérer tous les sujets
  async getAll(req, res) {
    try {
      const sujets = await prisma.pfeSujet.findMany({
        include: {
          enseignant: true,
          promo: true
        }
      });
      res.json({ success: true, data: sujets });
    } catch (error) {
      console.error('Erreur récupération:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Récupérer un sujet par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const sujet = await prisma.pfeSujet.findUnique({
        where: { id: parseInt(id) },
        include: {
          enseignant: true,
          promo: true,
          groupSujets: true
        }
      });
      
      if (!sujet) {
        return res.status(404).json({ success: false, error: 'Sujet non trouvé' });
      }
      
      res.json({ success: true, data: sujet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Erreur lors de la récupération' });
    }
  }

  // Mettre à jour un sujet
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const sujet = await prisma.pfeSujet.update({
        where: { id: parseInt(id) },
        data: {
          titre: data.titre,
          description: data.description,
          keywords: data.keywords,
          enseignantId: data.enseignantId ? parseInt(data.enseignantId) : undefined,
          promoId: data.promoId ? parseInt(data.promoId) : undefined,
          workplan: data.workplan,
          bibliographie: data.bibliographie,
          typeProjet: data.typeProjet,
          status: data.status,
          anneeUniversitaire: data.anneeUniversitaire,
          maxGrps: data.maxGrps
        }
      });
      res.json({ success: true, data: sujet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
    }
  }

  // Supprimer un sujet
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.pfeSujet.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true, message: 'Sujet supprimé avec succès' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
  }
}

module.exports = { SujetController };
