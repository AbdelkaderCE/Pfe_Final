import { promises as fs } from "fs";
import path from "path";
import {
  CibleAnnonce,
  PrioriteAnnonce,
  Prisma,
  StatusAnnonce,
  StatusReclamation,
  TypeFichierAnnonce,
} from "@prisma/client";
import prisma from "../../config/database";
import { changePassword } from "../auth/auth.service";
import { writeAuditLogSafe } from "../../shared/audit-log.service";
import { appendRequestWorkflowEvent } from "../requests/workflow.service";
import {
  buildTeacherStatistics,
  getTeacherDisciplineByType,
  getTeacherDocumentBreakdown,
  getTeacherModuleBySpecialite,
  getTeacherPfeBreakdown,
  getTeacherPfeBySpecialite,
} from "../dashboard/statistics.service";

export type TeacherAnnouncementStatus = "draft" | "published" | "archived" | "scheduled";
export type TeacherReclamationStatus = "pending" | "approved" | "rejected";

type TeacherContext = {
  userId: number;
  enseignantId: number;
  fullName: string;
  email: string;
  courses: Array<{
    enseignementId: number;
    moduleId: number;
    moduleName: string;
    moduleCode: string;
    promoId: number;
    promoName: string;
    section: string;
  }>;
  moduleIds: number[];
  promoIds: number[];
  modulePromoMap: Map<number, number[]>;
  moduleById: Map<number, { id: number; name: string; code: string }>;
};

type PaginationInput = {
  page?: number;
  limit?: number;
};

type TeacherAnnouncementFilters = PaginationInput & {
  search?: string;
  moduleId?: number;
  status?: string;
  typeId?: number;
  dateFrom?: string;
  dateTo?: string;
};

