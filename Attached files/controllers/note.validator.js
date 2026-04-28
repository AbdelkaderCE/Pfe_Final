class NoteValidator {
  // Valider les données d'entrée pour la saisie d'une note
  validerSaisieNote(body) {
    const errors = [];

    if (!body.juryId) {
      errors.push('juryId est requis');
    } else if (isNaN(parseInt(body.juryId))) {
      errors.push('juryId doit être un nombre');
    }

    if (body.note === undefined && body.note === null) {
      errors.push('note est requise');
    } else {
      const note = parseFloat(body.note);
      if (isNaN(note)) {
        errors.push('note doit être un nombre');
      } else if (note < 0 || note > 20) {
        errors.push('note doit être comprise entre 0 et 20');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Valider les données pour la validation des notes
  validerValidationNotes(body) {
    const errors = [];

    if (!body.adminId) {
      errors.push('adminId est requis');
    } else if (isNaN(parseInt(body.adminId))) {
      errors.push('adminId doit être un nombre');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = new NoteValidator();