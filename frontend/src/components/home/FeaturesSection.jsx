import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/* ── Inline SVG icons ──────────────────────────────────────────── */
const icons = {
  Users: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>,
  BookOpen: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,
  GraduationCap: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75" /></svg>,
  FileText: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
  Clock: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  Shield: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>,
  MessageSquare: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>,
  BarChart: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
  ChevronRight: (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>,
};

const features = [
  {
    icon: 'Users', titleKey: 'features.studentPortal',
    descKey: 'features.studentPortalDesc',
    gradient: 'from-blue-600 to-blue-400', stats: '2,500+',
    benefitKeys: ['features.benefitGradeUpdates', 'features.benefitMessaging', 'features.benefitSubmission'],
    benefits: ['Real-time grade updates', 'Direct messaging', 'Project submission'],
  },
  {
    icon: 'BookOpen', titleKey: 'features.courseManagement',
    descKey: 'features.courseManagementDesc',
    gradient: 'from-orange-600 to-orange-400', stats: '150+',
    benefits: ['Lesson planning', 'Assignment grading', 'Resource library'],
  },
  {
    icon: 'GraduationCap', titleKey: 'features.graduationProjects',
    descKey: 'features.graduationProjectsDesc',
    gradient: 'from-green-600 to-green-400', stats: '500+',
    benefits: ['Supervisor assignment', 'Progress tracking', 'Online defense'],
  },
  {
    icon: 'FileText', titleKey: 'features.disciplinaryCommittee',
    descKey: 'features.disciplinaryCommitteeDesc',
    gradient: 'from-purple-600 to-purple-400', stats: '95%',
    benefits: ['Case tracking', 'Hearing scheduling', 'Decision documentation'],
  },
  {
    icon: 'Clock', titleKey: 'features.realTimeUpdates',
    descKey: 'features.realTimeUpdatesDesc',
    gradient: 'from-yellow-600 to-yellow-400', stats: '⚡',
    benefits: ['Push notifications', 'Email alerts', 'Calendar integration'],
  },
  {
    icon: 'Shield', titleKey: 'features.secureSystem',
    descKey: 'features.secureSystemDesc',
    gradient: 'from-indigo-600 to-indigo-400', stats: '🔒',
    benefits: ['Role-based access', 'Data encryption', 'Audit logs'],
  },
  {
    icon: 'MessageSquare', titleKey: 'features.communicationHub',
    descKey: 'features.communicationHubDesc',
    gradient: 'from-pink-600 to-pink-400', stats: '10k+',
    benefits: ['Group chats', 'Announcements', 'Private messaging'],
  },
  {
    icon: 'BarChart', titleKey: 'features.analyticsDashboard',
    descKey: 'features.analyticsDashboardDesc',
    gradient: 'from-teal-600 to-teal-400', stats: '📊',
    benefits: ['Performance tracking', 'Trend analysis', 'Export reports'],
  },
];

export default function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { t } = useTranslation();

  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-surface to-surface-200 dark:from-canvas dark:to-surface relative overflow-hidden"
    >
      {/* Decorative blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-edge) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-brand-light rounded-full px-4 py-2 mb-4">
            <span className="w-2 h-2 bg-brand rounded-full mr-2" />
            <span className="text-sm font-semibold text-brand uppercase tracking-wider">
              {t('features.badge')}
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6">
            {t('features.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-hover">
              {t('features.titleHighlight')}
            </span>
          </h2>

          <p className="text-xl text-ink-secondary max-w-3xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, index) => {
            const Icon = icons[f.icon];
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={`
                    relative bg-surface dark:bg-surface-100 rounded-lg p-6
                    border border-edge-subtle
                    transition-all duration-200 ease-out
                    ${isHovered ? 'shadow-card -translate-y-1' : 'shadow-soft hover:shadow-card'}
                  `}
                >
                  {/* Icon + stats */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-soft transition-transform duration-200 ${isHovered ? 'scale-105' : ''}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-surface-200 dark:bg-surface-300 text-ink-tertiary text-xs font-medium rounded-full">
                      {f.stats}
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-xl font-bold text-ink mb-2">{t(f.titleKey)}</h3>
                  <p className="text-ink-secondary mb-4 text-sm leading-relaxed">{t(f.descKey)}</p>

                  {/* Benefits */}
                  <div className="space-y-2 mb-4">
                    {f.benefits.map((b, idx) => (
                      <div key={idx} className="flex items-center text-sm text-ink-tertiary">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${f.gradient} mr-2 shrink-0`} />
                        {b}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-edge-subtle">
                    <span className="text-sm font-medium text-ink-muted">
                      Feature {index + 1}/{features.length}
                    </span>
                    <button
                      className={`flex items-center text-sm font-medium transition-all duration-150 ${
                        isHovered ? 'text-brand' : 'text-ink-muted'
                      }`}
                    >
                      {t('common.learnMore')}
                      <icons.ChevronRight
                        className={`w-4 h-4 ml-1 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Hover overlay */}
                  <div
                    className={`absolute inset-0 rounded-lg bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200 pointer-events-none`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="group relative inline-flex items-center px-6 py-2.5 bg-brand text-white rounded-md font-medium text-sm overflow-hidden shadow-soft hover:shadow-card focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150">
            <span className="relative z-10 flex items-center">
              Explore All Features
              <icons.ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-brand-hover opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          </button>
        </div>
      </div>
    </section>
  );
}
