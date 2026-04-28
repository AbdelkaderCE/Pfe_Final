import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info, OctagonAlert, X } from 'lucide-react';
import { alertsAPI } from '../../services/api';
import DisciplinaryMeetingAlert from './DisciplinaryMeetingAlert';
import { useDisciplinaryAlerts } from '../../contexts/DisciplinaryAlertContext';

const DISMISS_STORAGE_KEY = 'dismissedAlerts';
const DISMISS_MEETING_STORAGE_KEY = 'dismissedMeetingAlerts';

const LEVEL_STYLES = {
  info: {
    container: 'bg-brand/8 dark:bg-brand/12 border border-brand/30 text-ink',
    accentStripe: 'bg-brand',
    icon: Info,
    iconClass: 'text-brand',
    title: 'text-ink font-semibold',
  },
  warning: {
    container: 'bg-warning/8 dark:bg-warning/12 border border-warning/30 text-ink',
    accentStripe: 'bg-warning',
    icon: AlertTriangle,
    iconClass: 'text-warning',
    title: 'text-ink font-semibold',
  },
  critical: {
    container: 'bg-danger/8 dark:bg-danger/12 border border-danger/30 text-ink',
    accentStripe: 'bg-danger',
    icon: OctagonAlert,
    iconClass: 'text-danger',
    title: 'text-ink font-semibold',
  },
};

function readDismissed(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistDismissed(key, set) {
  try {
    sessionStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* storage quota exceeded — dismissal is best-effort */
  }
}

/**
 * EnhancedAlertBanner — Unified alert display
 * Shows both system alerts + disciplinary meeting alerts
 * All colors use platform tokens for dark mode support
 */
const EnhancedAlertBanner = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => readDismissed(DISMISS_STORAGE_KEY));
  const [dismissedMeetings, setDismissedMeetings] = useState(() =>
    readDismissed(DISMISS_MEETING_STORAGE_KEY)
  );

  // Fetch system alerts
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await alertsAPI.getActive();
        if (!cancelled && Array.isArray(res?.data)) {
          setAlerts(res.data);
        }
      } catch {
        if (!cancelled) setAlerts([]);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Get disciplinary meeting alerts from context
  const { meetings: disciplinaryMeetings } = useDisciplinaryAlerts();

  // Filter visible system alerts
  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !dismissed.has(alert.id)),
    [alerts, dismissed]
  );

  // Filter visible meeting alerts
  const visibleMeetings = useMemo(
    () => disciplinaryMeetings.filter((meeting) => !dismissedMeetings.has(meeting.id)),
    [disciplinaryMeetings, dismissedMeetings]
  );

  if (!visibleAlerts.length && !visibleMeetings.length) return null;

  const handleDismissAlert = (id) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    persistDismissed(DISMISS_STORAGE_KEY, next);
  };

  const handleDismissMeeting = (id) => {
    const next = new Set(dismissedMeetings);
    next.add(id);
    setDismissedMeetings(next);
    persistDismissed(DISMISS_MEETING_STORAGE_KEY, next);
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Meeting alerts first (higher priority) */}
      {visibleMeetings.map((meeting) => (
        <DisciplinaryMeetingAlert
          key={`meeting-${meeting.id}`}
          meeting={meeting}
          onDismiss={handleDismissMeeting}
        />
      ))}

      {/* System alerts */}
      {visibleAlerts.map((alert) => {
        const style = LEVEL_STYLES[alert.level] || LEVEL_STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={alert.id}
            role="alert"
            className={`relative flex items-start gap-3 rounded-lg overflow-hidden transition-all hover:shadow-md ${style.container}`}
          >
            {/* Accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accentStripe}`} />
            
            {/* Content with left padding for accent */}
            <div className="flex items-start gap-3 flex-1 px-4 py-3 pl-4">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconClass}`} />
              <div className="flex-1">
                <p className={style.title}>{alert.titre}</p>
                <p className="text-sm text-ink-secondary mt-0.5 whitespace-pre-wrap">{alert.message}</p>
              </div>
            </div>
            
            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => handleDismissAlert(alert.id)}
              aria-label="Dismiss alert"
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-300/50 transition mr-2 my-1"
            >
              <X className="w-4 h-4 text-ink-secondary" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EnhancedAlertBanner;
