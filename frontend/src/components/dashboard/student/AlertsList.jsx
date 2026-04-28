import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function AlertsList({ alerts = [] }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-brand" />;
    }
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'danger':
        return 'bg-danger/10 border-danger/20 text-danger';
      case 'success':
        return 'bg-success/10 border-success/20 text-success';
      case 'info':
      default:
        return 'bg-brand/10 border-brand/20 text-brand';
    }
  };

  return (
    <section className="mb-6 space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-4 border rounded-lg shadow-sm ${getAlertStyles(alert.type)}`}
        >
          <div className="shrink-0 mt-0.5">
            {getAlertIcon(alert.type)}
          </div>
          <div>
            <p className="text-sm font-medium">{alert.message}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
