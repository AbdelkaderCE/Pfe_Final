/*
  Footer — public-facing site footer.
  Converted from friend's TS. FaIcons → inline SVGs, generic grays → tokens.
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/* Social SVG icons */
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9v-2.89h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>
);
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38 8.59 8.59 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.29 3.9A12.14 12.14 0 0 1 3.05 4.87a4.28 4.28 0 0 0 1.32 5.71 4.24 4.24 0 0 1-1.94-.54v.05a4.28 4.28 0 0 0 3.43 4.19 4.3 4.3 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.97A8.59 8.59 0 0 1 2 19.54a12.13 12.13 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0 0 22.46 6z"/></svg>
);
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54A1.75 1.75 0 0 0 1.77 24h20.46A1.75 1.75 0 0 0 24 22.27V1.73A1.75 1.75 0 0 0 22.23 0z"/></svg>
);

const Footer = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { labelKey: 'footer.home', path: '/' },
    { labelKey: 'footer.aboutUs', path: '/about' },
    { labelKey: 'footer.newsEvents', path: '/news' },
    { labelKey: 'footer.registration', path: '/register' },
    { labelKey: 'footer.contactLink', path: '/contact' },
  ];

  return (
    <footer className="bg-ink text-surface-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{t('footer.aboutTitle')}</h3>
            <p className="text-sm leading-relaxed opacity-70 whitespace-pre-line">
              {t('footer.aboutText')}
            </p>
            <p className="text-sm mt-4 opacity-70">
              {t('footer.established')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm opacity-70 hover:opacity-100 hover:text-white transition-colors duration-200">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-3 text-sm opacity-70">
              <li className="flex items-start">
                <span className="inline-block w-20 font-medium text-white/80">{t('footer.phone')}</span>
                <span>+213 555 55 55 55</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-20 font-medium text-white/80">{t('footer.email')}</span>
                <span>info@univ-tiaret.dz</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-20 font-medium text-white/80">{t('footer.address')}</span>
                <span>BP 78, Tiaret 14000, Algeria</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{t('footer.followUs')}</h3>
            <div className="flex space-x-3 rtl:space-x-reverse mb-6">
              {[
                { Icon: FacebookIcon, label: 'Facebook', href: '#' },
                { Icon: TwitterIcon, label: 'Twitter', href: '#' },
                { Icon: LinkedInIcon, label: 'LinkedIn', href: '#' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-brand hover:text-white transition-all duration-200"
                  aria-label={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-edge-subtle text-center text-sm opacity-50">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