type TeacherReclamationFilters = PaginationInput & {
  search?: string;
  moduleId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

type TeacherStudentFilters = PaginationInput & {
  search?: string;
  moduleId?: number;
};

type TeacherDocumentFilters = PaginationInput & {
  search?: string;
  moduleId?: number;
  announcementId?: number;
};

type CreateTeacherAnnouncementInput = {
  title: string;
  description: string;
  typeName?: string;
  typeId?: number;
  moduleId: number;
  status?: string;
  target?: string;
  priority?: string;
  scheduleAt?: string;
  expiresAt?: string;
};

type UpdateTeacherAnnouncementInput = Partial<CreateTeacherAnnouncementInput> & {
  removeDocumentIds?: number[];
};

type UpdateTeacherReclamationInput = {
  status: TeacherReclamationStatus;
  response?: string;
  internalNote?: string;
};

type CreateTeacherDocumentInput = {
  title: string;
  moduleId?: number;
  announcementId?: number;
};

type UpdateTeacherDocumentInput = {
  title?: string;
  moduleId?: number;
  announcementId?: number;
};

type TeacherReclamationNoteRow = {
  reclamationId: number;
  note: string;
  updatedAt: Date;
};

type TeacherAnnouncementLinkRow = {
  annonceId: number;
  moduleId: number | null;
  scheduledFor: Date | null;
};

type TeacherDocumentRow = {
  id: number;
  title: string;
  filePath: string;
  mimeType: string | null;
  fileSize: bigint | null;
  moduleId: number | null;
  moduleName: string | null;
  moduleCode: string | null;
  annonceId: number | null;
  annonceTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CountRow = { count: bigint };

type TeacherProfileRow = {
  userId: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  photo: string | null;
  bureau: string | null;
  grade: string | null;
};

const uploadAnnouncementDir = path.join(process.cwd(), "uploads", "others", "teacher-announcements");
const uploadDocumentDir = path.join(process.cwd(), "uploads", "documents", "teacher");

const ANNOUNCEMENT_STATUS_DB_TO_UI: Record<StatusAnnonce, "draft" | "published" | "archived"> = {
  [StatusAnnonce.brouillon]: "draft",
  [StatusAnnonce.publie]: "published",
  [StatusAnnonce.archive]: "archived",
};

const ANNOUNCEMENT_STATUS_INPUT_TO_DB: Record<string, StatusAnnonce> = {
  draft: StatusAnnonce.brouillon,
  brouillon: StatusAnnonce.brouillon,
  unpublished: StatusAnnonce.brouillon,
  published: StatusAnnonce.publie,
  publie: StatusAnnonce.publie,
  archive: StatusAnnonce.archive,
  archived: StatusAnnonce.archive,
};

const ANNOUNCEMENT_TARGET_INPUT_TO_DB: Record<string, CibleAnnonce> = {
  all: CibleAnnonce.tous,
  tous: CibleAnnonce.tous,
  students: CibleAnnonce.etudiants,
  etudiants: CibleAnnonce.etudiants,
  teachers: CibleAnnonce.enseignants,
  enseignants: CibleAnnonce.enseignants,
  administration: CibleAnnonce.administration,
};

const ANNOUNCEMENT_TARGET_DB_TO_UI: Record<CibleAnnonce, "all" | "students" | "teachers" | "administration"> = {
  [CibleAnnonce.tous]: "all",
  [CibleAnnonce.etudiants]: "students",
  [CibleAnnonce.enseignants]: "teachers",
  [CibleAnnonce.administration]: "administration",
};

const ANNOUNCEMENT_PRIORITY_INPUT_TO_DB: Record<string, PrioriteAnnonce> = {
  low: PrioriteAnnonce.basse,
  basse: PrioriteAnnonce.basse,
  normal: PrioriteAnnonce.normale,
  normale: PrioriteAnnonce.normale,
  high: PrioriteAnnonce.haute,
  haute: PrioriteAnnonce.haute,
  urgent: PrioriteAnnonce.urgente,
  urgente: PrioriteAnnonce.urgente,
};

const ANNOUNCEMENT_PRIORITY_DB_TO_UI: Record<PrioriteAnnonce, "low" | "normal" | "high" | "urgent"> = {
  [PrioriteAnnonce.basse]: "low",
  [PrioriteAnnonce.normale]: "normal",
  [PrioriteAnnonce.haute]: "high",
  [PrioriteAnnonce.urgente]: "urgent",
};

const RECLAMATION_STATUS_UI_TO_DB: Record<TeacherReclamationStatus, StatusReclamation> = {
  pending: StatusReclamation.en_attente,
  approved: StatusReclamation.traitee,
  rejected: StatusReclamation.refusee,
};

const mapReclamationStatusToUi = (status: StatusReclamation): TeacherReclamationStatus => {
  if (status === StatusReclamation.traitee) return "approved";
  if (status === StatusReclamation.refusee) return "rejected";
  return "pending";
};

let supportTablesInitialized = false;

export class TeacherServiceError extends Error {
  code: string;

  statusCode: number;

  constructor(message: string, statusCode = 400, code = "TEACHER_SERVICE_ERROR") {
    super(message);
    this.name = "TeacherServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const ensureUploadDirs = async () => {
  await fs.mkdir(uploadAnnouncementDir, { recursive: true });
  await fs.mkdir(uploadDocumentDir, { recursive: true });
};

const ensureSupportTables = async () => {
  if (supportTablesInitialized) {
    return;
  }

  await ensureUploadDirs();

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS teacher_announcement_modules (
      annonce_id INTEGER PRIMARY KEY REFERENCES annonces(id) ON DELETE CASCADE,
      module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
      scheduled_for TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_teacher_announcement_modules_module_id
    ON teacher_announcement_modules(module_id)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS teacher_reclamation_notes (
      id SERIAL PRIMARY KEY,
      reclamation_id INTEGER NOT NULL REFERENCES reclamations(id) ON DELETE CASCADE,
      enseignant_id INTEGER NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (reclamation_id, enseignant_id)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_teacher_reclamation_notes_enseignant_id
    ON teacher_reclamation_notes(enseignant_id)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS teacher_course_documents (
      id SERIAL PRIMARY KEY,
      enseignant_id INTEGER NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE,
      module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
      annonce_id INTEGER REFERENCES annonces(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      mime_type VARCHAR(120),
      file_size BIGINT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_teacher_course_documents_enseignant_module
    ON teacher_course_documents(enseignant_id, module_id)
  `);

  supportTablesInitialized = true;
};

const normalizeStoredPath = (value: string): string => value.replace(/\\/g, "/").replace(/^\/+/, "");

const toFileUrl = (storedPath: string): string => {
  const normalized = normalizeStoredPath(storedPath);
  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }
  return `/${normalized}`;
};

const clampPage = (value?: number): number => {
  if (!value || !Number.isInteger(value) || value <= 0) return 1;
  return value;
};

const clampLimit = (value?: number): number => {
  if (!value || !Number.isInteger(value) || value <= 0) return 10;
  return Math.min(100, value);
};

const toNumber = (value: bigint): number => Number(value);

const parseOptionalDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const resolveAnnouncementTypeId = async (input: {
  typeId?: number;
  typeName?: string;
}): Promise<number | null> => {
  if (typeof input.typeId === "number" && input.typeId > 0) {
    const existing = await prisma.annonceType.findUnique({
      where: { id: input.typeId },
      select: { id: true },
    });

    if (!existing) {
      throw new TeacherServiceError("Announcement type not found", 404, "ANNOUNCEMENT_TYPE_NOT_FOUND");
    }

    return existing.id;
  }

  if (!input.typeName?.trim()) {
    return null;
  }

  const typeName = input.typeName.trim();
  const existing = await prisma.annonceType.findFirst({
    where: {
      OR: [
        { nom_ar: { equals: typeName, mode: "insensitive" } },
        { nom_en: { equals: typeName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.annonceType.create({
    data: { nom_ar: typeName },
    select: { id: true },
  });

  return created.id;
};

const resolveTeacherContext = async (userId: number): Promise<TeacherContext> => {
  const teacher = await prisma.enseignant.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
      enseignements: {
        select: {
          id: true,
          moduleId: true,
          promoId: true,
          module: {
            select: {
              id: true,
              nom_ar: true,
              nom_en: true,
              code: true,
            },
          },
          promo: {
            select: {
              id: true,
              nom_ar: true,
              nom_en: true,
              section: true,
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    throw new TeacherServiceError("Teacher profile not found", 404, "TEACHER_PROFILE_NOT_FOUND");
  }

  const courses = teacher.enseignements
    .filter((item) => item.moduleId && item.promoId && item.module && item.promo)
    .map((item) => ({
      enseignementId: item.id,
      moduleId: item.moduleId as number,
      moduleName: item.module?.nom_ar || item.module?.nom_en || "Unknown module",
      moduleCode: item.module?.code || "N/A",
      promoId: item.promoId as number,
      promoName: item.promo?.nom_ar || item.promo?.nom_en || "Unknown promo",
      section: item.promo?.section || "N/A",
    }));

  const uniqueModuleIds = Array.from(new Set(courses.map((course) => course.moduleId)));
  const uniquePromoIds = Array.from(new Set(courses.map((course) => course.promoId)));

  const modulePromoMap = new Map<number, number[]>();
  const moduleById = new Map<number, { id: number; name: string; code: string }>();

  courses.forEach((course) => {
    const currentPromos = modulePromoMap.get(course.moduleId) || [];
    if (!currentPromos.includes(course.promoId)) {
      currentPromos.push(course.promoId);
      modulePromoMap.set(course.moduleId, currentPromos);
    }

    if (!moduleById.has(course.moduleId)) {
      moduleById.set(course.moduleId, {
        id: course.moduleId,
        name: course.moduleName,
        code: course.moduleCode,
      });
    }
  });

  return {
    userId,
    enseignantId: teacher.id,
    fullName: `${teacher.user.prenom} ${teacher.user.nom}`.trim(),
    email: teacher.user.email,
    courses,
    moduleIds: uniqueModuleIds,
    promoIds: uniquePromoIds,
    modulePromoMap,
    moduleById,
  };
};

const assertTeacherCanManageModule = (context: TeacherContext, moduleId?: number | null) => {
  if (!moduleId) {
    return;
  }

  if (!context.moduleIds.includes(moduleId)) {
    throw new TeacherServiceError("You can only manage announcements/documents for your own courses", 403, "COURSE_ACCESS_FORBIDDEN");
  }
};

const resolveLocalPath = (storedPath: string): string | null => {
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

const removeStoredFileSafely = async (storedPath?: string | null): Promise<void> => {
  if (!storedPath) return;

  const resolved = resolveLocalPath(storedPath);
  if (!resolved) return;

  try {
    await fs.unlink(resolved);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code?: string }).code;
      if (code === "ENOENT") {
        return;
      }
    }

    throw error;
  }
};

const inferAnnouncementFileType = (file: Express.Multer.File): TypeFichierAnnonce => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  if (mime.includes("pdf") || extension === ".pdf") return TypeFichierAnnonce.pdf;
  if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(extension)) {
    return TypeFichierAnnonce.image;
  }
  if ([".doc", ".docx", ".txt", ".rtf", ".odt"].includes(extension)) return TypeFichierAnnonce.doc;
  return TypeFichierAnnonce.autre;
};

const mapAnnouncementStatusFilter = (value?: string): StatusAnnonce | null => {
  if (!value) return null;
  return ANNOUNCEMENT_STATUS_INPUT_TO_DB[value.trim().toLowerCase()] || null;
};

const mapAnnouncementTarget = (value?: string): CibleAnnonce => {
  if (!value?.trim()) return CibleAnnonce.etudiants;
  const mapped = ANNOUNCEMENT_TARGET_INPUT_TO_DB[value.trim().toLowerCase()];
  if (!mapped) {
    throw new TeacherServiceError("Invalid announcement target", 400, "INVALID_ANNOUNCEMENT_TARGET");
  }
  return mapped;
};

const mapAnnouncementPriority = (value?: string): PrioriteAnnonce => {
  if (!value?.trim()) return PrioriteAnnonce.normale;
  const mapped = ANNOUNCEMENT_PRIORITY_INPUT_TO_DB[value.trim().toLowerCase()];
  if (!mapped) {
    throw new TeacherServiceError("Invalid announcement priority", 400, "INVALID_ANNOUNCEMENT_PRIORITY");
  }
  return mapped;
};

const parseScheduledDate = (value?: string): Date | null => {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new TeacherServiceError("Invalid schedule date", 400, "INVALID_SCHEDULE_DATE");
  }
  return parsed;
};

const parseExpirationDate = (value?: string): Date | null => {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new TeacherServiceError("Invalid expiration date", 400, "INVALID_EXPIRATION_DATE");
  }
  return parsed;
};

const getAnnouncementLinks = async (announcementIds: number[]): Promise<Map<number, TeacherAnnouncementLinkRow>> => {
  const map = new Map<number, TeacherAnnouncementLinkRow>();

  if (!announcementIds.length) {
    return map;
  }

  const rows = await prisma.$queryRaw<TeacherAnnouncementLinkRow[]>(Prisma.sql`
    SELECT
      annonce_id AS "annonceId",
      module_id AS "moduleId",
      scheduled_for AS "scheduledFor"
    FROM teacher_announcement_modules
    WHERE annonce_id IN (${Prisma.join(announcementIds)})
  `);

  rows.forEach((row) => {
    map.set(row.annonceId, row);
  });

  return map;
};

const fetchTeacherReclamationNotes = async (
  enseignantId: number,
  reclamationIds: number[]
): Promise<Map<number, TeacherReclamationNoteRow>> => {
  const noteMap = new Map<number, TeacherReclamationNoteRow>();

  if (!reclamationIds.length) {
    return noteMap;
  }

  const rows = await prisma.$queryRaw<TeacherReclamationNoteRow[]>(Prisma.sql`
    SELECT
      reclamation_id AS "reclamationId",
      note,
      updated_at AS "updatedAt"
    FROM teacher_reclamation_notes
    WHERE enseignant_id = ${enseignantId}
      AND reclamation_id IN (${Prisma.join(reclamationIds)})
  `);

  rows.forEach((row) => noteMap.set(row.reclamationId, row));
  return noteMap;
};

const resolveTeacherAnnouncementAccess = async (announcementId: number, userId: number) => {
  const announcement = await prisma.annonce.findUnique({
    where: { id: announcementId },
    include: {
      documents: true,
      type: {
        select: {
          id: true,
          nom_ar: true,
          nom_en: true,
        },
      },
    },
  });

  if (!announcement) {
    throw new TeacherServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  if (announcement.auteurId !== userId) {
    throw new TeacherServiceError("You can only manage your own announcements", 403, "ANNOUNCEMENT_ACCESS_FORBIDDEN");
  }

  return announcement;
};

const resolveTeacherDocumentRecord = async (documentId: number, enseignantId: number) => {
  const rows = await prisma.$queryRaw<TeacherDocumentRow[]>(Prisma.sql`
    SELECT
      d.id,
      d.title,
      d.file_path AS "filePath",
      d.mime_type AS "mimeType",
      d.file_size AS "fileSize",
      d.module_id AS "moduleId",
      m.nom AS "moduleName",
      m.code AS "moduleCode",
      d.annonce_id AS "annonceId",
      a.titre AS "annonceTitle",
      d.created_at AS "createdAt",
      d.updated_at AS "updatedAt"
    FROM teacher_course_documents d
    LEFT JOIN modules m ON m.id = d.module_id
    LEFT JOIN annonces a ON a.id = d.annonce_id
    WHERE d.id = ${documentId}
      AND d.enseignant_id = ${enseignantId}
    LIMIT 1
  `);

  if (!rows.length) {
    throw new TeacherServiceError("Document not found", 404, "TEACHER_DOCUMENT_NOT_FOUND");
  }

  return rows[0];
};

const mapAnnouncementForTeacher = (
  announcement: Prisma.AnnonceGetPayload<{
    include: {
      documents: true;
      type: { select: { id: true; nom_ar: true; nom_en: true } };
    };
  }>,
  link?: TeacherAnnouncementLinkRow,
  moduleMeta?: { id: number; name: string; code: string }
) => {
  const baseStatus = ANNOUNCEMENT_STATUS_DB_TO_UI[announcement.status];
  const now = Date.now();
  const isScheduled = Boolean(link?.scheduledFor && new Date(link.scheduledFor).getTime() > now);

  return {
    id: announcement.id,
    title: announcement.titre_ar || announcement.titre_en || "Announcement",
    description: announcement.contenu_ar || announcement.contenu_en || "",
    type: announcement.type
      ? {
          id: announcement.type.id,
          name: announcement.type.nom_ar || announcement.type.nom_en || "N/A",
        }
      : null,
    status: isScheduled ? "scheduled" : baseStatus,
    rawStatus: baseStatus,
    target: ANNOUNCEMENT_TARGET_DB_TO_UI[announcement.cible],
    priority: ANNOUNCEMENT_PRIORITY_DB_TO_UI[announcement.priorite],
    scheduleAt: link?.scheduledFor || null,
    module: moduleMeta
      ? {
          id: moduleMeta.id,
          name: moduleMeta.name,
          code: moduleMeta.code,
        }
      : null,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
    publishedAt: announcement.datePublication,
    expiresAt: announcement.dateExpiration,
    attachments: announcement.documents.map((document) => {
      const normalizedPath = normalizeStoredPath(document.fichier);
      return {
        id: document.id,
        fileName: path.basename(normalizedPath),
        storedPath: normalizedPath,
        url: toFileUrl(normalizedPath),
        description: document.description_ar || document.description_en || null,
      };
    }),
  };
};

export const getTeacherDashboard = async (userId: number) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const [summary, pfeBreakdown, pfeBySpecialite, moduleBySpecialite, documentBreakdown, disciplineByType] = await Promise.all([
    buildTeacherStatistics({
      userId,
      enseignantId: context.enseignantId,
      promoIds: context.promoIds,
    }),
    getTeacherPfeBreakdown(context.enseignantId),
    getTeacherPfeBySpecialite(context.enseignantId),
    getTeacherModuleBySpecialite(context.enseignantId),
    getTeacherDocumentBreakdown(context.enseignantId),
    getTeacherDisciplineByType(context.enseignantId),
  ]);

  return {
    summary,
    pfeBreakdown,
    pfeBySpecialite,
    moduleBySpecialite,
    documentBreakdown,
    disciplineByType,
  };
};

export const listTeacherAnnouncements = async (userId: number, filters: TeacherAnnouncementFilters) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);

  const where: Prisma.AnnonceWhereInput = {
    auteurId: userId,
  };

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { titre_ar: { contains: search, mode: "insensitive" } },
      { titre_en: { contains: search, mode: "insensitive" } },
      { contenu_ar: { contains: search, mode: "insensitive" } },
      { contenu_en: { contains: search, mode: "insensitive" } },
      {
        type: {
          is: {
            OR: [
              { nom_ar: { contains: search, mode: "insensitive" } },
              { nom_en: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  if (filters.typeId) {
    where.typeId = filters.typeId;
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

  const statusFilter = mapAnnouncementStatusFilter(filters.status);
  if (filters.status?.trim() && !statusFilter && filters.status !== "scheduled") {
    throw new TeacherServiceError("Invalid announcement status filter", 400, "INVALID_STATUS_FILTER");
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  const announcements = await prisma.annonce.findMany({
    where,
    include: {
      type: {
        select: { id: true, nom_ar: true, nom_en: true },
      },
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const linksMap = await getAnnouncementLinks(announcements.map((item) => item.id));

  let mapped = announcements.map((announcement) => {
    const link = linksMap.get(announcement.id);
    const moduleMeta = link?.moduleId ? context.moduleById.get(link.moduleId) : undefined;
    return mapAnnouncementForTeacher(announcement, link, moduleMeta);
  });

  if (filters.moduleId) {
    assertTeacherCanManageModule(context, filters.moduleId);
    mapped = mapped.filter((item) => item.module?.id === filters.moduleId);
  }

  if (filters.status === "scheduled") {
    mapped = mapped.filter((item) => item.status === "scheduled");
  }

  const total = mapped.length;
  const paginated = mapped.slice((page - 1) * limit, page * limit);

  return {
    items: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    courses: context.courses,
  };
};

export const createTeacherAnnouncement = async (
  userId: number,
  input: CreateTeacherAnnouncementInput,
  files: Express.Multer.File[]
) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const title = input.title?.trim();
  const description = input.description?.trim();

  if (!title) {
    throw new TeacherServiceError("Announcement title is required", 400, "MISSING_ANNOUNCEMENT_TITLE");
  }

  if (!description) {
    throw new TeacherServiceError("Announcement description is required", 400, "MISSING_ANNOUNCEMENT_DESCRIPTION");
  }

  assertTeacherCanManageModule(context, input.moduleId);

  const typeId = await resolveAnnouncementTypeId({
    typeId: input.typeId,
    typeName: input.typeName,
  });

  const scheduledFor = parseScheduledDate(input.scheduleAt);
  const expirationDate = parseExpirationDate(input.expiresAt);

  const status = mapAnnouncementStatusFilter(input.status) || StatusAnnonce.publie;

  const created = await prisma.$transaction(async (tx) => {
    const announcement = await tx.annonce.create({
      data: {
        auteurId: userId,
        titre_ar: title,
        contenu_ar: description,
        typeId,
        status,
        cible: mapAnnouncementTarget(input.target),
        priorite: mapAnnouncementPriority(input.priority),
        datePublication: scheduledFor || new Date(),
        dateExpiration: expirationDate,
      },
      select: { id: true },
    });

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO teacher_announcement_modules (annonce_id, module_id, scheduled_for, created_at, updated_at)
      VALUES (${announcement.id}, ${input.moduleId}, ${scheduledFor}, NOW(), NOW())
      ON CONFLICT (annonce_id)
      DO UPDATE SET
        module_id = EXCLUDED.module_id,
        scheduled_for = EXCLUDED.scheduled_for,
        updated_at = NOW()
    `);

    if (files.length > 0) {
      await tx.annonceDocument.createMany({
        data: files.map((file) => ({
          annonceId: announcement.id,
          fichier: normalizeStoredPath(path.relative(process.cwd(), file.path)),
          type: inferAnnouncementFileType(file),
          description_ar: file.originalname || null,
          description_en: file.originalname || null,
        })),
      });
    }

    return announcement.id;
  });

  const createdRecord = await resolveTeacherAnnouncementAccess(created, userId);
  const link = (await getAnnouncementLinks([created])).get(created);
  const moduleMeta = input.moduleId ? context.moduleById.get(input.moduleId) : undefined;

  return mapAnnouncementForTeacher(createdRecord, link, moduleMeta);
};

export const updateTeacherAnnouncement = async (
  userId: number,
  announcementId: number,
  input: UpdateTeacherAnnouncementInput,
  files: Express.Multer.File[]
) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  await resolveTeacherAnnouncementAccess(announcementId, userId);
  const existingLink = (await getAnnouncementLinks([announcementId])).get(announcementId);

  const updateData: Prisma.AnnonceUpdateInput = {};

  if (typeof input.title === "string") {
    const nextTitle = input.title.trim();
    if (!nextTitle) {
      throw new TeacherServiceError("Announcement title cannot be empty", 400, "INVALID_ANNOUNCEMENT_TITLE");
    }
    updateData.titre_ar = nextTitle;
    updateData.titre_en = nextTitle;
  }

  if (typeof input.description === "string") {
    const nextDescription = input.description.trim();
    if (!nextDescription) {
      throw new TeacherServiceError("Announcement description cannot be empty", 400, "INVALID_ANNOUNCEMENT_DESCRIPTION");
    }
    updateData.contenu_ar = nextDescription;
  }

  if (typeof input.typeName === "string" || typeof input.typeId === "number") {
    const nextTypeId = await resolveAnnouncementTypeId({
      typeId: input.typeId,
      typeName: input.typeName,
    });

    updateData.type = nextTypeId
      ? { connect: { id: nextTypeId } }
      : { disconnect: true };
  }

  if (typeof input.status === "string") {
    const nextStatus = mapAnnouncementStatusFilter(input.status);
    if (!nextStatus) {
      throw new TeacherServiceError("Invalid announcement status", 400, "INVALID_ANNOUNCEMENT_STATUS");
    }
    updateData.status = nextStatus;
  }

  if (typeof input.target === "string") {
    updateData.cible = mapAnnouncementTarget(input.target);
  }

  if (typeof input.priority === "string") {
    updateData.priorite = mapAnnouncementPriority(input.priority);
  }

  if (typeof input.expiresAt === "string") {
    updateData.dateExpiration = parseExpirationDate(input.expiresAt);
  }

  const scheduledFor = typeof input.scheduleAt === "string"
    ? parseScheduledDate(input.scheduleAt)
    : existingLink?.scheduledFor || null;

  if (scheduledFor) {
    updateData.datePublication = scheduledFor;
  }

  const nextModuleId = input.moduleId ?? existingLink?.moduleId ?? null;
  assertTeacherCanManageModule(context, nextModuleId);

  const removeDocumentIds = Array.isArray(input.removeDocumentIds)
    ? Array.from(new Set(input.removeDocumentIds.filter((value) => Number.isInteger(value) && value > 0)))
    : [];

  let removedDocuments: Array<{ fichier: string }> = [];

  await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.annonce.update({
        where: { id: announcementId },
        data: updateData,
      });
    }

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO teacher_announcement_modules (annonce_id, module_id, scheduled_for, created_at, updated_at)
      VALUES (${announcementId}, ${nextModuleId}, ${scheduledFor}, NOW(), NOW())
      ON CONFLICT (annonce_id)
      DO UPDATE SET
        module_id = EXCLUDED.module_id,
        scheduled_for = EXCLUDED.scheduled_for,
        updated_at = NOW()
    `);

    if (removeDocumentIds.length > 0) {
      removedDocuments = await tx.annonceDocument.findMany({
        where: {
          annonceId: announcementId,
          id: { in: removeDocumentIds },
        },
        select: { fichier: true },
      });

      if (removedDocuments.length > 0) {
        await tx.annonceDocument.deleteMany({
          where: {
            annonceId: announcementId,
            id: { in: removeDocumentIds },
          },
        });
      }
    }

    if (files.length > 0) {
      await tx.annonceDocument.createMany({
        data: files.map((file) => ({
          annonceId: announcementId,
          fichier: normalizeStoredPath(path.relative(process.cwd(), file.path)),
          type: inferAnnouncementFileType(file),
          description_ar: file.originalname || null,
          description_en: file.originalname || null,
        })),
      });
    }
  });

  await Promise.all(removedDocuments.map((document) => removeStoredFileSafely(document.fichier)));

  const refreshed = await resolveTeacherAnnouncementAccess(announcementId, userId);
  const refreshedLink = (await getAnnouncementLinks([announcementId])).get(announcementId);
  const moduleMeta = refreshedLink?.moduleId ? context.moduleById.get(refreshedLink.moduleId) : undefined;

  return mapAnnouncementForTeacher(refreshed, refreshedLink, moduleMeta);
};

export const deleteTeacherAnnouncement = async (userId: number, announcementId: number) => {
  await ensureSupportTables();
  const existing = await resolveTeacherAnnouncementAccess(announcementId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      DELETE FROM teacher_announcement_modules
      WHERE annonce_id = ${announcementId}
    `);

    await tx.annonceDocument.deleteMany({ where: { annonceId: announcementId } });
    await tx.annonce.delete({ where: { id: announcementId } });
  });

  await Promise.all(existing.documents.map((document) => removeStoredFileSafely(document.fichier)));

  return {
    id: announcementId,
    deleted: true,
  };
};

