import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/public/PublicLayout';
import studentsImg from '../assets/images/Students.jpg';
import profImg from '../assets/images/prof.jpg';

const ibnKhaldounImg = '/web-app-manifest-512x512.png';

/* ── Inline SVG icons ──────────────────────────────────────────── */
const BookIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);
const UsersIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);
const BuildingIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m4.5-18v18m4.5-18v18m4.5-18v18m3-18v18M5.25 3h13.5M5.25 21h13.5M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6.75H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const GraduationCapIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  </svg>
);
const LightbulbIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
  </svg>
);
const GlobeIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.257.26-2.455.727-3.541" />
  </svg>
);
const ArrowRightIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);
const CheckIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

/* ── Data ──────────────────────────────────────────────────────── */
const stats = [
  { Icon: UsersIcon, value: '28,000+', labelKey: 'about.statStudents' },
  { Icon: BookIcon, value: '1,100+', labelKey: 'about.statFaculty' },
  { Icon: BuildingIcon, value: '8', labelKey: 'about.statFaculties' },
  { Icon: GraduationCapIcon, value: '44+', labelKey: 'about.statYears' },
];

const values = [
  {
    Icon: TargetIcon,
    titleKey: 'about.valueExcellence',
    descKey: 'about.valueExcellenceDesc',
  },
  {
    Icon: LightbulbIcon,
    titleKey: 'about.valueInnovation',
    descKey: 'about.valueInnovationDesc',
  },
  {
    Icon: GlobeIcon,
    titleKey: 'about.valueCommunity',
    descKey: 'about.valueCommunityDesc',
  },
];

