import { Request, Response } from "express";
import prisma from "../../config/database";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  removeLocalUploadFile,
  toPublicUploadPath,
} from "../../shared/local-upload.service";

const SITE_SETTINGS_SINGLETON_ID = 1;

const defaultCreateData = {
  id: SITE_SETTINGS_SINGLETON_ID,
  universityNameAr: "جامعة ابن خلدون",
  universityNameEn: "Ibn Khaldoun University",
  universityNameFr: "Université Ibn Khaldoun",
  universitySubtitleAr: "كلية الرياضيات والإعلام الآلي",
  universitySubtitleEn: "Faculty of Mathematics and Computer Science",
  universitySubtitleFr: "Faculté des Mathématiques et d'Informatique",
  cityAr: "تيارت",
  cityEn: "Tiaret",
  cityFr: "Tiaret",
  heroStudentsStat: "2500+",
  heroTeachersStat: "150+",
  heroCoursesStat: "200+",
  heroSatisfactionStat: "98%",
  bannerStudentsStat: "28K+",
  bannerTeachersStat: "1.1K+",
  bannerFacultiesStat: "8",
  bannerNationalRankStat: "15th",
  statisticsStudentsStat: "2500+",
  statisticsTeachersStat: "150+",
  statisticsProjectsStat: "500+",
  statisticsSatisfactionStat: "98%",
  statisticsQuoteAr: "تمكين التعليم عبر التكنولوجيا",
  statisticsQuoteEn: "Empowering education through technology",
  statisticsQuoteFr: "Autonomiser l'éducation grâce à la technologie",
  aboutLine1Ar: "جامعة ابن خلدون - تيارت، كلية الرياضيات والإعلام الآلي",
  aboutLine1En: "Ibn Khaldoun University - Tiaret, Faculty of Mathematics and Computer Science",
  aboutLine1Fr: "Université Ibn Khaldoun - Tiaret, Faculté des Mathématiques et d'Informatique",
  aboutLine2Ar: "تأسست سنة 1980 ومكرسة للتميز في التعليم والبحث العلمي.",
  aboutLine2En: "Established in 1980, dedicated to excellence in education and research.",
  aboutLine2Fr: "Fondée en 1980, dédiée à l'excellence en enseignement et en recherche.",
  contactPhone: "+213 555 55 55 55",
  contactEmail: "info@univ-tiaret.dz",
  contactAddressAr: "تيارت، الجزائر",
  contactAddressEn: "Tiaret, Algeria",
  contactAddressFr: "Tiaret, Algérie",
};

const mediaKindToField: Record<string, "logoUrl" | "heroBackgroundUrl" | "bannerBackgroundUrl"> = {
  logo: "logoUrl",
  hero: "heroBackgroundUrl",
  banner: "bannerBackgroundUrl",
};

let siteSettingsTableEnsured = false;

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const removeLocalMediaIfExists = (value: string | null | undefined): void => {
  if (!value || isAbsoluteUrl(value)) {
    return;
  }

  removeLocalUploadFile(value);
};

const ensureSiteSettingsTable = async (): Promise<void> => {
  if (siteSettingsTableEnsured) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.site_settings (
      id INTEGER PRIMARY KEY,
      university_name_ar VARCHAR(200),
      university_name_en VARCHAR(200),
      university_name_fr VARCHAR(200),
      university_subtitle_ar VARCHAR(255),
      university_subtitle_en VARCHAR(255),
      university_subtitle_fr VARCHAR(255),
      city_ar VARCHAR(120),
      city_en VARCHAR(120),
      city_fr VARCHAR(120),
      hero_students_stat VARCHAR(30),
      hero_teachers_stat VARCHAR(30),
      hero_courses_stat VARCHAR(30),
      hero_satisfaction_stat VARCHAR(30),
      banner_students_stat VARCHAR(30),
      banner_teachers_stat VARCHAR(30),
      banner_faculties_stat VARCHAR(30),
      banner_national_rank_stat VARCHAR(30),
      statistics_students_stat VARCHAR(30),
      statistics_teachers_stat VARCHAR(30),
      statistics_projects_stat VARCHAR(30),
      statistics_satisfaction_stat VARCHAR(30),
      statistics_quote_ar TEXT,
      statistics_quote_en TEXT,
      statistics_quote_fr TEXT,
      about_line1_ar TEXT,
      about_line1_en TEXT,
      about_line1_fr TEXT,
      about_line2_ar TEXT,
      about_line2_en TEXT,
      about_line2_fr TEXT,
      contact_phone VARCHAR(60),
      contact_email VARCHAR(150),
      contact_address_ar VARCHAR(255),
      contact_address_en VARCHAR(255),
      contact_address_fr VARCHAR(255),
      logo_url VARCHAR(255),
      hero_background_url VARCHAR(255),
      banner_background_url VARCHAR(255),
      primary_color VARCHAR(20),
      secondary_color VARCHAR(20),
      sidebar_color VARCHAR(20),
      system_email VARCHAR(150),
      maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Keep older databases compatible when the table was created before
  // newly introduced settings fields existed.
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.site_settings
      ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20),
      ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20),
      ADD COLUMN IF NOT EXISTS sidebar_color VARCHAR(20),
      ADD COLUMN IF NOT EXISTS system_email VARCHAR(150),
      ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  siteSettingsTableEnsured = true;
};

