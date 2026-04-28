const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NoteService {
  // Calculer la mention en fonction de la note
  calculerMention(note) {
    if (note === null || note < 10) return null;
    if (note < 12) return 'passable';
    if (note < 14) return 'assez_bien';
    if (note < 16) return 'bien';
    if (note < 18) return 'tres_bien';
    return 'excellent';
  }

  // Calculer la moyenne d'un groupe et mettre à jour la mention
  async calculerMoyenneEtMention(groupId) {
    try {
      // Récupérer toutes les notes du groupe
      const notes = await prisma.notePfe.findMany({
        where: { groupId: groupId }
      });

      if (notes.length === 0) {
        return { moyenne: null, mention: null };
      }

      // Calculer la moyenne
      const somme = notes.reduce((acc, n) => acc + parseFloat(n.note), 0);
      const moyenne = parseFloat((somme / notes.length).toFixed(2));
      const mention = this.calculerMention(moyenne);

      // Mettre à jour le groupe
      await prisma.groupPfe.update({
        where: { id: groupId },
        data: {
          note: moyenne,
          mention: mention
        }
      });

      return { moyenne, mention };
    } catch (error) {
      console.error('Erreur calcul moyenne:', error);
      throw error;
    }
  }

  // Vérifier si un jury peut noter ce groupe
  async verifierJury(juryId, groupId) {
    const jury = await prisma.pfeJury.findFirst({
      where: {
        id: juryId,
        groupId: groupId
      }
    });

    if (!jury) {
      throw new Error('Ce membre du jury n\'est pas assigné à ce groupe');
    }

    return true;
  }

  // Vérifier si la note est valide
  validerNote(note) {
    const noteNum = parseFloat(note);
    if (isNaN(noteNum)) {
      throw new Error('La note doit être un nombre valide');
    }
    if (noteNum < 0 || noteNum > 20) {
      throw new Error('La note doit être comprise entre 0 et 20');
    }
    return noteNum;
  }
}

module.exports = new NoteService();