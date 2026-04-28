const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CompteRenduController {
  // Créer un compte-rendu
  async create(req, res) {
    try {
      const data = req.body;
      
      const compteRendu = await prisma.pfeCompteRendu.create({
        data: {
          groupId: parseInt(data.groupId),
          enseignantId: parseInt(data.enseignantId),
          dateReunion: new Date(data.dateReunion),
          contenu: data.contenu,
          actionsDecidees: data.actionsDecidees,
          prochaineReunion: data.prochaineReunion ? new Date(data.prochaineReunion) : null
        },
        include: {
          group: true,
          enseignant: {
            include: { user: true }
          }
        }
      });
      
      res.status(201).json({ success: true, data: compteRendu });
    } catch (error) {
      console.error('Erreur création compte-rendu:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Récupérer les comptes-rendus d'un groupe
  async getByGroup(req, res) {
    try {
      const { groupId } = req.params;
      const comptesRendus = await prisma.pfeCompteRendu.findMany({
        where: { groupId: parseInt(groupId) },
        include: {
          enseignant: {
            include: { user: true }
          }
        },
        orderBy: {
          dateReunion: 'desc'
        }
      });
      
      res.json({ success: true, data: comptesRendus });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Récupérer un compte-rendu par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const compteRendu = await prisma.pfeCompteRendu.findUnique({
        where: { id: parseInt(id) },
        include: {
          group: true,
          enseignant: {
            include: { user: true }
          }
        }
      });
      
      if (!compteRendu) {
        return res.status(404).json({ success: false, error: 'Compte-rendu non trouvé' });
      }
      
      res.json({ success: true, data: compteRendu });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Modifier un compte-rendu
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const compteRendu = await prisma.pfeCompteRendu.update({
        where: { id: parseInt(id) },
        data: {
          contenu: data.contenu,
          actionsDecidees: data.actionsDecidees,
          prochaineReunion: data.prochaineReunion ? new Date(data.prochaineReunion) : null
        }
      });
      
      res.json({ success: true, data: compteRendu });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Supprimer un compte-rendu
  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.pfeCompteRendu.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true, message: 'Compte-rendu supprimé' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = { CompteRenduController };