const timeline = [
  { year: '1980', titleKey: 'about.timeline1980Title', descKey: 'about.timeline1980Desc' },
  { year: '1992', titleKey: 'about.timeline1992Title', descKey: 'about.timeline1992Desc' },
  { year: '2005', titleKey: 'about.timeline2005Title', descKey: 'about.timeline2005Desc' },
  { year: '2015', titleKey: 'about.timeline2015Title', descKey: 'about.timeline2015Desc' },
  { year: '2024', titleKey: 'about.timeline2024Title', descKey: 'about.timeline2024Desc' },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-surface-200 to-canvas dark:from-surface dark:to-canvas">
        {/* Decorative blur */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center bg-brand-light rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-brand rounded-full mr-2" />
                <span className="text-sm font-semibold text-brand uppercase tracking-wider">{t('about.badge')}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-ink mb-6 leading-tight tracking-tight">
                {t('about.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-hover">
                  {t('about.titleHighlight')}
                </span>
              </h1>

              <p className="text-lg text-ink-secondary leading-relaxed mb-6">
                {t('about.subtitle')}
              </p>

              <p className="text-base text-ink-tertiary leading-relaxed mb-8">
                {t('about.subtitleSecondary')}
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center px-6 py-2.5 bg-brand text-white rounded-md font-medium text-sm shadow-soft hover:bg-brand-hover focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150"
              >
                {t('about.getInTouch')}
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </Link>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-card border border-edge">
                <img
                  src={ibnKhaldounImg}
                  alt={t('about.captionMainCampus')}
                  className="w-full max-w-sm lg:max-w-md mx-auto object-contain"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-4 bg-surface rounded-lg shadow-card border border-edge p-4 hidden md:block">
                <div className="text-2xl font-bold text-brand">44+</div>
                <div className="text-sm text-ink-secondary font-medium">{t('about.yearsOfExcellence')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="py-16 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ Icon, value, labelKey }, i) => (
              <div
                key={i}
                className="bg-surface rounded-lg border border-edge shadow-card p-6 text-center transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-brand-light flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                <div className="text-2xl font-bold text-ink mb-1">{value}</div>
                <div className="text-sm font-medium text-ink-secondary">{t(labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ──────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-canvas to-surface-200 dark:from-canvas dark:to-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-surface rounded-lg border border-edge shadow-card p-8">
              <div className="w-12 h-12 rounded-lg bg-brand-light flex items-center justify-center mb-4">
                <TargetIcon className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink mb-4 tracking-tight">{t('about.missionTitle')}</h2>
              <p className="text-ink-secondary leading-relaxed mb-4">
                {t('about.missionText')}
              </p>
              <ul className="space-y-2">
                {[t('about.missionPoint1'), t('about.missionPoint2'), t('about.missionPoint3')].map((item, i) => (
                  <li key={i} className="flex items-center text-sm text-ink-secondary">
                    <CheckIcon className="w-4 h-4 text-brand mr-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision */}
            <div className="bg-surface rounded-lg border border-edge shadow-card p-8">
              <div className="w-12 h-12 rounded-lg bg-brand-light flex items-center justify-center mb-4">
                <LightbulbIcon className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink mb-4 tracking-tight">{t('about.visionTitle')}</h2>
              <p className="text-ink-secondary leading-relaxed mb-4">
                {t('about.visionText')}
              </p>
              <ul className="space-y-2">
                {[t('about.visionPoint1'), t('about.visionPoint2'), t('about.visionPoint3')].map((item, i) => (
                  <li key={i} className="flex items-center text-sm text-ink-secondary">
                    <CheckIcon className="w-4 h-4 text-brand mr-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────── */}
      <section className="py-20 bg-surface-200 dark:bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4 tracking-tight">{t('about.valuesTitle')}</h2>
            <p className="text-lg text-ink-secondary max-w-2xl mx-auto">
              {t('about.valuesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map(({ Icon, titleKey, descKey }, i) => (
              <div
                key={i}
                className="bg-surface rounded-lg border border-edge shadow-card p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-soft">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-semibold text-ink mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ──────────────────────────────────────────── */}
      <section className="py-20 bg-canvas">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4 tracking-tight">{t('about.historyTitle')}</h2>
            <p className="text-lg text-ink-secondary">
              {t('about.historySubtitle')}
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-edge" />

            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div
                  key={i}
                  className={`relative flex items-start gap-8 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand border-2 border-surface z-10" />

                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="bg-surface rounded-lg border border-edge shadow-card p-6 transition-all duration-200 hover:-translate-y-0.5">
                      <span className="inline-block text-sm font-semibold text-brand mb-2">{item.year}</span>
                      <h3 className="text-base font-semibold text-ink mb-2">{t(item.titleKey)}</h3>
                      <p className="text-sm text-ink-secondary leading-relaxed">{t(item.descKey)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Campus Gallery ────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-canvas to-surface-200 dark:from-canvas dark:to-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4 tracking-tight">{t('about.campusLifeTitle')}</h2>
            <p className="text-lg text-ink-secondary max-w-2xl mx-auto">
              {t('about.campusLifeSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: ibnKhaldounImg, alt: t('about.captionMainCampus'), caption: t('about.captionMainCampus') },
              { src: studentsImg, alt: t('about.captionStudentLife'), caption: t('about.captionStudentLife') },
              { src: profImg, alt: t('about.captionFaculty'), caption: t('about.captionFaculty') },
            ].map((img, i) => (
              <div key={i} className="group relative rounded-lg overflow-hidden shadow-card border border-edge">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-64 object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-sm font-medium text-white">{img.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-20 bg-surface-200 dark:bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4 tracking-tight">
            {t('about.ctaTitle')}
          </h2>
          <p className="text-lg text-ink-secondary mb-8">
            {t('about.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-brand text-white rounded-md font-medium text-sm shadow-soft hover:bg-brand-hover focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150"
            >
              {t('about.ctaContact')}
              <ArrowRightIcon className="ml-2 w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-surface text-ink-secondary border border-edge rounded-md font-medium text-sm hover:bg-surface-200 focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150"
            >
              {t('about.ctaPortal')}
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
