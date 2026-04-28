import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import StudentsBoard from './StudentsBoard';
import NotesBoard from './NotesBoard';
import AttendanceBoard from './AttendanceBoard';
import request from '../../../services/api';

export default function StudentManagement({ enseignements }) {
  const { t } = useTranslation();
  const [selectedEnseignement, setSelectedEnseignement] = useState(null);
  const [activeBoard, setActiveBoard] = useState('students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (enseignements && enseignements.length > 0 && !selectedEnseignement) {
      setSelectedEnseignement(enseignements[0].id);
    }
  }, [enseignements, selectedEnseignement]);

  useEffect(() => {
    if (!selectedEnseignement) return;

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await request(`/api/dashboard/teacher/students/module/${selectedEnseignement}`);
        setStudents(json.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedEnseignement]);

  const refreshData = async () => {
    if (!selectedEnseignement) return;
    try {
      const json = await request(`/api/dashboard/teacher/students/module/${selectedEnseignement}`);
      setStudents(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (!enseignements || enseignements.length === 0) {
    return <div className="p-6 text-slate-500">{t('noStudents')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Module Selector Header */}
      <div className="bg-surface p-6 rounded-lg shadow-card border border-edge flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {t('studentManagement')}
        </h2>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {t('selectModule')}:
          </label>
          <select 
            className="w-full sm:w-64 bg-slate-50 dark:bg-slate-900 border border-control-border border-control-border text-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 outline-none font-medium"
            value={selectedEnseignement || ''}
            onChange={(e) => setSelectedEnseignement(parseInt(e.target.value))}
          >
            {enseignements.map(a => (
              <option key={a.id} value={a.id}>
                {a.module?.nom || `Module #${a.id}`} - {a.promo?.nom || 'Promo non assignee'} ({a.type?.toUpperCase() || 'OTHER'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex bg-surface p-1.5 rounded-lg border border-edge mx-auto w-max mb-6 shadow-sm">
        <button
          onClick={() => setActiveBoard('students')}
          className={`px-6 py-2 text-sm font-bold rounded-md transition-colors ${
            activeBoard === 'students' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'
          }`}
        >
          {t('students', { defaultValue: 'Students Board' })}
        </button>
        <button
          onClick={() => setActiveBoard('notes')}
          className={`px-6 py-2 text-sm font-bold rounded-md transition-colors ${
            activeBoard === 'notes' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'
          }`}
        >
          {t('editNotes', { defaultValue: 'Notes Board' })}
        </button>
        <button
          onClick={() => setActiveBoard('attendance')}
          className={`px-6 py-2 text-sm font-bold rounded-md transition-colors ${
            activeBoard === 'attendance' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'
          }`}
        >
          {t('absences', { defaultValue: 'Attendance Board' })}
        </button>
      </div>

      {/* Main Student Data Area */}
      {loading ? (
        <div className="animate-pulse bg-surface p-6 rounded-lg h-64 flex justify-center items-center border border-edge">
          <div className="text-slate-400 dark:text-slate-500 font-medium">{t('moduleLoading')}</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      ) : (
        <>
          {activeBoard === 'students' && (
            <StudentsBoard 
              students={students} 
              enseignementId={selectedEnseignement} 
              onDataChange={refreshData}
            />
          )}

          {activeBoard === 'notes' && (
            <NotesBoard 
              students={students} 
              enseignementId={selectedEnseignement} 
            />
          )}

          {activeBoard === 'attendance' && (
            <AttendanceBoard 
              students={students} 
              enseignementId={selectedEnseignement} 
              onDataChange={refreshData}
            />
          )}
        </>
      )}
    </div>
  );
}

