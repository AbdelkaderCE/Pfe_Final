import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import request from '../../../services/api';

export default function AttendanceButtons({ etudiantId, enseignementId, onAttendanceMarked }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleMark = async (present, justifie) => {
    setLoading(true);
    try {
      await request('/api/dashboard/teacher/students/attendance', {
        method: 'POST',
        body: JSON.stringify({
          etudiantId: parseInt(etudiantId),
          enseignementId: parseInt(enseignementId),
          date: new Date().toISOString(), // Defaulting to today's date for simplicity
          present: present,
          justifie: justifie
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
    <div className="inline-flex gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
      {/* Present Badge Action */}
      <button 
        disabled={loading}
        onClick={() => handleMark(true, false)}
        className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-800/60 rounded-md text-[11px] font-bold tracking-wide uppercase transition-colors"
        title={t('markPresent')}
      >
        &#x2714; P
      </button>

      {/* Unjustified Absence */}
      <button 
        disabled={loading}
        onClick={() => handleMark(false, false)}
        className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-800/60 rounded-md text-[11px] font-bold tracking-wide uppercase transition-colors"
        title={t('unjustified')}
      >
        &#x2716; U
      </button>

      {/* Justified Absence */}
      <button 
        disabled={loading}
        onClick={() => handleMark(false, true)}
        className="px-2.5 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-800/60 rounded-md text-[11px] font-bold tracking-wide uppercase transition-colors"
        title={t('justified')}
      >
        &#x2716; J
      </button>
    </div>
  );
}
