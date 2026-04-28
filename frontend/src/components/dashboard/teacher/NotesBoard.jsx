import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import request from '../../../services/api';

function GradeRow({ student, enseignementId, moduleConfig, t }) {
  const notes = student.notes || {};
  
  const [exam, setExam] = useState(notes.note_exam ?? '');
  const [td, setTd] = useState(notes.note_td ?? '');
  const [tp, setTp] = useState(notes.note_tp ?? '');
  
  const [saving, setSaving] = useState(false);
  const [synced, setSynced] = useState(true); 

  const [originalVals, setOriginalVals] = useState({ 
    exam: notes.note_exam ?? '', 
    td: notes.note_td ?? '', 
    tp: notes.note_tp ?? '' 
  });

  const handleBlurAndSave = async (field, currentValue) => {
    if (currentValue === originalVals[field]) return;

    setSaving(true);
    setSynced(false);
    
    const payload = {
      etudiantId: student.id,
      enseignementId: parseInt(enseignementId),
      note_exam: exam !== '' ? parseFloat(exam) : null,
      note_td: moduleConfig.hasTd && td !== '' ? parseFloat(td) : null,
      note_tp: moduleConfig.hasTp && tp !== '' ? parseFloat(tp) : null,
    };

    try {
      await request('/api/dashboard/teacher/students/notes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setOriginalVals(prev => ({ ...prev, [field]: currentValue }));
      setSynced(true);
      setTimeout(() => setSynced(false), 2000);
    } catch (err) {
      console.error("Auto Sync Failed", err);
    } finally {
      setSaving(false);
    }
  };

  const isExcludedAlert = student.status === 'Excluded';

  return (
    <tr className={`border-b border-control-border transition-colors ${isExcludedAlert ? 'bg-red-50/20 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
      <td className="px-6 py-3 font-mono text-sm text-slate-500 whitespace-nowrap">{student.matricule || 'N/A'}</td>
      <td className="px-6 py-3 font-bold text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
        {student.nom} {student.prenom}
      </td>
      
      <td className="px-4 py-2">
        <input 
          type="number" step="0.01" min="0" max="20"
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          onBlur={(e) => handleBlurAndSave('exam', e.target.value)}
          className={`w-full max-w-[120px] bg-slate-50 dark:bg-slate-900 border text-center text-sm font-bold text-blue-700 dark:text-blue-400 p-2 rounded-lg outline-none transition-all ${
            synced && exam !== '' ? 'border-edge-strong ring-1 ring-success' : 'border-control-border focus:border-brand'
          }`}
          placeholder=" / 20"
        />
      </td>

      {moduleConfig.hasTd && (
        <td className="px-4 py-2">
          <input 
            type="number" step="0.01" min="0" max="20"
            value={td}
            onChange={(e) => setTd(e.target.value)}
            onBlur={(e) => handleBlurAndSave('td', e.target.value)}
            className={`w-full max-w-[120px] bg-slate-50 dark:bg-slate-900 border text-center text-sm font-bold text-slate-700 dark:text-slate-300 p-2 rounded-lg outline-none transition-all ${
              synced && td !== '' ? 'border-edge-strong ring-1 ring-success' : 'border-control-border focus:border-brand'
            }`}
            placeholder=" / 20"
          />
        </td>
      )}

      {moduleConfig.hasTp && (
        <td className="px-4 py-2">
          <input 
            type="number" step="0.01" min="0" max="20"
            value={tp}
            onChange={(e) => setTp(e.target.value)}
            onBlur={(e) => handleBlurAndSave('tp', e.target.value)}
            className={`w-full max-w-[120px] bg-slate-50 dark:bg-slate-900 border text-center text-sm font-bold text-slate-700 dark:text-slate-300 p-2 rounded-lg outline-none transition-all ${
              synced && tp !== '' ? 'border-edge-strong ring-1 ring-success' : 'border-control-border focus:border-brand'
            }`}
            placeholder=" / 20"
          />
        </td>
      )}

      <td className="px-6 py-3 text-right">
        {saving && <span className="text-xs text-slate-400 italic">{t('loading')}</span>}
      </td>
    </tr>
  );
}

export default function NotesBoard({ students, enseignementId }) {
  const { t } = useTranslation();

  if (!students || students.length === 0) {
    return <div className="text-center p-6 text-ink-muted bg-surface rounded-lg border border-edge">{t('noStudents')}</div>;
  }

  const moduleConfig = students[0]?.moduleMetrics || { hasTd: false, hasTp: false };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-edge overflow-hidden">
      <div className="px-6 py-4 border-b border-control-border border-control-border bg-slate-50/50 dark:bg-slate-800/80 flex items-center justify-between">
        <h3 className="font-bold text-ink flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          {t('editNotes')}
        </h3>
        <p className="text-xs text-slate-400 italic">{t('autoSavesOnBlur')}</p>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full text-left">
          <thead className="text-xs uppercase text-ink-muted font-semibold border-b border-edge bg-surface-200/40 dark:bg-surface-300/30">
            <tr>
              <th className="px-6 py-3">{t('matricule')}</th>
              <th className="px-6 py-3">{t('studentName')}</th>
              <th className="px-4 py-3 text-center">{t('examNote')}</th>
              {moduleConfig.hasTd && <th className="px-4 py-3 text-center">{t('tdNote')}</th>}
              {moduleConfig.hasTp && <th className="px-4 py-3 text-center">{t('tpNote')}</th>}
              <th className="px-6 py-3 text-right">{t('state')}</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <GradeRow 
                key={student.id} 
                student={student} 
                enseignementId={enseignementId} 
                moduleConfig={moduleConfig}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

