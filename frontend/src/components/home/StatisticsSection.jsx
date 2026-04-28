import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedSetting, useSiteSettings } from '../../contexts/SiteSettingsContext';

/* Inline SVG icons */
const UsersIcon = (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>;
const BookIcon = (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>;
const AwardIcon = (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A3.375 3.375 0 0 0 13.125 10.875h-2.25A3.375 3.375 0 0 0 7.5 14.25v4.5m9 0H7.5m4.5-12a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z" /></svg>;
const BuildingIcon = (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m4.5-18v18m4.5-18v18m4.5-18v18m3-18v18M5.25 3h13.5M5.25 21h13.5M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6.75H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const TrendingUpIcon = (p) => <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>;
const StarIcon = (p) => <svg {...p} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;

const parseStatString = (rawValue, fallbackValue, fallbackSuffix = '') => {
  const sourceValue = String(rawValue || '').trim();
  const matched = sourceValue.match(/(\d+(?:\.\d+)?)(.*)/);

  if (!matched) {
    return { value: fallbackValue, suffix: fallbackSuffix };
  }

  const numeric = Number(matched[1]);
  if (!Number.isFinite(numeric)) {
    return { value: fallbackValue, suffix: fallbackSuffix };
  }

  return {
    value: Math.round(numeric),
    suffix: matched[2] || fallbackSuffix,
  };
};

function Counter({ end, suffix = '', duration = 2000, isVisible }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, isVisible]);

  return <>{count}{suffix}</>;
}

export default function StatisticsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();

  const parsedStudents = parseStatString(settings?.statisticsStudentsStat, 2500, '+');
  const parsedTeachers = parseStatString(settings?.statisticsTeachersStat, 150, '+');
  const parsedProjects = parseStatString(settings?.statisticsProjectsStat, 500, '+');
  const parsedSatisfaction = parseStatString(settings?.statisticsSatisfactionStat, 98, '%');

  const stats = [
    { Icon: UsersIcon, value: parsedStudents.value, suffix: parsedStudents.suffix, labelKey: 'statistics.students' },
    { Icon: BookIcon, value: parsedTeachers.value, suffix: parsedTeachers.suffix, labelKey: 'statistics.teachers' },
    { Icon: AwardIcon, value: parsedProjects.value, suffix: parsedProjects.suffix, labelKey: 'statistics.projects' },
    { Icon: BuildingIcon, value: parsedSatisfaction.value, suffix: parsedSatisfaction.suffix, labelKey: 'statistics.satisfaction' },
  ];

  const statisticsQuote = getLocalizedSetting(settings, 'statisticsQuote', i18n.language, 'Empowering education through technology');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 overflow-hidden bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface dark:to-surface-300"
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-ink-muted) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Animated orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-ink-muted/50 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center text-ink mb-16">
          <div className="inline-flex items-center bg-surface/80 dark:bg-surface-200/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-edge">
            <TrendingUpIcon className="w-4 h-4 mr-2 text-ink-secondary" />
            <span className="text-sm font-medium text-ink-secondary">{t('statistics.badge')}</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('statistics.title')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-dark">
              {t('statistics.titleHighlight')}
            </span>
          </h2>

          <p className="text-xl text-ink-secondary max-w-2xl mx-auto">
            {t('statistics.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const { Icon } = stat;
            return (
              <div key={index} className="group relative">
                <div className="relative bg-surface/80 dark:bg-surface-100/80 backdrop-blur-sm rounded-lg p-8 text-center transition-all duration-200 border border-edge shadow-card">
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-gradient-to-br from-brand to-brand-hover p-4 shadow-soft group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-full h-full text-white" />
                  </div>

                  {/* Value */}
                  <div className="text-4xl md:text-5xl font-bold text-ink mb-2">
                    <Counter end={stat.value} suffix={stat.suffix} isVisible={isVisible} />
                  </div>

                  {/* Label */}
                  <div className="text-ink-secondary font-medium mb-4">{t(stat.labelKey)}</div>

                  {/* Stars for satisfaction */}
                  {stat.labelKey === 'statistics.satisfaction' && (
                    <div className="flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                      ))}
                    </div>
                  )}

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-16 h-1 bg-gradient-to-r from-brand to-brand-hover rounded-full transition-all duration-200" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom quote */}
        <div className="text-center mt-16">
          <p className="text-ink-secondary text-lg italic border-l-4 border-brand pl-4 inline-block">
            "{statisticsQuote}"
          </p>
        </div>
      </div>
    </section>
  );
}
