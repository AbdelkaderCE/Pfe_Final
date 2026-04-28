import { Prisma, PrioriteAnnonce, StatusAnnonce } from "@prisma/client";
import prisma from "../../config/database";

type AnnouncementWithRelations = Prisma.AnnonceGetPayload<{
  include: {
    auteur: {
      select: {
        nom: true;
        prenom: true;
      };
    };
    type: {
      select: {
        nom_ar: true;
        nom_en: true;
      };
    };
  };
}>;

type ActualitesCategory = "academic" | "administrative" | "events" | "research" | "student-life";

export type PublicPinnedActualite = {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: ActualitesCategory;
  urgent: boolean;
};

export type PublicNewsActualite = PublicPinnedActualite & {
  views: number;
  comments: number;
};

export type PublicEventActualite = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: ActualitesCategory;
};

const PRIORITY_WEIGHT: Record<PrioriteAnnonce, number> = {
  basse: 1,
  normale: 2,
  haute: 3,
  urgente: 4,
};

const EVENT_KEYWORDS = ["event", "events", "meeting", "conference", "seminar", "workshop", "calendar"];
const ADMIN_KEYWORDS = ["admin", "administrative", "registration", "deadline", "office", "bureau"];
const RESEARCH_KEYWORDS = ["research", "lab", "scientific", "publication"];
const STUDENT_LIFE_KEYWORDS = ["club", "student", "association", "sport", "campus life"];

const normalizeText = (value: string | null | undefined): string =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const includesAnyKeyword = (value: string, keywords: string[]): boolean =>
  keywords.some((keyword) => value.includes(keyword));

const getAnnouncementTitle = (announcement: AnnouncementWithRelations): string =>
  normalizeText(announcement.titre_ar) || normalizeText(announcement.titre_en) || "Announcement";

const getAnnouncementContent = (announcement: AnnouncementWithRelations): string =>
  normalizeText(announcement.contenu_ar) || normalizeText(announcement.contenu_en);

const getAnnouncementTypeName = (announcement: AnnouncementWithRelations): string =>
  normalizeText(announcement.type?.nom_ar) || normalizeText(announcement.type?.nom_en);

const getAnnouncementDate = (announcement: AnnouncementWithRelations): Date =>
  announcement.datePublication || announcement.createdAt;

const getAnnouncementAuthor = (announcement: AnnouncementWithRelations): string => {
  const first = normalizeText(announcement.auteur?.prenom);
  const last = normalizeText(announcement.auteur?.nom);
  const fullName = [first, last].filter(Boolean).join(" ").trim();
  return fullName || "Administration";
};

const toExcerpt = (value: string, maxLength = 220): string => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
};

const mapCategory = (announcement: AnnouncementWithRelations): ActualitesCategory => {
  const haystack = [
    getAnnouncementTypeName(announcement),
    getAnnouncementTitle(announcement),
    getAnnouncementContent(announcement),
  ]
    .join(" ")
    .toLowerCase();

  if (includesAnyKeyword(haystack, EVENT_KEYWORDS)) return "events";
  if (includesAnyKeyword(haystack, RESEARCH_KEYWORDS)) return "research";
  if (includesAnyKeyword(haystack, STUDENT_LIFE_KEYWORDS)) return "student-life";
  if (includesAnyKeyword(haystack, ADMIN_KEYWORDS)) return "administrative";

  return "academic";
};

const inferLocation = (announcement: AnnouncementWithRelations): string => {
  const text = `${getAnnouncementTitle(announcement)} ${getAnnouncementContent(announcement)}`.toLowerCase();

  if (text.includes("zoom")) return "Zoom";
  if (text.includes("teams")) return "Microsoft Teams";
  if (text.includes("google meet") || text.includes("meet")) return "Google Meet";
  if (text.includes("auditorium")) return "Auditorium";
  if (text.includes("amphi")) return "Amphi";
  if (text.includes("room") || text.includes("salle")) return "Room";

  return "Campus";
};

