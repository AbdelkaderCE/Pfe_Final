import React from 'react';
import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function StatCard({ title, value, subtitle, icon: Icon, accent = 'brand' }) {
  const tones = {
    brand:   { bg: 'bg-brand/10',   text: 'text-brand' },
    success: { bg: 'bg-success/10', text: 'text-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning' },
    danger:  { bg: 'bg-danger/10',  text: 'text-danger' },
    ink:     { bg: 'bg-edge/30',    text: 'text-ink' },
  };
  const tone = tones[accent] || tones.brand;

  return (
    <div className="bg-surface rounded-xl border border-edge shadow-sm p-5 flex items-start gap-4 transition-shadow hover:shadow-md">
      <div className={`p-3 rounded-full flex-shrink-0 ${tone.bg}`}>
        <Icon className={`w-5 h-5 ${tone.text}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide font-semibold text-ink-tertiary">{title}</p>
        <p className="text-2xl font-bold text-ink mt-1 tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-xs text-ink-secondary mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function KPICards({ stats }) {
  if (!stats?.kpis) return null;

  const { justifications, complaints } = stats.kpis;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-tertiary px-0.5">
        Activity Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Justifications"
          value={justifications?.total ?? 0}
          subtitle={`${justifications?.pending ?? 0} pending · ${justifications?.treated ?? 0} treated`}
          icon={FileText}
          accent="brand"
        />
        <StatCard
          title="Treated Justifications"
          value={justifications?.treated ?? 0}
          subtitle="Reviewed and closed"
          icon={CheckCircle}
          accent="success"
        />
        <StatCard
          title="Pending Justifications"
          value={justifications?.pending ?? 0}
          subtitle="Awaiting review"
          icon={Clock}
          accent="warning"
        />
        <StatCard
          title="Total Requests"
          value={complaints?.total ?? 0}
          subtitle={`${complaints?.pending ?? 0} pending · ${complaints?.treated ?? 0} treated`}
          icon={AlertCircle}
          accent="brand"
        />
        <StatCard
          title="Treated Requests"
          value={complaints?.treated ?? 0}
          subtitle="Resolved"
          icon={CheckCircle}
          accent="success"
        />
        <StatCard
          title="Pending Requests"
          value={complaints?.pending ?? 0}
          subtitle="Awaiting response"
          icon={Clock}
          accent="danger"
        />
      </div>
    </div>
  );
}
