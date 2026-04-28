/*
  HistorySection — timeline + stats for the About page.
  Converted from friend's TS. lucide-react → inline SVGs, generic grays → tokens.
*/

import React from 'react';

/* Inline SVG icons (stroke 1.5) */
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
  </svg>
);
const AwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const milestones = [
  { year: 1980, event: 'University Founded', description: 'Ibn Khaldoun University was established', Icon: CalendarIcon },
  { year: 1985, event: 'First Graduates', description: 'First batch of students graduated', Icon: UsersIcon },
  { year: 2000, event: 'Faculty Expansion', description: 'Expanded to 8 faculties', Icon: BuildingIcon },
  { year: 2010, event: 'Research Center', description: 'Research center opened', Icon: AwardIcon },
];

const stats = [
  { value: '28K+', label: 'Students' },
  { value: '1.1K+', label: 'Faculty' },
  { value: '8', label: 'Faculties' },
  { value: '50+', label: 'Programs' },
];

const HistorySection = () => {
  return (
    <section className="py-20 bg-surface">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — text + stats */}
          <div>
            <h2 className="text-4xl font-bold text-ink mb-6 tracking-tight">
              Our <span className="text-ink-secondary">History</span>
            </h2>
            <p className="text-lg text-ink-secondary mb-8">
              Ibn Khaldoun University – Tiaret has grown into one of Algeria's leading academic institutions.
            </p>

            <div className="grid grid-cols-2 gap-5">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-surface-200 rounded-xl p-6 border border-edge text-center"
                >
                  <div className="text-3xl font-bold text-ink mb-2">{stat.value}</div>
                  <div className="text-sm text-ink-secondary">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — milestone timeline */}
          <div className="space-y-6">
            {milestones.map((item, index) => {
              const { Icon } = item;
              return (
                <div
                  key={index}
                  className="flex items-start gap-5 p-6 bg-surface border border-edge rounded-xl shadow-soft hover:shadow-card transition-all"
                >
                  <div className="w-14 h-14 bg-surface-200 rounded-lg flex items-center justify-center text-ink-secondary shrink-0">
                    <Icon />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-brand">{item.year}</span>
                    <h3 className="text-lg font-semibold text-ink">{item.event}</h3>
                    <p className="text-sm text-ink-secondary mt-1">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
