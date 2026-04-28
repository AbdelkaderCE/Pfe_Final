import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/public/PublicLayout';

/* ── Inline SVG icons ──────────────────────────────────────────── */
const PhoneIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);
const MailIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);
const MapPinIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);
const ClockIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const SendIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

/* ── Contact info cards data ──────────────────────────────────── */
const contactCards = [
  {
    Icon: PhoneIcon,
    titleKey: 'contact.phone',
    lines: ['+213 555 55 55 55', '+213 46 00 00 00'],
    accent: 'from-blue-600 to-blue-400',
  },
  {
    Icon: MailIcon,
    titleKey: 'contact.emailTitle',
    lines: ['info@univ-tiaret.dz', 'contact@univ-tiaret.dz'],
    accent: 'from-green-600 to-green-400',
  },
  {
    Icon: MapPinIcon,
    titleKey: 'contact.addressTitle',
    lines: ['Ibn Khaldoun University', 'Tiaret 14000, Algeria'],
    accent: 'from-orange-600 to-orange-400',
  },
  {
    Icon: ClockIcon,
    titleKey: 'contact.officeHours',
    lines: ['Sun – Thu: 8:00 AM – 4:30 PM', 'Fri – Sat: Closed'],
    accent: 'from-purple-600 to-purple-400',
  },
];

export default function ContactPage() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    // Simulate send — replace with real API call
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-surface-200 to-canvas dark:from-surface dark:to-canvas">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center bg-brand-light rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-brand rounded-full mr-2" />
            <span className="text-sm font-semibold text-brand uppercase tracking-wider">{t('contact.badge')}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-ink mb-6 leading-tight tracking-tight">
            {t('contact.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-hover">
              {t('contact.titleHighlight')}
            </span>
          </h1>

          <p className="text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      {/* ── Contact Cards ─────────────────────────────────────── */}
      <section className="py-16 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactCards.map(({ Icon, titleKey, lines, accent }, i) => (
              <div
                key={i}
                className="bg-surface rounded-lg border border-edge shadow-card p-6 text-center transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shadow-soft`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-ink mb-2">{t(titleKey)}</h3>
                {lines.map((line, j) => (
                  <p key={j} className="text-sm text-ink-secondary">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Map ────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-canvas to-surface-200 dark:from-canvas dark:to-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-surface rounded-lg border border-edge shadow-card p-8">
              <h2 className="text-xl font-bold text-ink mb-2 tracking-tight">{t('contact.formTitle')}</h2>
              <p className="text-sm text-ink-secondary mb-6">
                {t('contact.formSubtitle')}
              </p>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-ink mb-2">{t('contact.messageSent')}</h3>
                  <p className="text-sm text-ink-secondary mb-6">
                    {t('contact.thankYou')}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 bg-brand text-white rounded-md font-medium text-sm hover:bg-brand-hover focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150"
                  >
                    {t('common.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-ink-secondary mb-1">
                      {t('contact.fullName')}
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={formState.name}
                      onChange={handleChange}
                      placeholder={t('contact.fullNamePlaceholder')}
                      className="w-full bg-control-bg border border-control-border rounded-md py-2.5 px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-ink-secondary mb-1">
                      {t('contact.emailAddress')}
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={formState.email}
                      onChange={handleChange}
                      placeholder={t('contact.emailPlaceholder')}
                      className="w-full bg-control-bg border border-control-border rounded-md py-2.5 px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-ink-secondary mb-1">
                      {t('contact.subject')}
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      required
                      value={formState.subject}
                      onChange={handleChange}
                      placeholder={t('contact.subjectPlaceholder')}
                      className="w-full bg-control-bg border border-control-border rounded-md py-2.5 px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-ink-secondary mb-1">
                      {t('contact.message')}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      value={formState.message}
                      onChange={handleChange}
                      placeholder={t('contact.messagePlaceholder')}
                      className="w-full bg-control-bg border border-control-border rounded-md py-2.5 px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full inline-flex items-center justify-center px-6 py-2.5 bg-brand text-white rounded-md font-medium text-sm shadow-soft hover:bg-brand-hover focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('contact.sending')}
                      </>
                    ) : (
                      <>
                        <SendIcon className="w-4 h-4 mr-2" />
                        {t('common.sendMessage')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Map placeholder */}
            <div className="flex flex-col gap-6">
              <div className="bg-surface rounded-lg border border-edge shadow-card overflow-hidden flex-1 min-h-[320px]">
                <iframe
                  title="Ibn Khaldoun University Location"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=1.28%2C35.35%2C1.35%2C35.40&layer=mapnik&marker=35.3753%2C1.3169"
                  className="w-full h-full min-h-[320px] border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              {/* Quick links */}
              <div className="bg-surface rounded-lg border border-edge shadow-card p-6">
                <h3 className="text-base font-semibold text-ink mb-3">{t('contact.quickLinksTitle')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t('contact.quickAboutUs'), to: '/about' },
                    { label: t('contact.quickHome'), to: '/home' },
                    { label: t('contact.quickStudentPortal'), to: '/login' },
                    { label: t('contact.quickNewsEvents'), to: '/actualites' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="text-sm text-ink-secondary hover:text-brand transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-16 bg-surface-200 dark:bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4 tracking-tight">
            {t('contact.ctaTitle')}
          </h2>
          <p className="text-ink-secondary mb-6">
            {t('contact.ctaSubtitle')}
          </p>
          <Link
            to="/about"
            className="inline-flex items-center px-6 py-2.5 bg-brand text-white rounded-md font-medium text-sm shadow-soft hover:bg-brand-hover focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-150"
          >
            {t('contact.ctaButton')}
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
