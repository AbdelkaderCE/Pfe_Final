import { promises as fs } from "fs";
import path from "path";
import {
  CibleAnnonce,
  PrioriteReclamation,
  Prisma,
  StatusAnnonce,
  StatusReclamation,
} from "@prisma/client";
import prisma from "../../config/database";
import { changePassword } from "../auth/auth.service";
import {
  buildStudentStatistics,
  getStudentPfeInfo,
} from "../dashboard/statistics.service";

export type StudentPanelAnnouncementStatus = "published" | "scheduled";
export type StudentPanelReclamationStatus = "pending" | "approved" | "rejected";
export type StudentPanelDocumentKind = "announcement" | "reclamation";

type StudentContext = {
  userId: number;
  etudiantId: number;
  matricule: string | null;
  promoId: number | null;
  user: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    photo: string | null;
  };
  promo: {
    id: number;
    nom: string | null;
    section: string | null;
    anneeUniversitaire: string | null;
    specialite: {
      id: number;
      nom: string | null;
      niveau: string | null;
      filiere: {
        id: number;
        nom: string | null;
      } | null;
    } | null;
  } | null;
  moduleIds: number[];
  modules: Array<{
    moduleId: number;
    moduleName: string;
    moduleCode: string;
  }>;
  moduleById: Map<number, { id: number; name: string; code: string }>;
};

type PaginationInput = {
  page?: number;
  limit?: number;
};

type StudentAnnouncementFilters = PaginationInput & {
  search?: string;
  moduleId?: number;
  typeId?: number;
  dateFrom?: string;
  dateTo?: string;
};

type StudentReclamationFilters = PaginationInput & {
  search?: string;
  status?: string;
  typeId?: number;
  dateFrom?: string;
  dateTo?: string;
};

type StudentDocumentsFilters = PaginationInput & {
  search?: string;
  kind?: string;
};

type CreateStudentReclamationInput = {
  typeId?: number;
  typeName?: string;
  title: string;
  description: string;
  priority?: string;
};

type UpdateStudentProfileInput = {
  email?: string;
  telephone?: string;
};

type AnnouncementLinkRow = {
  annonceId: number;
  moduleId: number | null;
  scheduledFor: Date | null;
};

type StudentReclamationDocumentRow = {
  id: number;
  reclamationId: number;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: bigint | null;
  createdAt: Date;
};

type StudentReclamationDocumentWithTitleRow = StudentReclamationDocumentRow & {
  reclamationTitle: string;
};

const uploadStudentReclamationDir = path.join(process.cwd(), "uploads", "others", "student-reclamations");

const DEFAULT_RECLAMATION_TYPES = [
  { nom: "Grade Error", description: "Issue related to marks or exam grading." },
  { nom: "Schedule Conflict", description: "Conflict in timetable or exam schedule." },
  { nom: "Administrative Error", description: "Administrative or registration issue." },
  { nom: "Other", description: "Other reclamation reasons." },
];

const RECLAMATION_PRIORITY_INPUT_TO_DB: Record<string, PrioriteReclamation> = {
  low: PrioriteReclamation.faible,
  faible: PrioriteReclamation.faible,
  normal: PrioriteReclamation.normale,
  normale: PrioriteReclamation.normale,
  high: PrioriteReclamation.haute,
  haute: PrioriteReclamation.haute,
  urgent: PrioriteReclamation.urgente,
  urgente: PrioriteReclamation.urgente,
};

const TEACHER_ANNOUNCEMENT_MODULES_TABLE = "public.teacher_announcement_modules";
const STUDENT_RECLAMATION_DOCUMENTS_TABLE = "public.student_reclamation_documents";

let supportTablesInitialized = false;
let supportTablesInitPromise: Promise<void> | null = null;

const executeSafe = async (query: string) => {
  try {
    await prisma.$executeRawUnsafe(query);
  } catch (e: any) {
    if (e?.meta?.code === '23505' || (e?.message && e.message.includes('23505'))) return;
    throw e;
  }
};

export class StudentPanelServiceError extends Error {
  statusCode: number;

  code: string;

