import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NoteForm from './NoteForm';
import AttendanceButtons from './AttendanceButtons';

export default function StudentTable({ students, enseignementId, onDataChange }) {
  const { t } = useTranslation();
  const [editingStudent, setEditingStudent] = useState(null);

  if (!students || students.length === 0) {
    return <div className="text-center p-6 text-ink-muted bg-surface rounded-lg border border-edge">{t('noStudents')}</div>;
  }

  const moduleConfig = students[0]?.moduleMetrics || { hasTd: false, hasTp: false };

  const handleExclusionOverride = async (etudiantId, currentOverrideState) => {
    try {
      await fetch(`/api/students/exclusion/${etudiantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enseignementId: parseInt(enseignementId),
          overridden: !currentOverrideState
        })
      });
      onDataChange();
    } catch (err) {
      console.error("Failed to toggle exclusion logic");
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-edge overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-secondary">
          <thead className="bg-surface-200/40 dark:bg-surface-300/30 text-xs uppercase text-ink-muted font-semibold border-b border-edge">
            <tr>
              <th className="px-6 py-4">{t('matricule')}</th>
              <th className="px-6 py-4">{t('studentName')}</th>
              <th className="px-6 py-4">{t('absences')}</th>
              <th className="px-6 py-4">{t('status')}</th>
              
              <th className="px-6 py-4 text-center">{t('examNote')}</th>
              {moduleConfig.hasTd && <th className="px-6 py-4 text-center">{t('tdNote')}</th>}
              {moduleConfig.hasTp && <th className="px-6 py-4 text-center">{t('tpNote')}</th>}
              
              <th className="px-6 py-4 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge font-medium">
            {students.map(student => {
              const notes = student.notes || {};
              const isExcludedAlert = student.status === 'Excluded';
              const isOverrideActive = student.status === 'Active (Override)';
              
              return (
                <React.Fragment key={student.id}>
                  <tr className={`hover:bg-surface-100/50 transition-colors ${isExcludedAlert ? 'bg-danger/5' : ''}`}>
                    <td className="px-6 py-4 font-mono text-ink-muted">{student.matricule || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-ink">
                      {student.nom} {student.prenom}
                    </td>
                    
                    {/* Absences Counter Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-warning"></div> {student.absences.unjustified} {t('unjustified')}</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand"></div> {student.absences.justified} {t('justified')}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-bold flex items-center justify-center w-max ${
                        isExcludedAlert ? 'bg-danger/10 text-danger' : 
                        isOverrideActive ? 'bg-warning/10 text-warning' : 
                        'bg-success/10 text-success'
                      }`}>
                        {t(isExcludedAlert ? 'excluded' : isOverrideActive ? 'excludedOverride' : 'active')}
                      </span>
                      
                      {/* Exclusion Toggle Button (for Teacher to manually forgive) */}
                      {(student.isAutomaticallyExcluded) && (
                        <button 
                          onClick={() => handleExclusionOverride(student.id, student.isOverridden)}
                          className="mt-2 text-[10px] uppercase font-bold text-brand hover:text-brand-hover underline"
                        >
                          {student.isOverridden ? t('restoreExclusion') : t('overrideExclusion')}
                        </button>
                      )}
                    </td>

                    {/* Notes columns */}
                    <td className="px-6 py-4 text-center font-bold text-brand">{notes.note_exam !== undefined && notes.note_exam !== null ? notes.note_exam : '-'}</td>
                    {moduleConfig.hasTd && <td className="px-6 py-4 text-center font-bold text-ink">{notes.note_td !== undefined && notes.note_td !== null ? notes.note_td : '-'}</td>}
                    {moduleConfig.hasTp && <td className="px-6 py-4 text-center font-bold text-ink">{notes.note_tp !== undefined && notes.note_tp !== null ? notes.note_tp : '-'}</td>}

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right space-x-2 rtl:space-x-reverse min-w-[200px]">
                      <AttendanceButtons 
                        etudiantId={student.id} 
                        enseignementId={enseignementId} 
                        onAttendanceMarked={onDataChange} 
                      />
                      <button 
                        onClick={() => setEditingStudent(student.id === editingStudent ? null : student.id)}
                        className="p-2 ml-2 bg-surface border border-edge text-ink-secondary rounded-lg hover:bg-surface-200 transition-colors shadow-sm"
                        title={t('editNotes')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {/* Inline Editor Form if editing this student */}
                  {editingStudent === student.id && (
                    <tr className="bg-brand/5 border-b border-edge">
                      <td colSpan="100%" className="p-0">
                        <NoteForm 
                          student={student} 
                          enseignementId={enseignementId}
                          moduleConfig={moduleConfig}
                          onClose={() => setEditingStudent(null)} 
                          onSaved={() => {
                            setEditingStudent(null);
                            onDataChange();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

