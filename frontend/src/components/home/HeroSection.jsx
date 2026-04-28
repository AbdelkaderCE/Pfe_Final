import React from 'react';
import { useTranslation } from 'react-i18next';
import heroBg from '../../assets/images/hero-bg.jpg';
import { resolveMediaUrl } from '../../services/api';
import { getLocalizedSetting, useSiteSettings } from '../../contexts/SiteSettingsContext';

/* Inline SVG icons — replaces lucide-react dependency */
const GraduationCapIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75m0 0h-.008v.008H6.75V11.25Z" />
  </svg>
);
const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);
const BookIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);
const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);
const PlayIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();

  const heroBackgroundSource = settings?.heroBackgroundUrl
    ? resolveMediaUrl(settings.heroBackgroundUrl)
    : heroBg;

  const universityName = getLocalizedSetting(settings, 'universityName', i18n.language, 'Ibn Khaldoun University');

  const heroStats = [
    { value: settings?.heroStudentsStat || '2500+', label: t('hero.students') },
    { value: settings?.heroTeachersStat || '150+', label: t('hero.teachers') },
    { value: settings?.heroCoursesStat || '200+', label: t('hero.courses') },
    { value: settings?.heroSatisfactionStat || '98%', label: t('hero.satisfaction') },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image + Overlay */}
      <div className="absolute inset-0">
        <img src={heroBackgroundSource} alt={universityName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Floating decorative icons */}
      <div className="absolute top-20 left-10 animate-pulse" style={{ animationDuration: '3s' }}>
        <GraduationCapIcon className="w-16 h-16 text-white/20" />
      </div>
      <div className="absolute bottom-20 right-10 animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
        <UsersIcon className="w-20 h-20 text-white/20" />
      </div>
      <div className="absolute top-40 right-20 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
        <BookIcon className="w-12 h-12 text-white/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20">
        {/* Badge */}
        <div className="inline-flex items-center rounded-full border border-edge-strong bg-surface/20 px-4 py-2 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
          <span className="text-sm font-medium">{t('hero.badge')}</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="block">{t('hero.title1')}</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
            {t('hero.title2')}
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-white/90 leading-relaxed">
          {t('hero.description')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('home:openLogin'))}
            className="group relative rounded-md border border-edge bg-surface px-6 py-2.5 text-sm font-medium text-ink transition-all duration-150 hover:shadow-card hover:bg-surface-200 focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              {t('common.getStarted')}
              <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            className="group flex items-center rounded-md border border-edge-strong bg-surface/10 px-6 py-2.5 text-sm font-medium text-surface backdrop-blur-sm transition-all duration-150 hover:bg-surface hover:text-ink focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
            onClick={() => window.open('#', '_blank')}
          >
            <PlayIcon className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            {t('common.watchDemo')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {heroStats.map((stat, i) => (
            <div key={i} className="text-center bg-black/20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-white/80 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
        <div className="w-6 h-10 border-2 border-edge-strong rounded-full flex justify-center">
          <div className="w-1 h-2 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
