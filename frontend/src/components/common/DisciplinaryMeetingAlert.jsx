import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertCircle, X } from 'lucide-react';

/**
 * DisciplinaryMeetingAlert — High-density meeting notification card
 * Displays: Date, Time, Place with icons; Urgency indicator; Navigation button
 * 
 * Props:
 *   - meeting: { id, date, heure, lieu, conseilId, status, ... }
 *   - onDismiss: (id) => void
 */
function DisciplinaryMeetingAlert({ meeting, onDismiss }) {
  const navigate = useNavigate();
  
  if (!meeting) return null;

  // Parse meeting date/time - try multiple field names
  const dateStr = meeting.dateReunion || meeting.date;
  const timeStr = meeting.heureReunion || meeting.heure || 'TBD';
  const placeStr = meeting.lieu || 'Location TBD';

  if (!dateStr) return null;

  const meetingDate = new Date(dateStr);
  const formattedDate = meetingDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const time = String(timeStr).length > 0 ? timeStr : 'TBD';
  const place = String(placeStr).length > 0 ? placeStr : 'Location TBD';

  // Determine urgency based on days until meeting
  const now = new Date();
  const daysUntil = Math.floor(
    (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysUntil <= 3 && daysUntil >= 0;
  const isPast = daysUntil < 0;

  if (isPast) return null; // Don't show past meetings

  const handleNavigate = () => {
    navigate('/dashboard/disciplinary');
  };

  return (
    <div
      role="alert"
      className="relative flex gap-3 rounded-lg overflow-hidden border border-brand/30 bg-brand/8 dark:bg-brand/12 shadow-sm transition-all hover:shadow-md"
    >
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />

      {/* Urgency indicator badge */}
      {isUrgent && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-warning/30 px-2 py-1 shadow-sm border border-warning/40">
          <AlertCircle className="w-3 h-3 text-warning" />
          <span className="text-xs font-semibold text-warning">URGENT</span>
        </div>
      )}

      {/* Content with left padding for accent */}
      <div className="flex items-start gap-3 flex-1 px-4 py-3 pl-4">
        <Calendar className="w-5 h-5 flex-shrink-0 text-brand mt-0.5" />

        {/* Content: High-density layout */}
        <div className="flex-1 min-w-0 pr-6">
          <p className="font-semibold text-ink text-sm leading-snug">Disciplinary Meeting Scheduled</p>

          {/* Meeting details grid */}
          <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-ink-secondary">
            {/* Date */}
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-brand/60" />
              <span className="truncate">{formattedDate}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-brand/60" />
              <span className="truncate">{time}</span>
            </div>

            {/* Place */}
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand/60" />
              <span className="truncate">{place}</span>
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleNavigate}
            className="mt-3 inline-flex items-center rounded-lg bg-brand text-surface px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:bg-brand-hover hover:shadow-md active:scale-95"
          >
            View Full Details
            <svg className="ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(meeting.id)}
        aria-label="Dismiss meeting alert"
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-300/50 transition mr-2 my-1"
      >
        <X className="w-4 h-4 text-ink-secondary" />
      </button>
    </div>
  );
}

export default DisciplinaryMeetingAlert;
