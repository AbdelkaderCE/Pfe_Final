import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bannerBg from '../../assets/images/computer.jpg';
import { resolveMediaUrl } from '../../services/api';
import { getLocalizedSetting, useSiteSettings } from '../../contexts/SiteSettingsContext';

/* Inline SVG icons */
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
const AwardIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A3.375 3.375 0 0 0 13.125 10.875h-2.25A3.375 3.375 0 0 0 7.5 14.25v4.5m9 0H7.5m4.5-12a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75Z" />
  </svg>
);

export default function BannerSection() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();

  const bannerBackgroundSource = settings?.bannerBackgroundUrl
    ? resolveMediaUrl(settings.bannerBackgroundUrl)
    : bannerBg;

  const universityName = getLocalizedSetting(settings, 'universityName', i18n.language, t('banner.universityName'));

  const statCards = [
    { Icon: GraduationCapIcon, value: settings?.bannerStudentsStat || '28K+', labelKey: 'banner.students' },
    { Icon: UsersIcon, value: settings?.bannerTeachersStat || '1.1K+', labelKey: 'banner.teachersStat' },
    { Icon: BookIcon, value: settings?.bannerFacultiesStat || '8', labelKey: 'banner.faculties' },
    { Icon: AwardIcon, value: settings?.bannerNationalRankStat || '15th', labelKey: 'banner.nationalRank' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={bannerBackgroundSource} alt={universityName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className="bg-black/10 backdrop-blur-[2px] p-8 rounded-2xl text-white">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {t('banner.welcome')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                {universityName}
              </span>
            </h2>
            <p className="text-xl mb-8 text-white/90 leading-relaxed">
              {t('banner.description')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/login"
                className="rounded-md border border-edge bg-surface px-6 py-2.5 font-medium text-ink transition-all duration-150 hover:shadow-card hover:bg-surface-200 focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
              >
                {t('common.applyNow')}
              </Link>
              <a
                href="#features"
                className="rounded-md border border-edge-strong bg-surface/10 px-6 py-2.5 font-medium text-surface transition-all duration-150 hover:bg-surface hover:text-ink focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-canvas"
              >
                {t('common.learnMore')}
              </a>
            </div>
          </div>

          {/* Right — Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map(({ Icon, value, labelKey: label }, i) => (
              <div
                key={i}
                className="rounded-lg border border-edge-strong bg-black/10 p-6 text-center backdrop-blur-[2px] transition-all duration-200 hover:bg-black/20"
              >
                <Icon className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
                <div className="text-3xl font-bold text-white">{value}</div>
                <div className="text-sm text-white/80">{t(label)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
