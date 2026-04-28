import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function NoteForm({ student, enseignementId, moduleConfig, onClose, onSaved }) {
  const { t } = useTranslation();
  const notes = student.notes || {};
  
  const [exam, setExam] = useState(notes.note_exam ?? '');
  const [td, setTd] = useState(notes.note_td ?? '');
  const [tp, setTp] = useState(notes.note_tp ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      etudiantId: student.id,
      enseignementId: parseInt(enseignementId),
      note_exam: exam !== '' ? parseFloat(exam) : null,
      note_td: moduleConfig.hasTd && td !== '' ? parseFloat(td) : null,
      note_tp: moduleConfig.hasTp && tp !== '' ? parseFloat(tp) : null,
    };

    try {
      const response = await fetch('/api/students/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Failed to save.");
      
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-surface rounded-b-xl shadow-inner border border-control-border">
      <h3 className="text-lg font-bold text-ink mb-4">
        {t('editNotes')}: {student.nom} {student.prenom}
      </h3>
      
      {error && <div className="mb-4 text-danger bg-danger/10 p-3 rounded-lg text-sm border border-danger/30">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
        
        {/* Exam Field (Always required structurally) */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-ink-tertiary uppercase tracking-widest mb-2">{t('examNote')}</label>
          <input 
            type="number" step="0.01" min="0" max="20" required
            value={exam} onChange={(e) => setExam(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            placeholder="0.00 - 20.00"
          />
        </div>

        {/* TD Field */}
        {moduleConfig.hasTd && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-ink-tertiary uppercase tracking-widest mb-2">{t('tdNote')}</label>
            <input 
              type="number" step="0.01" min="0" max="20"
              value={td} onChange={(e) => setTd(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              placeholder="0.00 - 20.00"
            />
          </div>
        )}

        {/* TP Field */}
        {moduleConfig.hasTp && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-ink-tertiary uppercase tracking-widest mb-2">{t('tpNote')}</label>
            <input 
              type="number" step="0.01" min="0" max="20"
              value={tp} onChange={(e) => setTp(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-control-bg border border-control-border rounded-md text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              placeholder="0.00 - 20.00"
            />
          </div>
        )}

        <div className="flex gap-2 min-w-[200px] w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-surface border border-edge text-ink-secondary font-bold rounded-lg hover:bg-surface-200 transition-colors"
          >
            {t('cancel')}
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-2.5 px-6 bg-brand hover:bg-brand-hover text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}

