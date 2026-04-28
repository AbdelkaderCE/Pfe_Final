import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from '../../services/api';
import { getLocalizedSetting, useSiteSettings } from '../../contexts/SiteSettingsContext';

export default function PublicNavbar() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [imageError, setImageError] = useState(false);
  const location = useLocation();

  const universityName = getLocalizedSetting(settings, 'universityName', i18n.language, 'Ibn Khaldoun University');
  const universitySubtitle = getLocalizedSetting(settings, 'universitySubtitle', i18n.language, 'University');
  const city = getLocalizedSetting(settings, 'city', i18n.language, 'Tiaret');
  const logoUrl = settings?.logoUrl ? resolveMediaUrl(settings.logoUrl) : '/Logo.png';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: t('navbar.home'), path: '/home' },
    { name: t('nav.actualites'), path: '/actualites' },
    { name: t('nav.requests'), path: '/requests' },
    { name: t('navbar.about'), path: '/about' },
    { name: t('navbar.contact'), path: '/contact' },
  ];

  const languageOptions = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
  ];

  const activeLang = languageOptions.find((lang) => i18n.language?.startsWith(lang.code))?.code || 'en';

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-surface/95 backdrop-blur-md shadow-card py-2 border-b border-edge'
          : 'bg-surface py-4 border-b border-edge-subtle'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-3 rtl:space-x-reverse group">
            {!imageError ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt={universityName}
                  className="h-12 w-auto object-contain rounded-lg relative z-10"
                  onError={() => setImageError(true)}
                />
                <div className="absolute -inset-1 bg-brand/10 rounded-lg blur-md group-hover:bg-brand/20 transition-all duration-300" />
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-ink">{universityName}</span>
                <span className="text-xs text-ink-tertiary">{universitySubtitle}</span>
              </div>
            )}

            {!imageError && (
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold text-ink leading-tight">
                  {universityName}
                </span>
                <span className="text-xs text-ink-tertiary">{universitySubtitle} — {city}</span>
              </div>
            )}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `font-medium transition-colors duration-150 relative group ${
                  isActive
                    ? 'text-brand'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    <span
                      className={`absolute -bottom-0.5 left-0 rtl:left-auto rtl:right-0 h-0.5 bg-brand transition-all duration-150 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}

            <div className="flex items-center bg-surface-200 border border-edge rounded-md p-0.5">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    activeLang === lang.code
                      ? 'bg-brand text-white'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <Link
              to="/home?login=1"
              className="bg-brand text-white px-4 py-2.5 rounded-md hover:bg-brand-hover transition-all duration-150 hover:shadow-card font-medium text-sm focus:ring-2 focus:ring-brand/30 focus:ring-offset-2"
            >
              {t('common.signIn')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-ink-secondary hover:text-ink focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              /* X icon */
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-200 ease-in-out ${
            isOpen ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="bg-surface-200 rounded-lg shadow-card p-4 space-y-2 border border-edge">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `block px-4 py-3 rounded-md transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-light text-brand font-semibold'
                    : 'text-ink-secondary hover:bg-surface-300 hover:text-ink'
                }`}
              >
                {link.name}
              </NavLink>
            ))}
            <div className="px-4 pt-1 pb-2 flex items-center gap-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    activeLang === lang.code
                      ? 'bg-brand text-white'
                      : 'bg-surface-300 text-ink-secondary hover:text-ink'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <Link
              to="/home?login=1"
              className="block px-4 py-3 bg-brand text-white rounded-md hover:bg-brand-hover transition-all duration-150 text-center font-medium"
            >
              {t('common.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
