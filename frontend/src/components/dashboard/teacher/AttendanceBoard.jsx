import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import request from '../../../services/api';

function AttendanceRow({ student, enseignementId, selectedDate, onAttendanceMarked }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const history = student?.absences?.history || [];
  const record = history.find(a => {
    const recordDate = new Date(a.date).toISOString().split('T')[0];
    return recordDate === selectedDate;
  });

  const status = record 
    ? (record.present ? 'Present' : (record.justifie ? 'Justified' : 'Unjustified')) 
    : 'None';

  const handleMark = async (present, justifie) => {
    const isUnmarking = (
      (status === 'Present' && present === true) ||
      (status === 'Unjustified' && present === false && justifie === false) ||
      (status === 'Justified' && present === false && justifie === true)
    );

    setLoading(true);
    try {
      await request('/api/dashboard/teacher/students/attendance', {
        method: 'POST',
        body: JSON.stringify({
          etudiantId: parseInt(student.id),
          enseignementId: parseInt(enseignementId),
          date: new Date(selectedDate).toISOString(),
          present,
          justifie,
          unmark: isUnmarking
        })
      });
      if (onAttendanceMarked) onAttendanceMarked();
    } catch (err) {
      console.error("Failed to mark attendance", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-b border-edge-subtle hover:bg-surface-200/60 transition-colors duration-150">
      <td className="px-6 py-4 font-mono text-sm text-ink-tertiary whitespace-nowrap">{student.matricule || 'N/A'}</td>
      <td className="px-6 py-4 font-semibold text-sm text-ink whitespace-nowrap">
        {student.nom} {student.prenom}
      </td>
      
      <td className="px-6 py-4">
        {status === 'None' && <span className="text-ink-muted italic text-xs">{t('unmarked')}</span>}
        {status === 'Present' && <span className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs font-medium text-success">{t('present')}</span>}
        {status === 'Unjustified' && <span className="rounded-md border border-edge-strong bg-danger/10 px-2 py-1 text-xs font-medium text-danger">{t('absent')}</span>}
        {status === 'Justified' && <span className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-xs font-medium text-warning">{t('justified')}</span>}
      </td>

      <td className="px-6 py-4 text-right">
        <div className={`inline-flex gap-2 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <button 
            onClick={() => handleMark(true, false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-brand/30 ${
              status === 'Present' 
                ? 'bg-success text-white border-success shadow-soft' 
                : 'bg-surface text-success border-success/30 hover:bg-success/10'
            }`}
          >
            &#x2714; P
          </button>
          <button 
            onClick={() => handleMark(false, false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-brand/30 ${
              status === 'Unjustified' 
                ? 'bg-danger text-white border-danger shadow-soft' 
                : 'bg-surface text-danger border-edge-strong hover:bg-danger/10'
            }`}
          >
            &#x2716; A
          </button>
          <button 
            onClick={() => handleMark(false, true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-brand/30 ${
              status === 'Justified' 
                ? 'bg-warning text-white border-warning shadow-soft' 
                : 'bg-surface text-warning border-warning/30 hover:bg-warning/10'
            }`}
          >
            &#x2716; J
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AttendanceBoard({ students, enseignementId, onDataChange }) {
  const { t } = useTranslation();
  const normalizedStudents = useMemo(() => students || [], [students]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const summary = useMemo(() => {
    return normalizedStudents.reduce((acc, student) => {
      const history = student?.absences?.history || [];
      const record = history.find(a => new Date(a.date).toISOString().split('T')[0] === selectedDate);
      if (record) {
        if (record.present) acc.present++;
        else if (record.justifie) acc.justified++;
        else acc.absent++;
      }
      return acc;
    }, { present: 0, absent: 0, justified: 0 });
  }, [normalizedStudents, selectedDate]);

  if (normalizedStudents.length === 0) {
    return <div className="rounded-lg border border-edge bg-surface p-6 text-center text-sm text-ink-secondary">{t('noStudents')}</div>;
  }

  return (
    <div className="flex h-[700px] flex-col rounded-lg border border-edge bg-surface shadow-card">
      
      {/* Header with Date Picker */}
      <div className="flex flex-col items-center justify-between gap-4 border-b border-edge bg-surface-200 px-6 py-4 sm:flex-row">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {t('dailyTracking')}
        </h3>
        
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">{t('date')}</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-control-border bg-control-bg p-2.5 text-sm font-medium text-ink outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/30"
            required
          />
        </div>
      </div>

      {/* Wrapping the table in a flex-1 robust scrollable container so the footer stays sticky at the bottom */}
      <div className="flex-1 overflow-x-auto overflow-y-auto w-full">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 border-b border-edge bg-surface text-xs font-semibold uppercase text-ink-secondary">
            <tr>
              <th className="px-6 py-3">{t('matricule')}</th>
              <th className="px-6 py-3">{t('studentName')}</th>
              <th className="px-6 py-3">{t('loggedStatus')}</th>
              <th className="px-6 py-3 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {normalizedStudents.map(student => (
              <AttendanceRow 
                key={student.id} 
                student={student} 
                enseignementId={enseignementId} 
                selectedDate={selectedDate}
                onAttendanceMarked={onDataChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky Daily Summary Footer */}
      <div className="border-t border-edge bg-surface-200 px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-semibold text-ink-secondary">
            {t('summaryFor')} <span className="text-brand">{selectedDate}</span>
          </span>
          <div className="flex gap-4">
            <div className="min-w-[100px] rounded-md border border-success/30 bg-success/10 px-4 py-2 text-center">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">{t('totalPresent')}</span>
              <span className="text-xl font-bold text-success">{summary.present}</span>
            </div>
            <div className="min-w-[100px] rounded-md border border-edge-strong bg-danger/10 px-4 py-2 text-center">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">{t('totalAbsent')}</span>
              <span className="text-xl font-bold text-danger">{summary.absent}</span>
            </div>
            <div className="min-w-[100px] rounded-md border border-warning/30 bg-warning/10 px-4 py-2 text-center">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">{t('justified')}</span>
              <span className="text-xl font-bold text-warning">{summary.justified}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

