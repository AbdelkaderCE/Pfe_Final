import React from 'react';
import { useTranslation } from 'react-i18next';
import request from '../../../services/api';

export default function StudentsBoard({ students, enseignementId, onDataChange }) {
  const { t } = useTranslation();

  const handleExclusionOverride = async (etudiantId, currentOverrideState) => {
    try {
      await request(`/api/dashboard/teacher/students/exclusion/${etudiantId}`, {
        method: 'PUT',
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

  if (!students || students.length === 0) {
    return <div className="text-center p-6 text-ink-muted bg-surface rounded-lg border border-edge">{t('noStudents')}</div>;
  }

  return (
    <div className="bg-surface rounded-lg shadow-card border border-edge overflow-hidden">
      <div className="px-6 py-4 border-b border-edge flex justify-between items-center">
        <h3 className="font-bold text-ink">
          {t('studentsBoard')} ({students.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-secondary">
          <thead className="bg-surface-200/40 dark:bg-surface-300/30 text-xs uppercase text-ink-muted font-semibold border-b border-edge">
            <tr>
              <th className="px-6 py-4">{t('matricule')}</th>
              <th className="px-6 py-4">{t('studentName')}</th>
              <th className="px-6 py-4">{t('absences')}</th>
              <th className="px-6 py-4 text-right">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-medium">
            {students.map(student => {
              const isExcludedAlert = student.status === 'Excluded';
              const isOverrideActive = student.status === 'Active (Override)';
              
              return (
                <tr key={student.id} className={`hover:bg-surface-100/50 transition-colors ${isExcludedAlert ? 'bg-danger/5' : ''}`}>
                  <td className="px-6 py-4 font-mono text-ink-muted">{student.matricule || 'N/A'}</td>
                  <td className="px-6 py-4 font-bold text-ink">
                    {student.nom} {student.prenom}
                  </td>
                  
                  {/* Global Absences Counter */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-ink-muted">
                         {student.absences.total} {t('absences')} ({student.absences.unjustified} {t('unjustified')} / {student.absences.justified} {t('justified')})
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-bold flex items-center justify-center w-max ${
                        isExcludedAlert ? 'bg-danger/10 text-danger' : 
                        isOverrideActive ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' : 
                        'bg-green-100 text-green-600 dark:bg-green-900/30'
                      }`}>
                        {t(isExcludedAlert ? 'excluded' : isOverrideActive ? 'excludedOverride' : 'active')}
                      </span>
                      
                      {/* Exclusion Toggle Button */}
                      {(student.isAutomaticallyExcluded) && (
                        <button 
                          onClick={() => handleExclusionOverride(student.id, student.isOverridden)}
                          className="mt-2 text-[10px] uppercase font-bold text-blue-500 hover:text-blue-600 underline"
                        >
                          {student.isOverridden ? t('restoreExclusion') : t('overrideExclusion')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