  constructor(message: string, statusCode = 400, code = "STUDENT_PANEL_SERVICE_ERROR") {
    super(message);
    this.name = "StudentPanelServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const clampPage = (value?: number): number => {
  if (!value || !Number.isInteger(value) || value <= 0) return 1;
  return value;
};

const clampLimit = (value?: number): number => {
  if (!value || !Number.isInteger(value) || value <= 0) return 10;
  return Math.min(100, value);
};

const parseOptionalDate = (value?: string): Date | null => {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const toNumber = (value: bigint | number | null | undefined): number | null => {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "number") {
    return value;
  }

  return null;
};

const normalizeStoredPath = (storedPath: string): string =>
  storedPath.replace(/\\/g, "/").replace(/^\/+/, "");

const resolveLocalPath = (storedPath: string): string | null => {
  if (!storedPath || /^https?:\/\//i.test(storedPath)) {
    return null;
  }

  const absolutePath = path.isAbsolute(storedPath)
    ? storedPath
    : path.join(process.cwd(), storedPath);

  const normalizedAbsolute = path.normalize(absolutePath);
  const normalizedRoot = path.normalize(process.cwd()).toLowerCase();

  if (!normalizedAbsolute.toLowerCase().startsWith(normalizedRoot)) {
    return null;
  }

  return normalizedAbsolute;
};

const mapReclamationStatusToUi = (status: StatusReclamation): StudentPanelReclamationStatus => {
  if (status === StatusReclamation.traitee) return "approved";
  if (status === StatusReclamation.refusee) return "rejected";
  return "pending";
};

const mapReclamationStatusFilterToDb = (status?: string): Prisma.ReclamationWhereInput["status"] => {
  if (!status?.trim()) return undefined;

  const normalized = status.trim().toLowerCase();
  if (normalized === "pending") {
    return {
      in: [StatusReclamation.soumise, StatusReclamation.en_cours, StatusReclamation.en_attente],
    };
  }

  if (normalized === "approved") {
    return StatusReclamation.traitee;
  }

  if (normalized === "rejected") {
    return StatusReclamation.refusee;
  }

  throw new StudentPanelServiceError(
    "Invalid reclamation status filter",
    400,
    "INVALID_RECLAMATION_STATUS_FILTER"
  );
};

const parseReclamationPriority = (value?: string): PrioriteReclamation => {
  if (!value?.trim()) {
    return PrioriteReclamation.normale;
  }

  const mapped = RECLAMATION_PRIORITY_INPUT_TO_DB[value.trim().toLowerCase()];
  if (!mapped) {
    throw new StudentPanelServiceError(
      "Invalid reclamation priority",
      400,
      "INVALID_RECLAMATION_PRIORITY"
    );
  }

  return mapped;
};

export const ensureSupportTables = async () => {
  if (supportTablesInitialized) {
    return;
  }

  if (!supportTablesInitPromise) {
    supportTablesInitPromise = (async () => {
      await fs.mkdir(uploadStudentReclamationDir, { recursive: true });

      await executeSafe(`
        CREATE TABLE IF NOT EXISTS ${TEACHER_ANNOUNCEMENT_MODULES_TABLE} (
          annonce_id INTEGER PRIMARY KEY REFERENCES public.annonces(id) ON DELETE CASCADE,
          module_id INTEGER REFERENCES public.modules(id) ON DELETE SET NULL,
          scheduled_for TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await executeSafe(`
        CREATE INDEX IF NOT EXISTS idx_teacher_announcement_modules_module_id
        ON ${TEACHER_ANNOUNCEMENT_MODULES_TABLE}(module_id)
      `);

      await executeSafe(`
        CREATE TABLE IF NOT EXISTS ${STUDENT_RECLAMATION_DOCUMENTS_TABLE} (
          id SERIAL PRIMARY KEY,
          reclamation_id INTEGER NOT NULL REFERENCES public.reclamations(id) ON DELETE CASCADE,
          etudiant_id INTEGER NOT NULL REFERENCES public.etudiants(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(120),
          file_size BIGINT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await executeSafe(`
        CREATE INDEX IF NOT EXISTS idx_student_reclamation_documents_reclamation_id
        ON ${STUDENT_RECLAMATION_DOCUMENTS_TABLE}(reclamation_id)
      `);

      await executeSafe(`
        CREATE INDEX IF NOT EXISTS idx_student_reclamation_documents_etudiant_id
        ON ${STUDENT_RECLAMATION_DOCUMENTS_TABLE}(etudiant_id)
      `);

      supportTablesInitialized = true;
    })()
      .catch((error) => {
        supportTablesInitialized = false;
        throw error;
      })
      .finally(() => {
        supportTablesInitPromise = null;
      });
  }

  await supportTablesInitPromise;
};

const ensureDefaultReclamationTypes = async () => {
  for (const item of DEFAULT_RECLAMATION_TYPES) {
    const existing = await prisma.reclamationType.findFirst({
      where: {
        OR: [
          {
            nom_ar: {
              equals: item.nom,
              mode: "insensitive",
            },
          },
          {
            nom_en: {
              equals: item.nom,
              mode: "insensitive",
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.reclamationType.create({
        data: {
          nom_ar: item.nom,
          nom_en: item.nom,
          description_ar: item.description,
          description_en: item.description,
        },
      });
    }
  }
};

const resolveStudentContext = async (userId: number): Promise<StudentContext> => {
  const student = await prisma.etudiant.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          photo: true,
        },
      },
      promo: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
          section: true,
          anneeUniversitaire: true,
          specialite: {
            select: {
              id: true,
              nom_ar: true,
              nom_en: true,
              niveau: true,
              filiere: {
                select: {
                  id: true,
                  nom_ar: true,
                  nom_en: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new StudentPanelServiceError("Student profile not found", 404, "STUDENT_PROFILE_NOT_FOUND");
  }

  const teachings = student.promoId
    ? await prisma.enseignement.findMany({
        where: {
          promoId: student.promoId,
          moduleId: {
            not: null,
          },
        },
        select: {
          moduleId: true,
          module: {
            select: {
              id: true,
              nom_ar: true,
              nom_en: true,
              code: true,
            },
          },
        },
      })
    : [];

  const uniqueModuleIds = Array.from(
    new Set(
      teachings
        .map((teaching) => teaching.moduleId)
        .filter((moduleId): moduleId is number => Number.isInteger(moduleId))
    )
  );

  const moduleById = new Map<number, { id: number; name: string; code: string }>();
  const modules: Array<{ moduleId: number; moduleName: string; moduleCode: string }> = [];

  teachings.forEach((teaching) => {
    if (!teaching.moduleId || !teaching.module) {
      return;
    }

    if (moduleById.has(teaching.moduleId)) {
      return;
    }

    moduleById.set(teaching.moduleId, {
      id: teaching.moduleId,
      name: teaching.module.nom_ar || teaching.module.nom_en || "Module",
      code: teaching.module.code,
    });

    modules.push({
      moduleId: teaching.moduleId,
      moduleName: teaching.module.nom_ar || teaching.module.nom_en || "Module",
      moduleCode: teaching.module.code,
    });
  });

  return {
    userId,
    etudiantId: student.id,
    matricule: student.matricule,
    promoId: student.promoId,
    user: {
      nom: student.user.nom,
      prenom: student.user.prenom,
      email: student.user.email,
      telephone: student.user.telephone,
      photo: student.user.photo,
    },
    promo: student.promo
      ? {
          id: student.promo.id,
          nom: student.promo.nom_ar || student.promo.nom_en || null,
          section: student.promo.section,
          anneeUniversitaire: student.promo.anneeUniversitaire,
          specialite: student.promo.specialite
            ? {
                id: student.promo.specialite.id,
                nom: student.promo.specialite.nom_ar || student.promo.specialite.nom_en || null,
                niveau: student.promo.specialite.niveau,
                filiere: student.promo.specialite.filiere
                  ? {
                      id: student.promo.specialite.filiere.id,
                      nom: student.promo.specialite.filiere.nom_ar || student.promo.specialite.filiere.nom_en || null,
                    }
                  : null,
              }
            : null,
        }
      : null,
    moduleIds: uniqueModuleIds,
    modules,
    moduleById,
  };
};

const assertStudentCanAccessModule = (context: StudentContext, moduleId?: number | null) => {
  if (!moduleId) return;

  if (!context.moduleIds.includes(moduleId)) {
    throw new StudentPanelServiceError(
      "You can only access announcements for your assigned modules",
      403,
      "MODULE_ACCESS_FORBIDDEN"
    );
  }
};

const getAnnouncementLinks = async (
  announcementIds: number[]
): Promise<Map<number, AnnouncementLinkRow>> => {
  const links = new Map<number, AnnouncementLinkRow>();

  if (!announcementIds.length) {
    return links;
  }

  const rows = await prisma.$queryRaw<AnnouncementLinkRow[]>(Prisma.sql`
    SELECT
      annonce_id AS "annonceId",
      module_id AS "moduleId",
      scheduled_for AS "scheduledFor"
    FROM public.teacher_announcement_modules
    WHERE annonce_id IN (${Prisma.join(announcementIds)})
  `);

  rows.forEach((row) => {
    links.set(row.annonceId, row);
  });

  return links;
};

const fetchVisibleAnnouncements = async (
  context: StudentContext,
  filters: {
    search?: string;
    typeId?: number;
    dateFrom?: string;
    dateTo?: string;
  }
) => {
  const andConditions: Prisma.AnnonceWhereInput[] = [
    {
      status: StatusAnnonce.publie,
    },
    {
      cible: {
        in: [CibleAnnonce.tous, CibleAnnonce.etudiants],
      },
    },
    {
      OR: [{ datePublication: null }, { datePublication: { lte: new Date() } }],
    },
    {
      OR: [{ dateExpiration: null }, { dateExpiration: { gte: new Date() } }],
    },
  ];

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    andConditions.push({
      OR: [
        { titre_ar: { contains: searchTerm, mode: "insensitive" } },
        { titre_en: { contains: searchTerm, mode: "insensitive" } },
        { contenu_ar: { contains: searchTerm, mode: "insensitive" } },
        { contenu_en: { contains: searchTerm, mode: "insensitive" } },
        {
          type: {
            is: {
              OR: [
                {
                  nom_ar: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  nom_en: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }

  if (filters.typeId) {
    andConditions.push({ typeId: filters.typeId });
  }

  const dateFrom = parseOptionalDate(filters.dateFrom);
  const dateTo = parseOptionalDate(filters.dateTo);
  if (dateFrom || dateTo) {
    const dateFilter: Prisma.DateTimeNullableFilter = {};
    if (dateFrom) {
      dateFilter.gte = dateFrom;
    }
    if (dateTo) {
      dateFilter.lte = dateTo;
    }

    andConditions.push({
      datePublication: dateFilter,
    });
  }

  const announcements = await prisma.annonce.findMany({
    where: {
      AND: andConditions,
    },
    include: {
      type: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
        },
      },
      documents: true,
    },
    orderBy: {
      datePublication: "desc",
    },
  });

  const links = await getAnnouncementLinks(announcements.map((announcement) => announcement.id));

  const visibleAnnouncements = announcements.filter((announcement) => {
    const link = links.get(announcement.id);
    if (!link?.moduleId) {
      return true;
    }

    return context.moduleIds.includes(link.moduleId);
  });

  return {
    announcements: visibleAnnouncements,
    links,
  };
};

const mapAnnouncementForStudent = (
  context: StudentContext,
  announcement: Prisma.AnnonceGetPayload<{
    include: {
      type: { select: { id: true; nom_ar: true; nom_en: true } };
      documents: true;
    };
  }>,
  link?: AnnouncementLinkRow
) => {
  const moduleMeta = link?.moduleId ? context.moduleById.get(link.moduleId) : undefined;
  const scheduleDate = link?.scheduledFor || null;
  const isScheduled = Boolean(scheduleDate && new Date(scheduleDate).getTime() > Date.now());

  return {
    id: announcement.id,
    title: announcement.titre_ar || announcement.titre_en || "Announcement",
    description: announcement.contenu_ar || announcement.contenu_en || "",
    status: (isScheduled ? "scheduled" : "published") as StudentPanelAnnouncementStatus,
    publishedAt: announcement.datePublication,
    expiresAt: announcement.dateExpiration,
    type: announcement.type
      ? {
          id: announcement.type.id,
          name: announcement.type.nom_ar || announcement.type.nom_en || null,
        }
      : null,
    module: moduleMeta
      ? {
          id: moduleMeta.id,
          name: moduleMeta.name,
          code: moduleMeta.code,
        }
      : null,
    attachments: announcement.documents.map((document) => {
      const normalizedPath = normalizeStoredPath(document.fichier);
      return {
        id: document.id,
        fileName: path.basename(normalizedPath),
        storedPath: normalizedPath,
        downloadUrl: `/api/v1/student/panel/announcements/${announcement.id}/documents/${document.id}/download`,
        description: document.description_ar || document.description_en || null,
        createdAt: document.createdAt,
      };
    }),
  };
};

const resolveAccessibleAnnouncement = async (
  context: StudentContext,
  announcementId: number
) => {
  const announcement = await prisma.annonce.findUnique({
    where: { id: announcementId },
    include: {
      type: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
        },
      },
      documents: true,
    },
  });

  if (!announcement) {
    throw new StudentPanelServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  if (announcement.status !== StatusAnnonce.publie) {
    throw new StudentPanelServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  if (
    announcement.cible !== CibleAnnonce.tous &&
    announcement.cible !== CibleAnnonce.etudiants
  ) {
    throw new StudentPanelServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  if (announcement.datePublication && announcement.datePublication.getTime() > Date.now()) {
    throw new StudentPanelServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  if (announcement.dateExpiration && announcement.dateExpiration.getTime() < Date.now()) {
    throw new StudentPanelServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  const link = (await getAnnouncementLinks([announcement.id])).get(announcement.id);
  if (link?.moduleId && !context.moduleIds.includes(link.moduleId)) {
    throw new StudentPanelServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  return {
    announcement,
    link,
  };
};

const getReclamationDocumentsMap = async (
  etudiantId: number,
  reclamationIds: number[]
): Promise<Map<number, StudentReclamationDocumentRow[]>> => {
  const map = new Map<number, StudentReclamationDocumentRow[]>();

  if (!reclamationIds.length) {
    return map;
  }

  const rows = await prisma.$queryRaw<StudentReclamationDocumentRow[]>(Prisma.sql`
    SELECT
      id,
      reclamation_id AS "reclamationId",
      file_path AS "filePath",
      file_name AS "fileName",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      created_at AS "createdAt"
    FROM public.student_reclamation_documents
    WHERE etudiant_id = ${etudiantId}
      AND reclamation_id IN (${Prisma.join(reclamationIds)})
    ORDER BY created_at DESC
  `);

  rows.forEach((row) => {
    const group = map.get(row.reclamationId) || [];
    group.push(row);
    map.set(row.reclamationId, group);
  });

  return map;
};

const resolveReclamationTypeId = async (input: {
  typeId?: number;
  typeName?: string;
}): Promise<number> => {
  if (input.typeId && Number.isInteger(input.typeId) && input.typeId > 0) {
    const type = await prisma.reclamationType.findUnique({
      where: { id: input.typeId },
      select: { id: true },
    });

    if (!type) {
      throw new StudentPanelServiceError(
        "Reclamation type not found",
        404,
        "RECLAMATION_TYPE_NOT_FOUND"
      );
    }

    return type.id;
  }

  const typeName = input.typeName?.trim();
  if (!typeName) {
    throw new StudentPanelServiceError(
      "A reclamation type is required",
      400,
      "MISSING_RECLAMATION_TYPE"
    );
  }

  const type = await prisma.reclamationType.findFirst({
    where: {
      OR: [
        { nom_ar: { equals: typeName, mode: "insensitive" } },
        { nom_en: { equals: typeName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (!type) {
    throw new StudentPanelServiceError(
      "Reclamation type not found",
      404,
      "RECLAMATION_TYPE_NOT_FOUND"
    );
  }

  return type.id;
};

const resolveReclamationContext = async (context: StudentContext, reclamationId: number) => {
  const reclamation = await prisma.reclamation.findUnique({
    where: { id: reclamationId },
    include: {
      type: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
        },
      },
    },
  });

  if (!reclamation || reclamation.etudiantId !== context.etudiantId) {
    throw new StudentPanelServiceError("Reclamation not found", 404, "RECLAMATION_NOT_FOUND");
  }

  return reclamation;
};

export const getStudentPanelDashboard = async (userId: number) => {
  const context = await resolveStudentContext(userId);

  const [announcementsResult, reclamationsResult, documentsResult, profile] =
    await Promise.all([
      listStudentPanelAnnouncements(userId, { page: 1, limit: 5 }),
      listStudentPanelReclamations(userId, { page: 1, limit: 5 }),
      listStudentPanelDocuments(userId, { page: 1, limit: 5 }),
      getStudentPanelProfile(userId),
    ]);

  // Summary numbers come from the centralized statistics service so the
  // same metric definition is used for students, teachers and admins.
  const [summary, pfe] = await Promise.all([
    buildStudentStatistics({
      etudiantId: context.etudiantId,
      announcementsVisible: announcementsResult.pagination.total,
      documentsVisible: documentsResult.pagination.total,
    }),
    getStudentPfeInfo(context.etudiantId),
  ]);

  return {
    summary,
    pfe,
    recentAnnouncements: announcementsResult.items,
    recentReclamations: reclamationsResult.items,
    modules: announcementsResult.modules,
    profile,
  };
};

export const listStudentPanelAnnouncements = async (
  userId: number,
  filters: StudentAnnouncementFilters
) => {
  await ensureSupportTables();
  const context = await resolveStudentContext(userId);

  if (filters.moduleId) {
    assertStudentCanAccessModule(context, filters.moduleId);
  }

  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);

  const { announcements, links } = await fetchVisibleAnnouncements(context, {
    search: filters.search,
    typeId: filters.typeId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  let mapped = announcements.map((announcement) =>
    mapAnnouncementForStudent(context, announcement, links.get(announcement.id))
  );

  if (filters.moduleId) {
    mapped = mapped.filter((item) => item.module?.id === filters.moduleId);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    mapped = mapped.filter((item) => {
      const moduleName = item.module?.name?.toLowerCase() || "";
      const moduleCode = item.module?.code?.toLowerCase() || "";
      if (!moduleName && !moduleCode) {
        return true;
      }

      return moduleName.includes(term) || moduleCode.includes(term);
    });
  }

  const total = mapped.length;
  const paginated = mapped.slice((page - 1) * limit, page * limit);

  const types = await prisma.annonceType.findMany({
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
    },
    orderBy: {
      nom_ar: "asc",
    },
  });

  return {
    items: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    modules: context.modules,
    types: types.map((type) => ({
      id: type.id,
      name: type.nom_ar || type.nom_en || null,
    })),
  };
};

export const getStudentPanelAnnouncementDetails = async (userId: number, announcementId: number) => {
  await ensureSupportTables();
  const context = await resolveStudentContext(userId);
  const { announcement, link } = await resolveAccessibleAnnouncement(context, announcementId);

  return mapAnnouncementForStudent(context, announcement, link);
};

export const getStudentPanelAnnouncementDocumentDownloadInfo = async (
  userId: number,
  announcementId: number,
  documentId: number
) => {
  await ensureSupportTables();
  const context = await resolveStudentContext(userId);
  const { announcement } = await resolveAccessibleAnnouncement(context, announcementId);

  const document = announcement.documents.find((entry) => entry.id === documentId);
  if (!document) {
    throw new StudentPanelServiceError(
      "Announcement document not found",
      404,
      "ANNOUNCEMENT_DOCUMENT_NOT_FOUND"
    );
  }

  const normalizedPath = normalizeStoredPath(document.fichier);
  const resolvedPath = resolveLocalPath(normalizedPath);

  if (!resolvedPath) {
    throw new StudentPanelServiceError("Invalid file path", 400, "INVALID_FILE_PATH");
  }

  try {
    await fs.stat(resolvedPath);
  } catch {
    throw new StudentPanelServiceError(
      "Document file missing on server",
      404,
      "DOCUMENT_FILE_MISSING"
    );
  }

  return {
    absolutePath: resolvedPath,
    fileName: path.basename(normalizedPath),
  };
};

export const listStudentPanelReclamationTypes = async () => {
  await ensureDefaultReclamationTypes();

  const types = await prisma.reclamationType.findMany({
    select: {
      id: true,
      code: true,
      nom_ar: true,
      nom_en: true,
      description_ar: true,
      description_en: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return types.map((type) => ({
    id: type.id,
    code: type.code,
    nom_ar: type.nom_ar,
    nom_en: type.nom_en,
    nom: type.nom_en || type.nom_ar || "",
    description_ar: type.description_ar,
    description_en: type.description_en,
  }));
};

export const createStudentPanelReclamation = async (
  userId: number,
  payload: CreateStudentReclamationInput,
  files: Express.Multer.File[]
) => {
  await ensureSupportTables();
  await ensureDefaultReclamationTypes();

  const context = await resolveStudentContext(userId);

  const title = payload.title?.trim();
  const description = payload.description?.trim();

  if (!title) {
    throw new StudentPanelServiceError("Reclamation title is required", 400, "MISSING_RECLAMATION_TITLE");
  }

  if (!description) {
    throw new StudentPanelServiceError(
      "Reclamation description is required",
      400,
      "MISSING_RECLAMATION_DESCRIPTION"
    );
  }

  const typeId = await resolveReclamationTypeId({
    typeId: payload.typeId,
    typeName: payload.typeName,
  });

  const priority = parseReclamationPriority(payload.priority);

  const created = await prisma.$transaction(async (tx) => {
    const reclamation = await tx.reclamation.create({
      data: {
        etudiantId: context.etudiantId,
        typeId,
        objet_ar: title,
        description_ar: description,
        priorite: priority,
        status: StatusReclamation.soumise,
      },
      select: {
        id: true,
      },
    });

    if (files.length > 0) {
      for (const file of files) {
        const storedPath = normalizeStoredPath(path.relative(process.cwd(), file.path));
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.student_reclamation_documents (
            reclamation_id,
            etudiant_id,
            file_path,
            file_name,
            mime_type,
            file_size,
            created_at
          )
          VALUES (
            ${reclamation.id},
            ${context.etudiantId},
            ${storedPath},
            ${file.originalname || path.basename(storedPath)},
            ${file.mimetype || null},
            ${file.size || null},
            NOW()
          )
        `);
      }
    }

    return reclamation.id;
  });

  return getStudentPanelReclamationDetails(userId, created);
};

export const listStudentPanelReclamations = async (
  userId: number,
  filters: StudentReclamationFilters
) => {
  await ensureSupportTables();
  const context = await resolveStudentContext(userId);

  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);

  const where: Prisma.ReclamationWhereInput = {
    etudiantId: context.etudiantId,
  };

  if (filters.typeId) {
    where.typeId = filters.typeId;
  }

  const statusFilter = mapReclamationStatusFilterToDb(filters.status);
  if (statusFilter) {
    where.status = statusFilter;
  }

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    where.OR = [
      { objet_ar: { contains: searchTerm, mode: "insensitive" } },
      { objet_en: { contains: searchTerm, mode: "insensitive" } },
      { description_ar: { contains: searchTerm, mode: "insensitive" } },
      { description_en: { contains: searchTerm, mode: "insensitive" } },
      {
        type: {
          is: {
            OR: [
              { nom_ar: { contains: searchTerm, mode: "insensitive" } },
              { nom_en: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const dateFrom = parseOptionalDate(filters.dateFrom);
  const dateTo = parseOptionalDate(filters.dateTo);
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = dateFrom;
    }
    if (dateTo) {
      where.createdAt.lte = dateTo;
    }
  }

  const [total, reclamations, types] = await Promise.all([
    prisma.reclamation.count({ where }),
    prisma.reclamation.findMany({
      where,
      include: {
        type: {
          select: {
            id: true,
            nom_ar: true,
            nom_en: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reclamationType.findMany({
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        description_ar: true,
        description_en: true,
      },
      orderBy: {
        id: "asc",
      },
    }),
  ]);

  const docsMap = await getReclamationDocumentsMap(
    context.etudiantId,
    reclamations.map((reclamation) => reclamation.id)
  );

  const items = reclamations.map((reclamation) => {
    const docs = docsMap.get(reclamation.id) || [];

    return {
      id: reclamation.id,
      title: reclamation.objet_ar || reclamation.objet_en || "Request",
      description: reclamation.description_ar || reclamation.description_en || "",
      status: mapReclamationStatusToUi(reclamation.status),
      rawStatus: reclamation.status,
      priority: reclamation.priorite,
      type: reclamation.type
        ? {
            id: reclamation.type.id,
            name: reclamation.type.nom_ar || reclamation.type.nom_en || null,
          }
        : null,
      adminResponse: reclamation.reponse_ar || reclamation.reponse_en || null,
      createdAt: reclamation.createdAt,
      updatedAt: reclamation.updatedAt,
      processedAt: reclamation.dateTraitement,
      attachments: docs.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileSize: toNumber(doc.fileSize),
        createdAt: doc.createdAt,
        downloadUrl: `/api/v1/student/panel/reclamations/${reclamation.id}/documents/${doc.id}/download`,
      })),
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    types: types.map((type) => ({
      id: type.id,
      name: type.nom_ar || type.nom_en,
    })),
  };
};

export const getStudentPanelReclamationDetails = async (userId: number, reclamationId: number) => {
  await ensureSupportTables();
  const context = await resolveStudentContext(userId);
  const reclamation = await resolveReclamationContext(context, reclamationId);

  const docsMap = await getReclamationDocumentsMap(context.etudiantId, [reclamation.id]);
  const docs = docsMap.get(reclamation.id) || [];

  return {
    id: reclamation.id,
    title: reclamation.objet_ar || reclamation.objet_en || "Request",
    description: reclamation.description_ar || reclamation.description_en || "",
    status: mapReclamationStatusToUi(reclamation.status),
    rawStatus: reclamation.status,
    priority: reclamation.priorite,
    type: reclamation.type
      ? {
          id: reclamation.type.id,
          name: reclamation.type.nom_ar || reclamation.type.nom_en || null,
        }
      : null,
    adminResponse: reclamation.reponse_ar || reclamation.reponse_en || null,
    createdAt: reclamation.createdAt,
    updatedAt: reclamation.updatedAt,
    processedAt: reclamation.dateTraitement,
    attachments: docs.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: toNumber(doc.fileSize),
      createdAt: doc.createdAt,
      downloadUrl: `/api/v1/student/panel/reclamations/${reclamation.id}/documents/${doc.id}/download`,
    })),
  };
};

export const getStudentPanelReclamationDocumentDownloadInfo = async (
  userId: number,
  reclamationId: number,
  documentId: number
) => {
  await ensureSupportTables();
  const context = await resolveStudentContext(userId);
  await resolveReclamationContext(context, reclamationId);

  const rows = await prisma.$queryRaw<StudentReclamationDocumentRow[]>(Prisma.sql`
    SELECT
      id,
      reclamation_id AS "reclamationId",
      file_path AS "filePath",
      file_name AS "fileName",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      created_at AS "createdAt"
    FROM public.student_reclamation_documents
    WHERE id = ${documentId}
      AND reclamation_id = ${reclamationId}
      AND etudiant_id = ${context.etudiantId}
    LIMIT 1
  `);

  const document = rows[0];
  if (!document) {
    throw new StudentPanelServiceError(
      "Reclamation document not found",
      404,
      "RECLAMATION_DOCUMENT_NOT_FOUND"
    );
  }

  const normalizedPath = normalizeStoredPath(document.filePath);
  const resolvedPath = resolveLocalPath(normalizedPath);

  if (!resolvedPath) {
    throw new StudentPanelServiceError("Invalid file path", 400, "INVALID_FILE_PATH");
  }

  try {
    await fs.stat(resolvedPath);
  } catch {
    throw new StudentPanelServiceError(
      "Document file missing on server",
      404,
      "DOCUMENT_FILE_MISSING"
    );
  }

  return {
    absolutePath: resolvedPath,
    fileName: document.fileName || path.basename(normalizedPath),
  };
};

export const listStudentPanelDocuments = async (
  userId: number,
  filters: StudentDocumentsFilters
) => {
  await ensureSupportTables();
  const context = await resolveStudentContext(userId);

  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);
  const searchTerm = filters.search?.trim().toLowerCase() || "";

  const { announcements, links } = await fetchVisibleAnnouncements(context, {});

  const announcementItems = announcements.flatMap((announcement) => {
    const mappedAnnouncement = mapAnnouncementForStudent(
      context,
      announcement,
      links.get(announcement.id)
    );

    return mappedAnnouncement.attachments.map((attachment) => ({
      id: `announcement-${attachment.id}`,
      numericId: attachment.id,
      kind: "announcement" as StudentPanelDocumentKind,
      fileName: attachment.fileName,
      sourceTitle: mappedAnnouncement.title,
      module: mappedAnnouncement.module,
      createdAt: attachment.createdAt,
      downloadUrl: `/api/v1/student/panel/documents/announcement/${attachment.id}/download`,
    }));
  });

  const documentConditions: Prisma.Sql[] = [
    Prisma.sql`d.etudiant_id = ${context.etudiantId}`,
  ];

  if (searchTerm) {
    const searchPattern = `%${searchTerm}%`;
    documentConditions.push(
      Prisma.sql`(d.file_name ILIKE ${searchPattern} OR r.objet_ar ILIKE ${searchPattern} OR r.objet_en ILIKE ${searchPattern})`
    );
  }

  const reclamationRows = await prisma.$queryRaw<StudentReclamationDocumentWithTitleRow[]>(Prisma.sql`
    SELECT
      d.id,
      d.reclamation_id AS "reclamationId",
      d.file_path AS "filePath",
      d.file_name AS "fileName",
      d.mime_type AS "mimeType",
      d.file_size AS "fileSize",
      d.created_at AS "createdAt",
      COALESCE(r.objet_ar, r.objet_en) AS "reclamationTitle"
    FROM public.student_reclamation_documents d
    INNER JOIN reclamations r ON r.id = d.reclamation_id
    WHERE ${Prisma.join(documentConditions, " AND ")}
    ORDER BY d.created_at DESC
  `);

  let items = [
    ...announcementItems,
    ...reclamationRows.map((row) => ({
      id: `reclamation-${row.id}`,
      numericId: row.id,
      kind: "reclamation" as StudentPanelDocumentKind,
      fileName: row.fileName,
      sourceTitle: row.reclamationTitle,
      module: null,
      createdAt: row.createdAt,
      downloadUrl: `/api/v1/student/panel/documents/reclamation/${row.id}/download`,
    })),
  ];

  if (searchTerm) {
    items = items.filter((item) => {
      const haystack = [item.fileName, item.sourceTitle, item.module?.name, item.module?.code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }

  if (filters.kind?.trim()) {
    const kind = filters.kind.trim().toLowerCase();
    if (!["announcement", "reclamation"].includes(kind)) {
      throw new StudentPanelServiceError("Invalid document kind filter", 400, "INVALID_DOCUMENT_KIND");
    }

    items = items.filter((item) => item.kind === kind);
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = items.length;
  const paginated = items.slice((page - 1) * limit, page * limit);

  return {
    items: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    counts: {
      announcement: items.filter((item) => item.kind === "announcement").length,
      reclamation: items.filter((item) => item.kind === "reclamation").length,
    },
  };
};

export const getStudentPanelDocumentDownloadInfo = async (
  userId: number,
  kind: StudentPanelDocumentKind,
  documentId: number
) => {
  if (kind === "announcement") {
    const announcementDocument = await prisma.annonceDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        annonceId: true,
      },
    });

    if (!announcementDocument) {
      throw new StudentPanelServiceError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    return getStudentPanelAnnouncementDocumentDownloadInfo(
      userId,
      announcementDocument.annonceId,
      announcementDocument.id
    );
  }

  await ensureSupportTables();
  const context = await resolveStudentContext(userId);

  const rows = await prisma.$queryRaw<StudentReclamationDocumentRow[]>(Prisma.sql`
    SELECT
      id,
      reclamation_id AS "reclamationId",
      file_path AS "filePath",
      file_name AS "fileName",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      created_at AS "createdAt"
    FROM public.student_reclamation_documents
    WHERE id = ${documentId}
      AND etudiant_id = ${context.etudiantId}
    LIMIT 1
  `);

  const document = rows[0];
  if (!document) {
    throw new StudentPanelServiceError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  }

  const normalizedPath = normalizeStoredPath(document.filePath);
  const resolvedPath = resolveLocalPath(normalizedPath);

  if (!resolvedPath) {
    throw new StudentPanelServiceError("Invalid file path", 400, "INVALID_FILE_PATH");
  }

  try {
    await fs.stat(resolvedPath);
  } catch {
    throw new StudentPanelServiceError(
      "Document file missing on server",
      404,
      "DOCUMENT_FILE_MISSING"
    );
  }

  return {
    absolutePath: resolvedPath,
    fileName: document.fileName || path.basename(normalizedPath),
  };
};

export const getStudentPanelProfile = async (userId: number) => {
  const context = await resolveStudentContext(userId);

  return {
    userId: context.userId,
    nom: context.user.nom,
    prenom: context.user.prenom,
    email: context.user.email,
    telephone: context.user.telephone,
    photo: context.user.photo,
    matricule: context.matricule,
    promo: context.promo,
  };
};

export const updateStudentPanelProfile = async (
  userId: number,
  payload: UpdateStudentProfileInput
) => {
  const updateData: Prisma.UserUpdateInput = {};

  if (typeof payload.email === "string") {
    const email = payload.email.trim().toLowerCase();
    if (!email) {
      throw new StudentPanelServiceError("Email cannot be empty", 400, "INVALID_EMAIL");
    }
    updateData.email = email;
  }

  if (typeof payload.telephone === "string") {
    updateData.telephone = payload.telephone.trim() || null;
  }

  if (Object.keys(updateData).length > 0) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error) {
        const code = (error as { code?: string }).code;
        if (code === "P2002") {
          throw new StudentPanelServiceError(
            "Email is already used by another account",
            409,
            "EMAIL_ALREADY_EXISTS"
          );
        }
      }

      throw error;
    }
  }

  return getStudentPanelProfile(userId);
};

export const changeStudentPanelPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  await changePassword(userId, currentPassword, newPassword);
  return {
    changed: true,
  };
};
