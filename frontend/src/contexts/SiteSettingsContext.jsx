import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { siteSettingsAPI } from '../services/api';

const SiteSettingsContext = createContext(null);

export const DEFAULT_SITE_SETTINGS = {
  universityNameAr: 'جامعة ابن خلدون',
  universityNameEn: 'Ibn Khaldoun University',
  universityNameFr: 'Université Ibn Khaldoun',
  universitySubtitleAr: 'كلية الرياضيات والإعلام الآلي',
  universitySubtitleEn: 'Faculty of Mathematics and Computer Science',
  universitySubtitleFr: "Faculté des Mathématiques et d'Informatique",
  cityAr: 'تيارت',
  cityEn: 'Tiaret',
  cityFr: 'Tiaret',
  heroStudentsStat: '2500+',
  heroTeachersStat: '150+',
  heroCoursesStat: '200+',
  heroSatisfactionStat: '98%',
  bannerStudentsStat: '28K+',
  bannerTeachersStat: '1.1K+',
  bannerFacultiesStat: '8',
  bannerNationalRankStat: '15th',
  statisticsStudentsStat: '2500+',
  statisticsTeachersStat: '150+',
  statisticsProjectsStat: '500+',
  statisticsSatisfactionStat: '98%',
  statisticsQuoteAr: 'تمكين التعليم عبر التكنولوجيا',
  statisticsQuoteEn: 'Empowering education through technology',
  statisticsQuoteFr: "Autonomiser l'éducation grâce à la technologie",
  aboutLine1Ar: 'جامعة ابن خلدون - تيارت، كلية الرياضيات والإعلام الآلي',
  aboutLine1En: 'Ibn Khaldoun University - Tiaret, Faculty of Mathematics and Computer Science',
  aboutLine1Fr: "Université Ibn Khaldoun - Tiaret, Faculté des Mathématiques et d'Informatique",
  aboutLine2Ar: 'تأسست سنة 1980 ومكرسة للتميز في التعليم والبحث العلمي.',
  aboutLine2En: 'Established in 1980, dedicated to excellence in education and research.',
  aboutLine2Fr: "Fondée en 1980, dédiée à l'excellence en enseignement et en recherche.",
  contactPhone: '+213 555 55 55 55',
  contactEmail: 'info@univ-tiaret.dz',
  contactAddressAr: 'تيارت، الجزائر',
  contactAddressEn: 'Tiaret, Algeria',
  contactAddressFr: 'Tiaret, Algérie',
  logoUrl: null,
  heroBackgroundUrl: null,
  bannerBackgroundUrl: null,
};

const LANG_TO_SUFFIX = {
  ar: 'Ar',
  fr: 'Fr',
  en: 'En',
};

const normalizeLang = (language) => {
  const normalized = String(language || 'en').toLowerCase();
  if (normalized.startsWith('ar')) {
    return 'ar';
  }
  if (normalized.startsWith('fr')) {
    return 'fr';
  }
  return 'en';
};

export const getLocalizedSetting = (settings, keyRoot, language, fallbackValue = '') => {
  const lang = normalizeLang(language);
  const suffix = LANG_TO_SUFFIX[lang];

  const localizedValue = settings?.[`${keyRoot}${suffix}`];
  if (localizedValue) {
    return localizedValue;
  }

  return (
    settings?.[`${keyRoot}En`] ||
    settings?.[`${keyRoot}Fr`] ||
    settings?.[`${keyRoot}Ar`] ||
    fallbackValue
  );
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const response = await siteSettingsAPI.getPublic();
        const remoteSettings = response?.data || {};

        if (!isCancelled) {
          setSettings((prev) => ({
            ...prev,
            ...remoteSettings,
          }));
        }
      } catch {
        if (!isCancelled) {
          setSettings(DEFAULT_SITE_SETTINGS);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      setSettings,
    }),
    [settings, loading]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used inside <SiteSettingsProvider>');
  }
  return context;
}