const mutableStringFields = new Set([
  "universityNameAr",
  "universityNameEn",
  "universityNameFr",
  "universitySubtitleAr",
  "universitySubtitleEn",
  "universitySubtitleFr",
  "cityAr",
  "cityEn",
  "cityFr",
  "heroStudentsStat",
  "heroTeachersStat",
  "heroCoursesStat",
  "heroSatisfactionStat",
  "bannerStudentsStat",
  "bannerTeachersStat",
  "bannerFacultiesStat",
  "bannerNationalRankStat",
  "statisticsStudentsStat",
  "statisticsTeachersStat",
  "statisticsProjectsStat",
  "statisticsSatisfactionStat",
  "statisticsQuoteAr",
  "statisticsQuoteEn",
  "statisticsQuoteFr",
  "aboutLine1Ar",
  "aboutLine1En",
  "aboutLine1Fr",
  "aboutLine2Ar",
  "aboutLine2En",
  "aboutLine2Fr",
  "contactPhone",
  "contactEmail",
  "contactAddressAr",
  "contactAddressEn",
  "contactAddressFr",
  "logoUrl",
  "heroBackgroundUrl",
  "bannerBackgroundUrl",
]);

const normalizeString = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue.length ? stringValue : null;
};

const sanitizePatchPayload = (payload: unknown): Record<string, string | null> => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const updates: Record<string, string | null> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (!mutableStringFields.has(key)) {
      return;
    }

    const normalized = normalizeString(value);
    if (normalized !== undefined) {
      updates[key] = normalized;
    }
  });

  return updates;
};

const getOrCreateSiteSettings = async () => {
  await ensureSiteSettingsTable();
  return prisma.siteSetting.upsert({
    where: { id: SITE_SETTINGS_SINGLETON_ID },
    update: {},
    create: defaultCreateData,
  });
};

export const getPublicSiteSettingsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSiteSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch site settings";
    res.status(500).json({ success: false, error: { code: "SITE_SETTINGS_FETCH_ERROR", message } });
  }
};

export const updateSiteSettingsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }

    const updates = sanitizePatchPayload(req.body);

    if (!Object.keys(updates).length) {
      const current = await getOrCreateSiteSettings();
      res.status(200).json({ success: true, data: current });
      return;
    }

    await ensureSiteSettingsTable();

    const settings = await prisma.siteSetting.upsert({
      where: { id: SITE_SETTINGS_SINGLETON_ID },
      update: updates,
      create: {
        ...defaultCreateData,
        ...updates,
      },
    });

    res.status(200).json({ success: true, data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update site settings";
    res.status(500).json({ success: false, error: { code: "SITE_SETTINGS_UPDATE_ERROR", message } });
  }
};

export const uploadSiteSettingsMediaHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  let uploadedPublicPath: string | null = null;

  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }

    const kind = String(req.params.kind || "").toLowerCase();
    const targetField = mediaKindToField[kind];
    if (!targetField) {
      res.status(400).json({ success: false, error: { code: "INVALID_MEDIA_KIND", message: "kind must be one of: logo, hero, banner" } });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: { code: "FILE_REQUIRED", message: "Media file is required" } });
      return;
    }

    uploadedPublicPath =
      toPublicUploadPath(req.file.path) || `/uploads/others/site-settings/${req.file.filename}`;

    const current = await getOrCreateSiteSettings();

    const updated = await prisma.siteSetting.update({
      where: { id: SITE_SETTINGS_SINGLETON_ID },
      data: {
        [targetField]: uploadedPublicPath,
      },
    });

    removeLocalMediaIfExists(current[targetField]);

    res.status(200).json({ success: true, data: updated });
  } catch (error: unknown) {
    if (uploadedPublicPath) {
      removeLocalUploadFile(uploadedPublicPath);
    }

    const message = error instanceof Error ? error.message : "Failed to upload site settings media";
    res.status(500).json({ success: false, error: { code: "SITE_SETTINGS_MEDIA_UPLOAD_ERROR", message } });
  }
};
