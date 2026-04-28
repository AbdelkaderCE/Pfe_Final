import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { FileQuestion, Clock, CheckCircle, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-edge rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-ink mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="tabular-nums">
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

function ChartShell({ title, children, className = '' }) {
  return (
    <div className={`bg-surface rounded-xl border border-edge shadow-sm overflow-hidden ${className}`}>
      <h3 className="px-5 py-4 text-sm font-semibold text-ink border-b border-edge">{title}</h3>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PfeStatusCard({ status }) {
  const config = {
    Approved:          { icon: CheckCircle,  color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Approved' },
    'Pending approval': { icon: Clock,        color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Pending Approval' },
    Rejected:          { icon: XCircle,       color: 'text-danger',  bg: 'bg-danger/10',  border: 'border-danger/20',  label: 'Rejected' },
    'Not selected':    { icon: FileQuestion,  color: 'text-ink-tertiary', bg: 'bg-edge/20', border: 'border-edge', label: 'Not Selected' },
  };
  const cfg = config[status] || config['Not selected'];
  const Icon = cfg.icon;

  return (
    <ChartShell title="PFE Status">
      <div className={`flex flex-col items-center justify-center gap-3 py-6 rounded-lg border ${cfg.bg} ${cfg.border}`}>
        <div className={`p-4 rounded-full ${cfg.bg}`}>
          <Icon className={`w-12 h-12 ${cfg.color}`} strokeWidth={1.5} />
        </div>
        <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
      </div>
    </ChartShell>
  );
}

function DisciplinaryCard({ isClean, counts }) {
  if (isClean) {
    return (
      <ChartShell title="Disciplinary Status">
        <div className="flex flex-col items-center justify-center gap-3 py-6 rounded-lg border bg-success/10 border-success/20">
          <div className="p-4 rounded-full bg-success/10">
            <ShieldCheck className="w-12 h-12 text-success" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-bold text-success">Clean Record</p>
          <p className="text-xs text-ink-tertiary">No disciplinary cases</p>
        </div>
      </ChartShell>
    );
  }

  const data = [
    { name: 'Under Review', value: counts.underReview, fill: '#f59e0b' },
    { name: 'Closed',       value: counts.sanctioned,  fill: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <ChartShell title="Disciplinary Status">
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="p-3 rounded-full bg-danger/10 mb-1">
          <ShieldAlert className="w-8 h-8 text-danger" strokeWidth={1.5} />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={64}
              paddingAngle={3}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}

export default function DashboardCharts({ stats }) {
  const kpis   = stats?.kpis   ?? {};
  const charts = stats?.charts ?? {};

  const disciplineCounts = charts?.disciplineCounts ?? { underReview: 0, sanctioned: 0 };
  const isClean =
    charts?.disciplineStatus === 'Clean' ||
    (disciplineCounts.underReview === 0 && disciplineCounts.sanctioned === 0);

  const activityData = useMemo(() => [
    {
      category: 'Justifications',
      Total:   kpis?.justifications?.total   ?? 0,
      Treated: kpis?.justifications?.treated ?? 0,
      Pending: kpis?.justifications?.pending ?? 0,
    },
    {
      category: 'Requests',
      Total:   kpis?.complaints?.total   ?? 0,
      Treated: kpis?.complaints?.treated ?? 0,
      Pending: kpis?.complaints?.pending ?? 0,
    },
  ], [kpis]);

  const hasActivity = activityData.some((d) => d.Total > 0);

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-tertiary px-0.5">
        Charts & Status
      </h2>

      <ChartShell title="Activity Breakdown">
        {hasActivity ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={activityData}
              margin={{ top: 4, right: 16, left: -10, bottom: 0 }}
              barGap={4}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-edge, #e6e8eb)" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12, fill: 'var(--color-ink-secondary, #4b5160)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary, #7c8294)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Total"   fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Treated" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-ink-tertiary">
            No activity recorded yet
          </div>
        )}
      </ChartShell>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PfeStatusCard status={charts?.pfeStatus} />
        <DisciplinaryCard isClean={isClean} counts={disciplineCounts} />
      </div>
    </div>
  );
}
