import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const VARIANT_STYLES = {
  success: {
    container: 'border-success/40 bg-success/10 text-success',
    icon: CheckCircle2,
  },
  error: {
    container: 'border-danger/40 bg-danger/10 text-danger',
    icon: AlertTriangle,
  },
};

export default function StatusBanner({ variant = 'success', message, onDismiss, autoDismissMs = 0 }) {
  useEffect(() => {
    if (!autoDismissMs || !onDismiss) return undefined;
    const handle = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(handle);
  }, [autoDismissMs, onDismiss, message]);

  if (!message) return null;

  const config = VARIANT_STYLES[variant] || VARIANT_STYLES.success;
  const Icon = config.icon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${config.container}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-current transition-colors hover:bg-current/10"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
