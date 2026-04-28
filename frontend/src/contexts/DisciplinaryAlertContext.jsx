import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import request from '../services/api';
import { useAuth } from './AuthContext';
import { hasAnyRole } from '../utils/rbac';

/**
 * DisciplinaryAlertContext
 * Manages fetching and exposing disciplinary meetings for authorized users.
 * 
 * Provides:
 *   - meetings: Array of scheduled upcoming disciplinary meetings
 *   - loading: Boolean indicating fetch in progress
 *   - error: Error message if fetch failed
 *   - refreshMeetings: Async function to manually refresh
 */

const DisciplinaryAlertContext = createContext(null);

export function DisciplinaryAlertProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canReadMeetings = useMemo(
    () => hasAnyRole(user, ['admin', 'enseignant']),
    [user]
  );

  // Fetch meetings for users allowed to read disciplinary endpoints.
  const fetchMeetings = useCallback(async () => {
    if (!canReadMeetings) {
      setMeetings([]);
      setError('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch all meetings; we'll filter client-side for upcoming ones
      // Meeting endpoint returns conseils (councils/meetings)
      const res = await request('/api/v1/disciplinary/meetings');

      const allMeetings = Array.isArray(res?.data) ? res.data : [];

      // Filter for upcoming meetings (status = 'planifie' or 'scheduled')
      // that haven't occurred yet
      const upcomingMeetings = allMeetings.filter((meeting) => {
        const meetingDate = new Date(meeting.dateReunion || meeting.date);
        const now = new Date();

        // Only show future meetings
        return meetingDate > now &&
               (meeting.status === 'planifie' || meeting.status === 'scheduled');
      });

      setMeetings(upcomingMeetings);
    } catch (err) {
      // 401/403 are expected for users without disciplinary access.
      if (err?.status !== 401 && err?.status !== 403) {
        console.warn('Failed to fetch disciplinary meetings:', err?.message);
      }

      setError('');  // Don't show error to user - this is non-critical
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [canReadMeetings]);

  // Initial load on mount
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!canReadMeetings) {
      setMeetings([]);
      setError('');
      return;
    }

    fetchMeetings();
  }, [authLoading, canReadMeetings, fetchMeetings]);

  // Refresh every 5 minutes (auto-poll for new meetings)
  useEffect(() => {
    if (authLoading || !canReadMeetings) {
      return undefined;
    }

    const interval = setInterval(fetchMeetings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [authLoading, canReadMeetings, fetchMeetings]);

  const value = useMemo(
    () => ({
      meetings,
      loading,
      error,
      refreshMeetings: fetchMeetings,
    }),
    [meetings, loading, error, fetchMeetings]
  );

  return (
    <DisciplinaryAlertContext.Provider value={value}>
      {children}
    </DisciplinaryAlertContext.Provider>
  );
}

/**
 * Hook: useDisciplinaryAlerts
 * Access disciplinary meeting alerts from context
 */
export function useDisciplinaryAlerts() {
  const context = useContext(DisciplinaryAlertContext);
  if (!context) {
    throw new Error('useDisciplinaryAlerts must be used within DisciplinaryAlertProvider');
  }
  return context;
}

export default DisciplinaryAlertContext;