const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const resolveEventDate = (announcement: AnnouncementWithRelations, floorDate: Date): Date | null => {
  const candidates = [announcement.datePublication, announcement.dateExpiration, announcement.createdAt]
    .filter((value): value is Date => Boolean(value))
    .map((value) => new Date(value));

  if (!candidates.length) {
    return null;
  }

  const upcoming = candidates
    .filter((value) => value.getTime() >= floorDate.getTime())
    .sort((left, right) => left.getTime() - right.getTime());

  if (upcoming.length) {
    return upcoming[0];
  }

  if (mapCategory(announcement) === "events") {
    return candidates.sort((left, right) => left.getTime() - right.getTime())[0];
  }

  return null;
};

const loadPublicAnnouncements = async (): Promise<AnnouncementWithRelations[]> => {
  const now = new Date();

  return prisma.annonce.findMany({
    where: {
      status: StatusAnnonce.publie,
      OR: [{ dateExpiration: null }, { dateExpiration: { gte: now } }],
    },
    include: {
      auteur: {
        select: {
          nom: true,
          prenom: true,
        },
      },
      type: {
        select: {
            nom_ar: true,
            nom_en: true,
        },
      },
    },
    orderBy: [{ datePublication: "desc" }, { createdAt: "desc" }],
    take: 120,
  });
};

export const listPinnedActualites = async (): Promise<PublicPinnedActualite[]> => {
  const announcements = await loadPublicAnnouncements();

  return announcements
    .map((announcement) => {
      const category = mapCategory(announcement);
      const date = getAnnouncementDate(announcement);
      const urgent = announcement.priorite === PrioriteAnnonce.urgente || announcement.priorite === PrioriteAnnonce.haute;

      return {
        id: announcement.id,
        title: getAnnouncementTitle(announcement),
        excerpt: toExcerpt(getAnnouncementContent(announcement), 210),
        author: getAnnouncementAuthor(announcement),
        date: date.toISOString(),
        category,
        urgent,
        priorityWeight: PRIORITY_WEIGHT[announcement.priorite],
        timestamp: date.getTime(),
      };
    })
    .filter((item) => item.urgent)
    .sort((left, right) => {
      if (right.priorityWeight !== left.priorityWeight) {
        return right.priorityWeight - left.priorityWeight;
      }

      return right.timestamp - left.timestamp;
    })
    .slice(0, 8)
    .map(({ priorityWeight: _priorityWeight, timestamp: _timestamp, ...item }) => item);
};

export const listNewsActualites = async (): Promise<PublicNewsActualite[]> => {
  const announcements = await loadPublicAnnouncements();

  return announcements
    .map((announcement) => {
      const date = getAnnouncementDate(announcement);

      return {
        id: announcement.id,
        title: getAnnouncementTitle(announcement),
        excerpt: toExcerpt(getAnnouncementContent(announcement), 260),
        author: getAnnouncementAuthor(announcement),
        date: date.toISOString(),
        category: mapCategory(announcement),
        urgent: announcement.priorite === PrioriteAnnonce.urgente || announcement.priorite === PrioriteAnnonce.haute,
        views: 0,
        comments: 0,
        timestamp: date.getTime(),
      };
    })
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 60)
    .map(({ timestamp: _timestamp, ...item }) => item);
};

export const listEventsActualites = async (): Promise<PublicEventActualite[]> => {
  const announcements = await loadPublicAnnouncements();
  const floorDate = startOfToday();

  return announcements
    .map((announcement) => {
      const category = mapCategory(announcement);
      const eventDate = resolveEventDate(announcement, floorDate);

      if (!eventDate) {
        return null;
      }

      if (category !== "events" && eventDate.getTime() < floorDate.getTime()) {
        return null;
      }

      return {
        id: announcement.id,
        title: getAnnouncementTitle(announcement),
        date: eventDate.toISOString(),
        time: eventDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: inferLocation(announcement),
        category,
      };
    })
    .filter((item): item is PublicEventActualite => Boolean(item))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
    .slice(0, 40);
};