export const listTeacherReclamations = async (userId: number, filters: TeacherReclamationFilters) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);

  let promoIds = context.promoIds;
  if (filters.moduleId) {
    assertTeacherCanManageModule(context, filters.moduleId);
    promoIds = context.modulePromoMap.get(filters.moduleId) || [];
  }

  if (!promoIds.length) {
    return {
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 1,
      },
    };
  }

  const where: Prisma.ReclamationWhereInput = {
    etudiant: {
      promoId: {
        in: promoIds,
      },
    },
  };

  if (filters.status?.trim()) {
    const status = filters.status.trim().toLowerCase();

    if (status === "pending") {
      where.status = {
        in: [StatusReclamation.soumise, StatusReclamation.en_attente, StatusReclamation.en_cours],
      };
    } else if (status === "approved") {
      where.status = StatusReclamation.traitee;
    } else if (status === "rejected") {
      where.status = StatusReclamation.refusee;
    } else {
      throw new TeacherServiceError("Invalid reclamation status filter", 400, "INVALID_RECLAMATION_STATUS_FILTER");
    }
  }

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { objet_ar: { contains: search, mode: "insensitive" } },
      { objet_en: { contains: search, mode: "insensitive" } },
      { description_ar: { contains: search, mode: "insensitive" } },
      { description_en: { contains: search, mode: "insensitive" } },
      {
        etudiant: {
          is: {
            matricule: { contains: search, mode: "insensitive" },
          },
        },
      },
      {
        etudiant: {
          is: {
            user: {
              is: {
                nom: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      },
      {
        etudiant: {
          is: {
            user: {
              is: {
                prenom: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      },
      {
        etudiant: {
          is: {
            user: {
              is: {
                email: { contains: search, mode: "insensitive" },
              },
            },
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

  const [total, records] = await Promise.all([
    prisma.reclamation.count({ where }),
    prisma.reclamation.findMany({
      where,
      include: {
        type: {
          select: {
            nom_ar: true,
            nom_en: true,
          },
        },
        etudiant: {
          select: {
            id: true,
            matricule: true,
            promoId: true,
            promo: {
              select: {
                nom_ar: true,
                nom_en: true,
                section: true,
              },
            },
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const notesMap = await fetchTeacherReclamationNotes(
    context.enseignantId,
    records.map((record) => record.id)
  );

  const items = records.map((record) => {
    const relatedModules = context.courses
      .filter((course) => course.promoId === record.etudiant.promoId)
      .map((course) => ({
        id: course.moduleId,
        name: course.moduleName,
        code: course.moduleCode,
      }));

    const internalNote = notesMap.get(record.id);

    return {
      id: record.id,
      title: record.objet_ar || record.objet_en || "Request",
      type: record.type?.nom_ar || record.type?.nom_en || "N/A",
      description: record.description_ar || record.description_en,
      status: mapReclamationStatusToUi(record.status),
      rawStatus: record.status,
      priority: record.priorite,
      response: record.reponse_ar || record.reponse_en,
      createdAt: record.createdAt,
      processedAt: record.dateTraitement,
      student: {
        id: record.etudiant.id,
        userId: record.etudiant.user.id,
        matricule: record.etudiant.matricule,
        nom: record.etudiant.user.nom,
        prenom: record.etudiant.user.prenom,
        email: record.etudiant.user.email,
        promo: record.etudiant.promo?.nom_ar || record.etudiant.promo?.nom_en || null,
        section: record.etudiant.promo?.section || null,
      },
      relatedModules,
      attachments: [],
      internalNote: internalNote?.note || "",
      internalNoteUpdatedAt: internalNote?.updatedAt || null,
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
  };
};

export const updateTeacherReclamation = async (
  userId: number,
  reclamationId: number,
  payload: UpdateTeacherReclamationInput
) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const reclamation = await prisma.reclamation.findUnique({
    where: { id: reclamationId },
    include: {
      type: {
        select: {
          nom_ar: true,
          nom_en: true,
        },
      },
      etudiant: {
        select: {
          id: true,
          promoId: true,
          matricule: true,
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
          promo: {
            select: {
              nom_ar: true,
              nom_en: true,
              section: true,
            },
          },
        },
      },
    },
  });

  if (!reclamation) {
    throw new TeacherServiceError("Reclamation not found", 404, "RECLAMATION_NOT_FOUND");
  }

  if (!context.promoIds.includes(reclamation.etudiant.promoId || -1)) {
    throw new TeacherServiceError("You can only manage reclamations from your course students", 403, "RECLAMATION_ACCESS_FORBIDDEN");
  }

  const nextStatus = RECLAMATION_STATUS_UI_TO_DB[payload.status];
  if (!nextStatus) {
    throw new TeacherServiceError("Invalid reclamation status", 400, "INVALID_RECLAMATION_STATUS");
  }

  await prisma.reclamation.update({
    where: { id: reclamationId },
    data: {
      status: nextStatus,
      reponse_ar: payload.response?.trim() || null,
      reponse_en: payload.response?.trim() || null,
      traitePar: userId,
      dateTraitement: new Date(),
    },
  });

  const workflowStage = payload.status === "pending" ? "under_review" : "teacher_response";
  const workflowAction = payload.status === "pending" ? "start_review" : "teacher_feedback";

  await appendRequestWorkflowEvent({
    requestCategory: "reclamation",
    requestId: reclamationId,
    stage: workflowStage,
    action: workflowAction,
    actorUserId: userId,
    actorRoles: ["enseignant"],
    note: payload.response?.trim() || undefined,
    metadata: {
      teacherDecision: payload.status,
      mappedStatus: nextStatus,
      enseignantId: context.enseignantId,
    },
  });

  await writeAuditLogSafe({
    eventKey: "teacher.reclamation.updated",
    action: "update-status",
    entityType: "reclamation",
    entityId: reclamationId,
    actorUserId: userId,
    actorRoles: ["enseignant"],
    payload: {
      status: payload.status,
      mappedStatus: nextStatus,
      enseignantId: context.enseignantId,
    },
  });

  if (typeof payload.internalNote === "string") {
    const trimmedNote = payload.internalNote.trim();
    if (trimmedNote) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO teacher_reclamation_notes (reclamation_id, enseignant_id, note, created_at, updated_at)
        VALUES (${reclamationId}, ${context.enseignantId}, ${trimmedNote}, NOW(), NOW())
        ON CONFLICT (reclamation_id, enseignant_id)
        DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()
      `);
    }
  }

  const notesMap = await fetchTeacherReclamationNotes(context.enseignantId, [reclamationId]);
  const internalNote = notesMap.get(reclamationId);

  const relatedModules = context.courses
    .filter((course) => course.promoId === reclamation.etudiant.promoId)
    .map((course) => ({
      id: course.moduleId,
      name: course.moduleName,
      code: course.moduleCode,
    }));

  return {
    id: reclamation.id,
    title: reclamation.objet_ar || reclamation.objet_en || "Request",
    type: reclamation.type?.nom_ar || reclamation.type?.nom_en || "N/A",
    description: reclamation.description_ar || reclamation.description_en,
    status: payload.status,
    response: payload.response?.trim() || null,
    processedAt: new Date(),
    student: {
      id: reclamation.etudiant.id,
      userId: reclamation.etudiant.user.id,
      matricule: reclamation.etudiant.matricule,
      nom: reclamation.etudiant.user.nom,
      prenom: reclamation.etudiant.user.prenom,
      email: reclamation.etudiant.user.email,
      promo: reclamation.etudiant.promo?.nom_ar || reclamation.etudiant.promo?.nom_en || null,
      section: reclamation.etudiant.promo?.section || null,
    },
    relatedModules,
    internalNote: internalNote?.note || "",
    internalNoteUpdatedAt: internalNote?.updatedAt || null,
  };
};

export const listTeacherStudents = async (userId: number, filters: TeacherStudentFilters) => {
  const context = await resolveTeacherContext(userId);

  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);

  // PFE-only scope: a teacher sees the students registered under PFE topics
  // they own (PfeSujet.enseignantId) or in groups they co-supervise
  // (GroupPfe.coEncadrantId). No promo / module / section filtering.
  const pfeScope: Prisma.EtudiantWhereInput = {
    groupMembers: {
      some: {
        group: {
          OR: [
            { coEncadrantId: context.enseignantId },
            { sujetFinal: { enseignantId: context.enseignantId } },
          ],
        },
      },
    },
  };

  const where: Prisma.EtudiantWhereInput = { ...pfeScope };

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { matricule: { contains: search, mode: "insensitive" } },
      { user: { is: { nom: { contains: search, mode: "insensitive" } } } },
      { user: { is: { prenom: { contains: search, mode: "insensitive" } } } },
      { user: { is: { email: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [total, students] = await Promise.all([
    prisma.etudiant.count({ where }),
    prisma.etudiant.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
        promo: {
          select: {
            id: true,
            nom_ar: true,
            nom_en: true,
          },
        },
        groupMembers: {
          where: {
            group: {
              OR: [
                { coEncadrantId: context.enseignantId },
                { sujetFinal: { enseignantId: context.enseignantId } },
              ],
            },
          },
          select: {
            group: {
              select: {
                id: true,
                nom_ar: true,
                nom_en: true,
                sujetFinal: {
                  select: { id: true, titre_ar: true, titre_en: true },
                },
              },
            },
          },
        },
      },
      orderBy: { user: { nom: "asc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const items = students.map((student) => {
    const pfeGroup = student.groupMembers[0]?.group ?? null;
    return {
      id: student.id,
      userId: student.userId,
      matricule: student.matricule,
      nom: student.user.nom,
      prenom: student.user.prenom,
      email: student.user.email,
      telephone: student.user.telephone,
      moyenne: student.moyenne ? Number(student.moyenne) : null,
      promo: student.promo
        ? {
            id: student.promo.id,
            nom: student.promo.nom_ar || student.promo.nom_en,
          }
        : null,
      pfeGroup: pfeGroup
        ? {
            id: pfeGroup.id,
            name: pfeGroup.nom_en || pfeGroup.nom_ar,
            subjectTitle:
              pfeGroup.sujetFinal?.titre_en || pfeGroup.sujetFinal?.titre_ar || null,
          }
        : null,
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
  };
};

export const getTeacherStudentReclamationHistory = async (userId: number, studentId: number) => {
  const context = await resolveTeacherContext(userId);

  const student = await prisma.etudiant.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      promoId: true,
      matricule: true,
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
      promo: {
        select: {
          nom_ar: true,
          nom_en: true,
          section: true,
        },
      },
    },
  });

  if (!student) {
    throw new TeacherServiceError("Student not found", 404, "STUDENT_NOT_FOUND");
  }

  if (!student.promoId || !context.promoIds.includes(student.promoId)) {
    throw new TeacherServiceError("You can only access students enrolled in your courses", 403, "STUDENT_ACCESS_FORBIDDEN");
  }

  const reclamations = await prisma.reclamation.findMany({
    where: { etudiantId: student.id },
    include: {
      type: {
        select: {
          nom_ar: true,
          nom_en: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const notesMap = await fetchTeacherReclamationNotes(
    context.enseignantId,
    reclamations.map((item) => item.id)
  );

  const relatedCourses = context.courses
    .filter((course) => course.promoId === student.promoId)
    .map((course) => ({
      moduleId: course.moduleId,
      moduleName: course.moduleName,
      moduleCode: course.moduleCode,
    }));

  return {
    student: {
      id: student.id,
      userId: student.user.id,
      matricule: student.matricule,
      nom: student.user.nom,
      prenom: student.user.prenom,
      email: student.user.email,
      promo: student.promo,
      relatedCourses,
    },
    reclamations: reclamations.map((reclamation) => ({
      id: reclamation.id,
      title: reclamation.objet_ar || reclamation.objet_en || "Request",
      type: reclamation.type?.nom_ar || reclamation.type?.nom_en || "N/A",
      description: reclamation.description_ar || reclamation.description_en,
      status: mapReclamationStatusToUi(reclamation.status),
      rawStatus: reclamation.status,
      response: reclamation.reponse_ar || reclamation.reponse_en,
      createdAt: reclamation.createdAt,
      processedAt: reclamation.dateTraitement,
      internalNote: notesMap.get(reclamation.id)?.note || "",
      internalNoteUpdatedAt: notesMap.get(reclamation.id)?.updatedAt || null,
    })),
  };
};

export const listTeacherDocuments = async (userId: number, filters: TeacherDocumentFilters) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);

  if (filters.moduleId) {
    assertTeacherCanManageModule(context, filters.moduleId);
  }

  if (filters.announcementId) {
    await resolveTeacherAnnouncementAccess(filters.announcementId, userId);
  }

  const search = filters.search?.trim();

  const conditions: Prisma.Sql[] = [Prisma.sql`d.enseignant_id = ${context.enseignantId}`];

  if (filters.moduleId) {
    conditions.push(Prisma.sql`d.module_id = ${filters.moduleId}`);
  }

  if (filters.announcementId) {
    conditions.push(Prisma.sql`d.annonce_id = ${filters.announcementId}`);
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      Prisma.sql`(
        d.title ILIKE ${pattern}
        OR d.file_path ILIKE ${pattern}
        OR COALESCE(m.nom, '') ILIKE ${pattern}
        OR COALESCE(a.titre, '') ILIKE ${pattern}
      )`
    );
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

  const rows = await prisma.$queryRaw<TeacherDocumentRow[]>(Prisma.sql`
    SELECT
      d.id,
      d.title,
      d.file_path AS "filePath",
      d.mime_type AS "mimeType",
      d.file_size AS "fileSize",
      d.module_id AS "moduleId",
      m.nom AS "moduleName",
      m.code AS "moduleCode",
      d.annonce_id AS "annonceId",
      a.titre AS "annonceTitle",
      d.created_at AS "createdAt",
      d.updated_at AS "updatedAt"
    FROM teacher_course_documents d
    LEFT JOIN modules m ON m.id = d.module_id
    LEFT JOIN annonces a ON a.id = d.annonce_id
    ${whereSql}
    ORDER BY d.created_at DESC
    LIMIT ${limit}
    OFFSET ${(page - 1) * limit}
  `);

  const countRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM teacher_course_documents d
    LEFT JOIN modules m ON m.id = d.module_id
    LEFT JOIN annonces a ON a.id = d.annonce_id
    ${whereSql}
  `);

  const total = countRows.length ? toNumber(countRows[0].count) : 0;

  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      fileName: path.basename(normalizeStoredPath(row.filePath)),
      storedPath: normalizeStoredPath(row.filePath),
      url: toFileUrl(normalizeStoredPath(row.filePath)),
      mimeType: row.mimeType,
      fileSize: row.fileSize ? toNumber(row.fileSize) : null,
      module: row.moduleId
        ? {
            id: row.moduleId,
            name: row.moduleName,
            code: row.moduleCode,
          }
        : null,
      announcement: row.annonceId
        ? {
            id: row.annonceId,
            title: row.annonceTitle,
          }
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const createTeacherDocument = async (
  userId: number,
  input: CreateTeacherDocumentInput,
  file: Express.Multer.File
) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const title = input.title?.trim();
  if (!title) {
    throw new TeacherServiceError("Document title is required", 400, "MISSING_DOCUMENT_TITLE");
  }

  if (!file) {
    throw new TeacherServiceError("Document file is required", 400, "MISSING_DOCUMENT_FILE");
  }

  if (input.moduleId) {
    assertTeacherCanManageModule(context, input.moduleId);
  }

  if (input.announcementId) {
    await resolveTeacherAnnouncementAccess(input.announcementId, userId);
  }

  const storedPath = normalizeStoredPath(path.relative(process.cwd(), file.path));

  const inserted = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    INSERT INTO teacher_course_documents (
      enseignant_id,
      module_id,
      annonce_id,
      title,
      file_path,
      mime_type,
      file_size,
      created_at,
      updated_at
    )
    VALUES (
      ${context.enseignantId},
      ${input.moduleId || null},
      ${input.announcementId || null},
      ${title},
      ${storedPath},
      ${file.mimetype || null},
      ${file.size || null},
      NOW(),
      NOW()
    )
    RETURNING id
  `);

  const documentId = inserted[0]?.id;
  if (!documentId) {
    throw new TeacherServiceError("Failed to create document", 500, "CREATE_DOCUMENT_FAILED");
  }

  const document = await resolveTeacherDocumentRecord(documentId, context.enseignantId);

  return {
    id: document.id,
    title: document.title,
    fileName: path.basename(normalizeStoredPath(document.filePath)),
    storedPath: normalizeStoredPath(document.filePath),
    url: toFileUrl(normalizeStoredPath(document.filePath)),
    mimeType: document.mimeType,
    fileSize: document.fileSize ? toNumber(document.fileSize) : null,
    module: document.moduleId
      ? {
          id: document.moduleId,
          name: document.moduleName,
          code: document.moduleCode,
        }
      : null,
    announcement: document.annonceId
      ? {
          id: document.annonceId,
          title: document.annonceTitle,
        }
      : null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};

export const updateTeacherDocument = async (
  userId: number,
  documentId: number,
  input: UpdateTeacherDocumentInput,
  file?: Express.Multer.File
) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const existing = await resolveTeacherDocumentRecord(documentId, context.enseignantId);

  const nextTitle = typeof input.title === "string" ? input.title.trim() : existing.title;
  if (!nextTitle) {
    throw new TeacherServiceError("Document title cannot be empty", 400, "INVALID_DOCUMENT_TITLE");
  }

  const nextModuleId = input.moduleId !== undefined ? input.moduleId || null : existing.moduleId;
  const nextAnnouncementId = input.announcementId !== undefined ? input.announcementId || null : existing.annonceId;

  if (nextModuleId) {
    assertTeacherCanManageModule(context, nextModuleId);
  }

  if (nextAnnouncementId) {
    await resolveTeacherAnnouncementAccess(nextAnnouncementId, userId);
  }

  const nextStoredPath = file
    ? normalizeStoredPath(path.relative(process.cwd(), file.path))
    : normalizeStoredPath(existing.filePath);

  await prisma.$executeRaw(Prisma.sql`
    UPDATE teacher_course_documents
    SET
      title = ${nextTitle},
      module_id = ${nextModuleId},
      annonce_id = ${nextAnnouncementId},
      file_path = ${nextStoredPath},
      mime_type = ${file ? file.mimetype || null : existing.mimeType},
      file_size = ${file ? file.size || null : existing.fileSize},
      updated_at = NOW()
    WHERE id = ${documentId}
      AND enseignant_id = ${context.enseignantId}
  `);

  if (file) {
    await removeStoredFileSafely(existing.filePath);
  }

  const updated = await resolveTeacherDocumentRecord(documentId, context.enseignantId);

  return {
    id: updated.id,
    title: updated.title,
    fileName: path.basename(normalizeStoredPath(updated.filePath)),
    storedPath: normalizeStoredPath(updated.filePath),
    url: toFileUrl(normalizeStoredPath(updated.filePath)),
    mimeType: updated.mimeType,
    fileSize: updated.fileSize ? toNumber(updated.fileSize) : null,
    module: updated.moduleId
      ? {
          id: updated.moduleId,
          name: updated.moduleName,
          code: updated.moduleCode,
        }
      : null,
    announcement: updated.annonceId
      ? {
          id: updated.annonceId,
          title: updated.annonceTitle,
        }
      : null,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
};

export const deleteTeacherDocument = async (userId: number, documentId: number) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);

  const existing = await resolveTeacherDocumentRecord(documentId, context.enseignantId);

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM teacher_course_documents
    WHERE id = ${documentId}
      AND enseignant_id = ${context.enseignantId}
  `);

  await removeStoredFileSafely(existing.filePath);

  return {
    id: documentId,
    deleted: true,
  };
};

export const getTeacherDocumentDownloadInfo = async (userId: number, documentId: number) => {
  await ensureSupportTables();
  const context = await resolveTeacherContext(userId);
  const existing = await resolveTeacherDocumentRecord(documentId, context.enseignantId);

  const resolvedPath = resolveLocalPath(existing.filePath);
  if (!resolvedPath) {
    throw new TeacherServiceError("Document path is invalid", 400, "INVALID_DOCUMENT_PATH");
  }

  try {
    await fs.stat(resolvedPath);
  } catch (_error) {
    throw new TeacherServiceError("Document file missing on server", 404, "DOCUMENT_FILE_MISSING");
  }

  return {
    absolutePath: resolvedPath,
    fileName: path.basename(normalizeStoredPath(existing.filePath)),
  };
};

export const getTeacherProfile = async (userId: number) => {
  const rows = await prisma.$queryRaw<TeacherProfileRow[]>(Prisma.sql`
    SELECT
      u.id AS "userId",
      u.nom,
      u.prenom,
      u.email,
      u.telephone,
      u.photo,
      e.bureau,
      g.nom AS grade
    FROM enseignants e
    INNER JOIN users u ON u.id = e.user_id
    LEFT JOIN grades g ON g.id = e.grade_id
    WHERE e.user_id = ${userId}
    LIMIT 1
  `);

  if (!rows.length) {
    throw new TeacherServiceError("Teacher profile not found", 404, "TEACHER_PROFILE_NOT_FOUND");
  }

  const profile = rows[0];

  return {
    userId: profile.userId,
    nom: profile.nom,
    prenom: profile.prenom,
    email: profile.email,
    telephone: profile.telephone,
    photo: profile.photo,
    bureau: profile.bureau,
    grade: profile.grade,
  };
};

export const updateTeacherProfile = async (
  userId: number,
  payload: {
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    bureau?: string;
  }
) => {
  const teacher = await prisma.enseignant.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!teacher) {
    throw new TeacherServiceError("Teacher profile not found", 404, "TEACHER_PROFILE_NOT_FOUND");
  }

  const userUpdateData: Prisma.UserUpdateInput = {};

  if (typeof payload.nom === "string") {
    const nom = payload.nom.trim();
    if (!nom) {
      throw new TeacherServiceError("Nom cannot be empty", 400, "INVALID_PROFILE_NAME");
    }
    userUpdateData.nom = nom;
  }

  if (typeof payload.prenom === "string") {
    const prenom = payload.prenom.trim();
    if (!prenom) {
      throw new TeacherServiceError("Prenom cannot be empty", 400, "INVALID_PROFILE_FIRSTNAME");
    }
    userUpdateData.prenom = prenom;
  }

  if (typeof payload.email === "string") {
    const email = payload.email.trim().toLowerCase();
    if (!email) {
      throw new TeacherServiceError("Email cannot be empty", 400, "INVALID_PROFILE_EMAIL");
    }
    userUpdateData.email = email;
  }

  if (typeof payload.telephone === "string") {
    userUpdateData.telephone = payload.telephone.trim() || null;
  }

  try {
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: userUpdateData,
      });
    }

    if (typeof payload.bureau === "string") {
      await prisma.enseignant.update({
        where: { id: teacher.id },
        data: {
          bureau: payload.bureau.trim() || null,
        },
      });
    }
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code?: string }).code;
      if (code === "P2002") {
        throw new TeacherServiceError("Email is already used by another account", 409, "EMAIL_ALREADY_EXISTS");
      }
    }
    throw error;
  }

  return getTeacherProfile(userId);
};

export const changeTeacherPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  await changePassword(userId, currentPassword, newPassword);
  return {
    changed: true,
  };
};
