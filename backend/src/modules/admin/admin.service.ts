import { promises as fs } from "fs";
import path from "path";
import {
  CibleAnnonce,
  PrioriteAnnonce,
  Prisma,
  StatusAnnonce,
  StatusReclamation,
  TypeFichierAnnonce,
  UserStatus,
} from "@prisma/client";
import prisma from "../../config/database";

export type AdminPanelRole = "admin" | "teacher" | "student";
export type AdminReclamationStatus = "pending" | "approved" | "rejected";
export type AdminDocumentKind = "announcement" | "request" | "justification";

type PaginationInput = {
  page?: number;
  limit?: number;
};

type DashboardOverview = {
  totals: {
    users: number;
    announcements: number;
    reclamations: number;
  };
  usersByStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  reclamationsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
};

type UserListFilters = PaginationInput & {
  search?: string;
  status?: string;
  role?: string;
};

type AnnouncementListFilters = PaginationInput & {
  search?: string;
  status?: string;
  target?: string;
};

type ReclamationListFilters = PaginationInput & {
  search?: string;
  status?: string;
};

type DocumentListFilters = PaginationInput & {
  search?: string;
  kind?: string;
};

type AnnouncementInput = {
  title?: string;
  content?: string;
  status?: string;
  target?: string;
  priority?: string;
  typeName?: string;
  typeId?: number;
  expiresAt?: string;
  removeDocumentIds?: number[];
};

type ReclamationUpdateInput = {
  status: AdminReclamationStatus;
  adminResponse?: string;
};

const ROLE_INPUT_TO_DB: Record<string, string> = {
  admin: "admin",
  teacher: "enseignant",
  student: "etudiant",
  enseignant: "enseignant",
  etudiant: "etudiant",
};

const DB_ROLE_TO_ADMIN_ROLE: Record<string, AdminPanelRole> = {
  admin: "admin",
  enseignant: "teacher",
  etudiant: "student",
};

const ANNOUNCEMENT_STATUS_INPUT_TO_DB: Record<string, StatusAnnonce> = {
  draft: StatusAnnonce.brouillon,
  brouillon: StatusAnnonce.brouillon,
  published: StatusAnnonce.publie,
  publie: StatusAnnonce.publie,
  archived: StatusAnnonce.archive,
  archive: StatusAnnonce.archive,
};

const ANNOUNCEMENT_STATUS_DB_TO_UI: Record<StatusAnnonce, "draft" | "published" | "archived"> = {
  [StatusAnnonce.brouillon]: "draft",
  [StatusAnnonce.publie]: "published",
  [StatusAnnonce.archive]: "archived",
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

const RECLAMATION_STATUS_UI_TO_DB: Record<AdminReclamationStatus, StatusReclamation> = {
  pending: StatusReclamation.en_attente,
  approved: StatusReclamation.traitee,
  rejected: StatusReclamation.refusee,
};

export class AdminServiceError extends Error {
  statusCode: number;

  code: string;

  constructor(message: string, statusCode = 400, code = "ADMIN_SERVICE_ERROR") {
    super(message);
    this.name = "AdminServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const clampPage = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const clampLimit = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 10;
  return Math.min(parsed, 100);
};

const normalizeStoredPath = (storedPath: string): string => storedPath.replace(/\\/g, "/").replace(/^\/+/, "");

const toPublicFileUrl = (storedPath?: string | null): string | null => {
  if (!storedPath) return null;
  const normalized = normalizeStoredPath(storedPath);
  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }
  return null;
};

const toCanonicalRole = (roles: string[]): AdminPanelRole => {
  const mapped = roles
    .map((roleName) => DB_ROLE_TO_ADMIN_ROLE[roleName])
    .filter((role): role is AdminPanelRole => Boolean(role));

  if (mapped.includes("admin")) return "admin";
  if (mapped.includes("teacher")) return "teacher";
  return "student";
};

const mapReclamationStatusToUi = (status: StatusReclamation): AdminReclamationStatus => {
  if (status === StatusReclamation.traitee) return "approved";
  if (status === StatusReclamation.refusee) return "rejected";
  return "pending";
};

const resolveLocalFilePath = (storedPath: string): string | null => {
  if (!storedPath || /^https?:\/\//i.test(storedPath)) {
    return null;
  }

  const absolute = path.isAbsolute(storedPath)
    ? storedPath
    : path.join(process.cwd(), storedPath);

  const normalizedRoot = path.normalize(process.cwd()).toLowerCase();
  const normalizedAbsolute = path.normalize(absolute);

  if (!normalizedAbsolute.toLowerCase().startsWith(normalizedRoot)) {
    return null;
  }

  return normalizedAbsolute;
};

const removeFileSafely = async (storedPath?: string | null): Promise<void> => {
  if (!storedPath) return;

  const resolvedPath = resolveLocalFilePath(storedPath);
  if (!resolvedPath) return;

  try {
    await fs.unlink(resolvedPath);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const maybeCode = (error as { code?: string }).code;
      if (maybeCode === "ENOENT") {
        return;
      }
    }
    throw error;
  }
};

const inferAnnouncementFileType = (file: Express.Multer.File): TypeFichierAnnonce => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  if (mime.includes("pdf") || extension === ".pdf") {
    return TypeFichierAnnonce.pdf;
  }

  if (mime.startsWith("image/") || [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(extension)) {
    return TypeFichierAnnonce.image;
  }

  if ([".doc", ".docx", ".txt", ".rtf", ".odt"].includes(extension)) {
    return TypeFichierAnnonce.doc;
  }

  return TypeFichierAnnonce.autre;
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
      throw new AdminServiceError("Announcement type not found", 404, "ANNOUNCEMENT_TYPE_NOT_FOUND");
    }

    return existing.id;
  }

  if (!input.typeName?.trim()) {
    return null;
  }

  const typeName = input.typeName.trim();
  const existingType = await prisma.annonceType.findFirst({
    where: {
      OR: [
        { nom_ar: { equals: typeName, mode: "insensitive" } },
        { nom_en: { equals: typeName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (existingType) {
    return existingType.id;
  }

  const createdType = await prisma.annonceType.create({
    data: { nom_ar: typeName },
    select: { id: true },
  });

  return createdType.id;
};

type AnnouncementRecord = Prisma.AnnonceGetPayload<{
  include: {
    auteur: {
      select: {
        id: true;
        nom: true;
        prenom: true;
        email: true;
      };
    };
    type: {
      select: {
        id: true;
        nom_ar: true;
        nom_en: true;
      };
    };
    documents: true;
  };
}>;

const mapAnnouncementRecord = (announcement: AnnouncementRecord) => ({
  id: announcement.id,
  title: announcement.titre_ar || announcement.titre_en || "Announcement",
  content: announcement.contenu_ar || announcement.contenu_en || "",
  status: ANNOUNCEMENT_STATUS_DB_TO_UI[announcement.status],
  target: ANNOUNCEMENT_TARGET_DB_TO_UI[announcement.cible],
  priority: ANNOUNCEMENT_PRIORITY_DB_TO_UI[announcement.priorite],
  type: announcement.type
    ? {
        id: announcement.type.id,
        name: announcement.type.nom_ar || announcement.type.nom_en || null,
      }
    : null,
  publishedAt: announcement.datePublication,
  expiresAt: announcement.dateExpiration,
  createdAt: announcement.createdAt,
  updatedAt: announcement.updatedAt,
  author: {
    id: announcement.auteur.id,
    email: announcement.auteur.email,
    nom: announcement.auteur.nom,
    prenom: announcement.auteur.prenom,
  },
  documents: announcement.documents.map((document) => {
    const normalizedPath = normalizeStoredPath(document.fichier);

    return {
      id: document.id,
      description: document.description_ar || document.description_en || null,
      type: document.type,
      storedPath: normalizedPath,
      fileName: path.basename(normalizedPath),
      publicUrl: toPublicFileUrl(normalizedPath),
      downloadUrl: `/api/v1/admin/documents/announcement/${document.id}/download`,
      createdAt: document.createdAt,
    };
  }),
  attachmentCount: announcement.documents.length,
});

const parseUserStatusFilter = (value?: string): UserStatus | null => {
  if (!value) return null;
  const lowered = value.trim().toLowerCase();
  if (lowered === "active") return UserStatus.active;
  if (lowered === "inactive") return UserStatus.inactive;
  if (lowered === "suspended") return UserStatus.suspended;
  return null;
};

const parseDocumentKind = (value?: string): AdminDocumentKind | null => {
  if (!value) return null;
  const lowered = value.trim().toLowerCase();
  if (lowered === "announcement") return "announcement";
  if (lowered === "request") return "request";
  if (lowered === "justification") return "justification";
  return null;
};

const parseAnnouncementStatus = (value?: string): StatusAnnonce | null => {
  if (!value) return null;
  return ANNOUNCEMENT_STATUS_INPUT_TO_DB[value.trim().toLowerCase()] || null;
};

const parseAnnouncementTarget = (value?: string): CibleAnnonce | null => {
  if (!value) return null;
  return ANNOUNCEMENT_TARGET_INPUT_TO_DB[value.trim().toLowerCase()] || null;
};

const parseAnnouncementPriority = (value?: string): PrioriteAnnonce | null => {
  if (!value) return null;
  return ANNOUNCEMENT_PRIORITY_INPUT_TO_DB[value.trim().toLowerCase()] || null;
};

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const [
    users,
    announcements,
    reclamations,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    pendingReclamations,
    approvedReclamations,
    rejectedReclamations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.annonce.count(),
    prisma.reclamation.count(),
    prisma.user.count({ where: { status: UserStatus.active } }),
    prisma.user.count({ where: { status: UserStatus.inactive } }),
    prisma.user.count({ where: { status: UserStatus.suspended } }),
    prisma.reclamation.count({
      where: {
        status: {
          in: [StatusReclamation.soumise, StatusReclamation.en_cours, StatusReclamation.en_attente],
        },
      },
    }),
    prisma.reclamation.count({ where: { status: StatusReclamation.traitee } }),
    prisma.reclamation.count({ where: { status: StatusReclamation.refusee } }),
  ]);

  return {
    totals: {
      users,
      announcements,
      reclamations,
    },
    usersByStatus: {
      active: activeUsers,
      inactive: inactiveUsers,
      suspended: suspendedUsers,
    },
    reclamationsByStatus: {
      pending: pendingReclamations,
      approved: approvedReclamations,
      rejected: rejectedReclamations,
    },
  };
};

export const listUsers = async (filters: UserListFilters) => {
  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);
  const searchTerm = filters.search?.trim();

  const where: Prisma.UserWhereInput = {};

  if (searchTerm) {
    where.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { nom: { contains: searchTerm, mode: "insensitive" } },
      { prenom: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const statusFilter = parseUserStatusFilter(filters.status);
  if (filters.status && !statusFilter) {
    throw new AdminServiceError("Invalid status filter", 400, "INVALID_STATUS_FILTER");
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  if (filters.role?.trim()) {
    const requestedRole = ROLE_INPUT_TO_DB[filters.role.trim().toLowerCase()];
    if (!requestedRole) {
      throw new AdminServiceError("Invalid role filter", 400, "INVALID_ROLE_FILTER");
    }

    where.userRoles = {
      some: {
        role: {
          nom: requestedRole,
        },
      },
    };
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        userRoles: {
          select: {
            role: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const items = users.map((user) => {
    const roleNames = user.userRoles
      .map((userRole) => userRole.role.nom)
      .filter((roleName): roleName is string => Boolean(roleName));

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      status: user.status,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      roles: roleNames,
      role: toCanonicalRole(roleNames),
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

export const updateUserRole = async (userId: number, roleInput: string) => {
  const roleName = ROLE_INPUT_TO_DB[roleInput.trim().toLowerCase()];
  if (!roleName) {
    throw new AdminServiceError("Invalid role value. Allowed: admin, teacher, student", 400, "INVALID_ROLE");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AdminServiceError("User not found", 404, "USER_NOT_FOUND");
  }

  const role = await prisma.role.findFirst({
    where: {
      nom: {
        equals: roleName,
        mode: "insensitive",
      },
    },
    select: { id: true, nom: true },
  });

  if (!role) {
    throw new AdminServiceError(`Role '${roleName}' does not exist in database`, 404, "ROLE_NOT_FOUND");
  }

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });

    await tx.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });

    if ((role.nom || "").toLowerCase() === "enseignant") {
      await tx.enseignant.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    }

    if ((role.nom || "").toLowerCase() === "etudiant") {
      await tx.etudiant.upsert({
        where: { userId },
        update: {},
        // Matricule is NOT NULL since the academic-year migration; placeholder
        // for first-touch role grant, overwritten later via student update.
        create: { userId, matricule: `TMP-${userId}` },
      });
    }
  });

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      status: true,
      createdAt: true,
      lastLogin: true,
      userRoles: {
        select: {
          role: {
            select: {
              nom: true,
            },
          },
        },
      },
    },
  });

  if (!updated) {
    throw new AdminServiceError("User not found after update", 404, "USER_NOT_FOUND");
  }

  const roles = updated.userRoles
    .map((item) => item.role.nom)
    .filter((name): name is string => Boolean(name));

  return {
    id: updated.id,
    email: updated.email,
    nom: updated.nom,
    prenom: updated.prenom,
    telephone: updated.telephone,
    status: updated.status,
    createdAt: updated.createdAt,
    lastLogin: updated.lastLogin,
    roles,
    role: toCanonicalRole(roles),
  };
};

export const deleteUser = async (userId: number, requesterUserId: number) => {
  if (userId === requesterUserId) {
    throw new AdminServiceError("You cannot delete your own account", 400, "SELF_DELETE_FORBIDDEN");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      etudiant: { select: { id: true } },
      enseignant: { select: { id: true } },
    },
  });

  if (!targetUser) {
    throw new AdminServiceError("User not found", 404, "USER_NOT_FOUND");
  }

  if (targetUser.etudiant || targetUser.enseignant) {
    const suspended = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.suspended },
      select: { id: true, status: true },
    });

    return {
      deleted: false,
      mode: "soft" as const,
      message: "User has linked academic records and was suspended instead of hard-deleted.",
      userId: suspended.id,
      status: suspended.status,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.annonce.updateMany({
        where: { auteurId: userId },
        data: { auteurId: requesterUserId },
      });

      await tx.reclamation.updateMany({
        where: { traitePar: userId },
        data: { traitePar: null },
      });

      await tx.justification.updateMany({
        where: { traitePar: userId },
        data: { traitePar: null },
      });

      await tx.userRole.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return {
      deleted: true,
      mode: "hard" as const,
      message: "User deleted permanently.",
      userId,
    };
  } catch (_error) {
    const suspended = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.suspended },
      select: { id: true, status: true },
    });

    return {
      deleted: false,
      mode: "soft" as const,
      message: "User has linked records and was suspended instead of hard-deleted.",
      userId: suspended.id,
      status: suspended.status,
    };
  }
};

export const listAnnouncements = async (filters: AnnouncementListFilters) => {
  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);
  const searchTerm = filters.search?.trim();

  const where: Prisma.AnnonceWhereInput = {};

  const statusFilter = parseAnnouncementStatus(filters.status);
  if (filters.status && !statusFilter) {
    throw new AdminServiceError("Invalid announcement status filter", 400, "INVALID_ANNOUNCEMENT_STATUS");
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  const targetFilter = parseAnnouncementTarget(filters.target);
  if (filters.target && !targetFilter) {
    throw new AdminServiceError("Invalid announcement target filter", 400, "INVALID_ANNOUNCEMENT_TARGET");
  }
  if (targetFilter) {
    where.cible = targetFilter;
  }

  if (searchTerm) {
    where.OR = [
      { titre_ar: { contains: searchTerm, mode: "insensitive" } },
      { titre_en: { contains: searchTerm, mode: "insensitive" } },
      { contenu_ar: { contains: searchTerm, mode: "insensitive" } },
      { contenu_en: { contains: searchTerm, mode: "insensitive" } },
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

  const [total, records] = await Promise.all([
    prisma.annonce.count({ where }),
    prisma.annonce.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        type: {
          select: {
            id: true,
            nom_ar: true,
            nom_en: true,
          },
        },
        documents: true,
      },
    }),
  ]);

  return {
    items: records.map(mapAnnouncementRecord),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const createAnnouncement = async (
  authorUserId: number,
  input: AnnouncementInput,
  files: Express.Multer.File[]
) => {
  const title = input.title?.trim();
  const content = input.content?.trim();

  if (!title) {
    throw new AdminServiceError("Announcement title is required", 400, "MISSING_ANNOUNCEMENT_TITLE");
  }

  if (!content) {
    throw new AdminServiceError("Announcement content is required", 400, "MISSING_ANNOUNCEMENT_CONTENT");
  }

  const typeId = await resolveAnnouncementTypeId({
    typeId: input.typeId,
    typeName: input.typeName,
  });

  const status = parseAnnouncementStatus(input.status) || StatusAnnonce.publie;
  const target = parseAnnouncementTarget(input.target) || CibleAnnonce.tous;
  const priority = parseAnnouncementPriority(input.priority) || PrioriteAnnonce.normale;
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new AdminServiceError("Invalid expiration date", 400, "INVALID_EXPIRATION_DATE");
  }

  const created = await prisma.$transaction(async (tx) => {
    const announcement = await tx.annonce.create({
      data: {
        titre_ar: title,
        contenu_ar: content,
        auteurId: authorUserId,
        typeId,
        status,
        cible: target,
        priorite: priority,
        datePublication: new Date(),
        dateExpiration: expiresAt,
      },
      select: { id: true },
    });

    if (files.length > 0) {
      await tx.annonceDocument.createMany({
        data: files.map((file) => ({
          annonceId: announcement.id,
          fichier: normalizeStoredPath(path.relative(process.cwd(), file.path)),
          type: inferAnnouncementFileType(file),
          description: file.originalname || null,
        })),
      });
    }

    return announcement.id;
  });

  const announcementRecord = await prisma.annonce.findUnique({
    where: { id: created },
    include: {
      auteur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
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

  if (!announcementRecord) {
    throw new AdminServiceError("Announcement not found after creation", 500, "ANNOUNCEMENT_CREATION_FAILED");
  }

  return mapAnnouncementRecord(announcementRecord);
};

export const updateAnnouncement = async (
  announcementId: number,
  input: AnnouncementInput,
  files: Express.Multer.File[]
) => {
  const existing = await prisma.annonce.findUnique({
    where: { id: announcementId },
    select: { id: true },
  });

  if (!existing) {
    throw new AdminServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  const updateData: Prisma.AnnonceUpdateInput = {};

  if (typeof input.title === "string") {
    const title = input.title.trim();
    if (!title) {
      throw new AdminServiceError("Announcement title cannot be empty", 400, "INVALID_ANNOUNCEMENT_TITLE");
    }
    updateData.titre_ar = title;
  }

  if (typeof input.content === "string") {
    const content = input.content.trim();
    if (!content) {
      throw new AdminServiceError("Announcement content cannot be empty", 400, "INVALID_ANNOUNCEMENT_CONTENT");
    }
    updateData.contenu_ar = content;
  }

  if (typeof input.status === "string") {
    const status = parseAnnouncementStatus(input.status);
    if (!status) {
      throw new AdminServiceError("Invalid announcement status", 400, "INVALID_ANNOUNCEMENT_STATUS");
    }
    updateData.status = status;
  }

  if (typeof input.target === "string") {
    const target = parseAnnouncementTarget(input.target);
    if (!target) {
      throw new AdminServiceError("Invalid announcement target", 400, "INVALID_ANNOUNCEMENT_TARGET");
    }
    updateData.cible = target;
  }

  if (typeof input.priority === "string") {
    const priority = parseAnnouncementPriority(input.priority);
    if (!priority) {
      throw new AdminServiceError("Invalid announcement priority", 400, "INVALID_ANNOUNCEMENT_PRIORITY");
    }
    updateData.priorite = priority;
  }

  if (typeof input.expiresAt === "string") {
    const expiresAt = input.expiresAt.trim() ? new Date(input.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new AdminServiceError("Invalid expiration date", 400, "INVALID_EXPIRATION_DATE");
    }
    updateData.dateExpiration = expiresAt;
  }

  if (typeof input.typeName === "string" || typeof input.typeId === "number") {
    const typeId = await resolveAnnouncementTypeId({
      typeId: input.typeId,
      typeName: input.typeName,
    });
    updateData.type = typeId
      ? { connect: { id: typeId } }
      : { disconnect: true };
  }

  let removedDocuments: Array<{ fichier: string }> = [];

  const updated = await prisma.$transaction(async (tx) => {
    if (input.removeDocumentIds && input.removeDocumentIds.length > 0) {
      removedDocuments = await tx.annonceDocument.findMany({
        where: {
          annonceId: announcementId,
          id: { in: input.removeDocumentIds },
        },
        select: { fichier: true },
      });

      if (removedDocuments.length > 0) {
        await tx.annonceDocument.deleteMany({
          where: {
            annonceId: announcementId,
            id: { in: input.removeDocumentIds },
          },
        });
      }
    }

    await tx.annonce.update({
      where: { id: announcementId },
      data: updateData,
    });

    if (files.length > 0) {
      await tx.annonceDocument.createMany({
        data: files.map((file) => ({
          annonceId: announcementId,
          fichier: normalizeStoredPath(path.relative(process.cwd(), file.path)),
          type: inferAnnouncementFileType(file),
          description: file.originalname || null,
        })),
      });
    }

    return tx.annonce.findUnique({
      where: { id: announcementId },
      include: {
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
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
  });

  await Promise.all(removedDocuments.map((document) => removeFileSafely(document.fichier)));

  if (!updated) {
    throw new AdminServiceError("Announcement not found after update", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  return mapAnnouncementRecord(updated);
};

export const deleteAnnouncement = async (announcementId: number) => {
  const existing = await prisma.annonce.findUnique({
    where: { id: announcementId },
    include: {
      documents: {
        select: {
          fichier: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AdminServiceError("Announcement not found", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  await prisma.$transaction(async (tx) => {
    await tx.annonceDocument.deleteMany({ where: { annonceId: announcementId } });
    await tx.annonce.delete({ where: { id: announcementId } });
  });

  await Promise.all(existing.documents.map((document) => removeFileSafely(document.fichier)));

  return {
    id: announcementId,
    deleted: true,
  };
};

export const listReclamations = async (filters: ReclamationListFilters) => {
  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);
  const searchTerm = filters.search?.trim();

  const where: Prisma.ReclamationWhereInput = {};

  if (searchTerm) {
    where.OR = [
      { objet_ar: { contains: searchTerm, mode: "insensitive" } },
      { objet_en: { contains: searchTerm, mode: "insensitive" } },
      { description_ar: { contains: searchTerm, mode: "insensitive" } },
      { description_en: { contains: searchTerm, mode: "insensitive" } },
      {
        etudiant: {
          is: {
            user: {
              is: {
                nom: { contains: searchTerm, mode: "insensitive" },
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
                prenom: { contains: searchTerm, mode: "insensitive" },
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
                email: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
        },
      },
    ];
  }

  if (filters.status?.trim()) {
    const status = filters.status.trim().toLowerCase();

    if (status === "pending") {
      where.status = {
        in: [StatusReclamation.soumise, StatusReclamation.en_cours, StatusReclamation.en_attente],
      };
    } else if (status === "approved") {
      where.status = StatusReclamation.traitee;
    } else if (status === "rejected") {
      where.status = StatusReclamation.refusee;
    } else {
      throw new AdminServiceError("Invalid reclamation status filter", 400, "INVALID_RECLAMATION_STATUS_FILTER");
    }
  }

  const [total, records] = await Promise.all([
    prisma.reclamation.count({ where }),
    prisma.reclamation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
            promo: {
              select: {
                nom_ar: true,
                nom_en: true,
                section: true,
              },
            },
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const items = records.map((record) => ({
    id: record.id,
    title: record.objet_ar || record.objet_en || "Request",
    description: record.description_ar || record.description_en || "",
    type: record.type.nom_ar || record.type.nom_en || "N/A",
    priority: record.priorite,
    status: mapReclamationStatusToUi(record.status),
    rawStatus: record.status,
    adminResponse: record.reponse_ar || record.reponse_en || null,
    submittedAt: record.createdAt,
    processedAt: record.dateTraitement,
    student: {
      id: record.etudiant.id,
      matricule: record.etudiant.matricule,
      nom: record.etudiant.user.nom,
      prenom: record.etudiant.user.prenom,
      email: record.etudiant.user.email,
      promo: record.etudiant.promo?.nom_ar || record.etudiant.promo?.nom_en || null,
      section: record.etudiant.promo?.section || null,
    },
  }));

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

export const updateReclamation = async (
  reclamationId: number,
  adminUserId: number,
  input: ReclamationUpdateInput
) => {
  const nextStatus = RECLAMATION_STATUS_UI_TO_DB[input.status];
  if (!nextStatus) {
    throw new AdminServiceError("Invalid reclamation status", 400, "INVALID_RECLAMATION_STATUS");
  }

  const updated = await prisma.reclamation.update({
    where: { id: reclamationId },
    data: {
      status: nextStatus,
      reponse_ar: input.adminResponse?.trim() || null,
      traitePar: adminUserId,
      dateTraitement: new Date(),
    },
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
          promo: {
            select: {
              nom_ar: true,
              nom_en: true,
              section: true,
            },
          },
          user: {
            select: {
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return {
    id: updated.id,
    title: updated.objet_ar || updated.objet_en || "Request",
    description: updated.description_ar || updated.description_en || "",
    type: updated.type.nom_ar || updated.type.nom_en || "N/A",
    priority: updated.priorite,
    status: mapReclamationStatusToUi(updated.status),
    rawStatus: updated.status,
    adminResponse: updated.reponse_ar || updated.reponse_en || null,
    submittedAt: updated.createdAt,
    processedAt: updated.dateTraitement,
    student: {
      id: updated.etudiant.id,
      matricule: updated.etudiant.matricule,
      nom: updated.etudiant.user.nom,
      prenom: updated.etudiant.user.prenom,
      email: updated.etudiant.user.email,
      promo: updated.etudiant.promo?.nom_ar || updated.etudiant.promo?.nom_en || null,
      section: updated.etudiant.promo?.section || null,
    },
  };
};

type AdminDocumentItem = {
  id: string;
  numericId: number;
  kind: AdminDocumentKind;
  fileName: string;
  storedPath: string;
  publicUrl: string | null;
  downloadUrl: string;
  createdAt: Date;
  linkedEntity: {
    type: string;
    id: number;
    title: string;
  };
};

export const listDocuments = async (filters: DocumentListFilters) => {
  const page = clampPage(filters.page);
  const limit = clampLimit(filters.limit);
  const searchTerm = filters.search?.trim();
  const kindFilter = parseDocumentKind(filters.kind);

  if (filters.kind && !kindFilter) {
    throw new AdminServiceError("Invalid document kind filter", 400, "INVALID_DOCUMENT_KIND");
  }

  const items: AdminDocumentItem[] = [];

  if (!kindFilter || kindFilter === "announcement") {
    const announcementDocs = await prisma.annonceDocument.findMany({
      where: searchTerm
        ? {
            OR: [
              { fichier: { contains: searchTerm, mode: "insensitive" } },
              { description_ar: { contains: searchTerm, mode: "insensitive" } },
              { description_en: { contains: searchTerm, mode: "insensitive" } },
              {
                annonce: {
                  is: {
                    OR: [
                      { titre_ar: { contains: searchTerm, mode: "insensitive" } },
                      { titre_en: { contains: searchTerm, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : undefined,
      include: {
        annonce: {
          select: {
            id: true,
            titre_ar: true,
            titre_en: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    announcementDocs.forEach((document) => {
      const normalizedPath = normalizeStoredPath(document.fichier);
      items.push({
        id: `announcement-${document.id}`,
        numericId: document.id,
        kind: "announcement",
        fileName: path.basename(normalizedPath),
        storedPath: normalizedPath,
        publicUrl: toPublicFileUrl(normalizedPath),
        downloadUrl: `/api/v1/admin/documents/announcement/${document.id}/download`,
        createdAt: document.createdAt,
        linkedEntity: {
          type: "announcement",
          id: document.annonce.id,
          title: document.annonce.titre_ar || document.annonce.titre_en || "Announcement",
        },
      });
    });
  }

  if (!kindFilter || kindFilter === "request") {
    const requestDocuments = await prisma.documentRequest.findMany({
      where: {
        documentUrl: { not: null },
        ...(searchTerm
          ? {
              OR: [
                { documentUrl: { contains: searchTerm, mode: "insensitive" } },
                { description_ar: { contains: searchTerm, mode: "insensitive" } },
                { description_en: { contains: searchTerm, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [
        { dateTraitement: "desc" },
        { dateDemande: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        documentUrl: true,
        description_ar: true,
        description_en: true,
        dateDemande: true,
        dateTraitement: true,
      },
    });

    requestDocuments.forEach((document) => {
      const storedPath = normalizeStoredPath(document.documentUrl || "");
      items.push({
        id: `request-${document.id}`,
        numericId: document.id,
        kind: "request",
        fileName: path.basename(storedPath),
        storedPath,
        publicUrl: toPublicFileUrl(storedPath),
        downloadUrl: `/api/v1/admin/documents/request/${document.id}/download`,
        createdAt: document.dateTraitement || document.dateDemande || new Date(0),
        linkedEntity: {
          type: "document-request",
          id: document.id,
          title: document.description_ar || document.description_en || `Document request #${document.id}`,
        },
      });
    });
  }

  if (!kindFilter || kindFilter === "justification") {
    const justificationDocuments = await prisma.justification.findMany({
      where: {
        document: { not: null },
        ...(searchTerm
          ? {
              OR: [
                { document: { contains: searchTerm, mode: "insensitive" } },
                { motif_ar: { contains: searchTerm, mode: "insensitive" } },
                { motif_en: { contains: searchTerm, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        document: true,
        motif_ar: true,
        motif_en: true,
        createdAt: true,
      },
    });

    justificationDocuments.forEach((document) => {
      const storedPath = normalizeStoredPath(document.document || "");
      items.push({
        id: `justification-${document.id}`,
        numericId: document.id,
        kind: "justification",
        fileName: path.basename(storedPath),
        storedPath,
        publicUrl: toPublicFileUrl(storedPath),
        downloadUrl: `/api/v1/admin/documents/justification/${document.id}/download`,
        createdAt: document.createdAt,
        linkedEntity: {
          type: "justification",
          id: document.id,
          title: document.motif_ar || document.motif_en || `Justification #${document.id}`,
        },
      });
    });
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
      request: items.filter((item) => item.kind === "request").length,
      justification: items.filter((item) => item.kind === "justification").length,
    },
  };
};

export const getDocumentDownloadInfo = async (kind: AdminDocumentKind, id: number) => {
  let storedPath: string | null = null;

  if (kind === "announcement") {
    const document = await prisma.annonceDocument.findUnique({
      where: { id },
      select: { fichier: true },
    });
    storedPath = document?.fichier || null;
  }

  if (kind === "request") {
    const document = await prisma.documentRequest.findUnique({
      where: { id },
      select: { documentUrl: true },
    });
    storedPath = document?.documentUrl || null;
  }

  if (kind === "justification") {
    const document = await prisma.justification.findUnique({
      where: { id },
      select: { document: true },
    });
    storedPath = document?.document || null;
  }

  if (!storedPath) {
    throw new AdminServiceError("Document file not found", 404, "DOCUMENT_NOT_FOUND");
  }

  const normalizedPath = normalizeStoredPath(storedPath);
  const localPath = resolveLocalFilePath(normalizedPath);

  if (!localPath) {
    throw new AdminServiceError("Document file is not stored locally", 400, "DOCUMENT_NOT_LOCAL");
  }

  try {
    await fs.stat(localPath);
  } catch (_error) {
    throw new AdminServiceError("Document file missing on server", 404, "DOCUMENT_FILE_MISSING");
  }

  return {
    absolutePath: localPath,
    fileName: path.basename(normalizedPath),
  };
};

export const deleteDocument = async (kind: AdminDocumentKind, id: number) => {
  if (kind === "announcement") {
    const document = await prisma.annonceDocument.findUnique({
      where: { id },
      select: { fichier: true },
    });

    if (!document) {
      throw new AdminServiceError("Announcement document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    await prisma.annonceDocument.delete({ where: { id } });
    await removeFileSafely(document.fichier);
  }

  if (kind === "request") {
    const document = await prisma.documentRequest.findUnique({
      where: { id },
      select: { documentUrl: true },
    });

    if (!document?.documentUrl) {
      throw new AdminServiceError("Request document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    await prisma.documentRequest.update({
      where: { id },
      data: {
        documentUrl: null,
      },
    });

    await removeFileSafely(document.documentUrl);
  }

  if (kind === "justification") {
    const document = await prisma.justification.findUnique({
      where: { id },
      select: { document: true },
    });

    if (!document?.document) {
      throw new AdminServiceError("Justification document not found", 404, "DOCUMENT_NOT_FOUND");
    }

    await prisma.justification.update({
      where: { id },
      data: {
        document: null,
      },
    });

    await removeFileSafely(document.document);
  }

  return {
    kind,
    id,
    deleted: true,
  };
};

/* ─────────────────────────────────────────────────────────────
   UNIVERSAL HISTORY ENDPOINT
   ───────────────────────────────────────────────────────────── */

export type HistoryEntry = {
  id: string;
  date: Date;
  category: string;
  title: string;
  status: string;
  description?: string;
};

export type UserHistoryResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    role: AdminPanelRole;
    status: string;
    department?: string;
    joinedAt: Date;
  };
  role: AdminPanelRole;
  tabs: Array<{
    id: string;
    label: string;
    icon: string;
    items: HistoryEntry[];
    total: number;
  }>;
};

export const getUserUniversalHistory = async (userId: number): Promise<UserHistoryResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            select: { nom: true },
          },
        },
      },
      enseignant: true,
      etudiant: {
        include: {
          promo: true,
        },
      },
    },
  });

  if (!user) {
    throw new AdminServiceError("User not found", 404, "USER_NOT_FOUND");
  }

  const roleNames = (user.userRoles || [])
    .map((ur: any) => ur.role?.nom)
    .filter((name: any): name is string => Boolean(name));
  const canonicalRole = toCanonicalRole(roleNames);

  const department = (user.etudiant as any)?.promo?.nom_ar || undefined;

  const baseResponse: UserHistoryResponse = {
    user: {
      id: user.id,
      name: `${user.prenom} ${user.nom}`,
      email: user.email,
      role: canonicalRole,
      status: user.status,
      department,
      joinedAt: user.createdAt,
    },
    role: canonicalRole,
    tabs: [],
  };

  if (canonicalRole === "teacher" && (user.enseignant as any)) {
    const enseignantId = (user.enseignant as any).id;

    const [disciplinaryData, projectsData, documentsData] = await Promise.all([
      // Disciplinary files where this teacher reported
      prisma.dossierDisciplinaire.findMany({
        where: {
          enseignantSignalant: enseignantId,
        },
        include: {
          etudiant: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      // Proposed Projects (PFE subjects)
      prisma.pfeSujet.findMany({
        where: {
          enseignantId: enseignantId,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      // Documents Requested
      prisma.documentRequest.findMany({
        where: {
          enseignantId: enseignantId,
        },
        orderBy: { dateDemande: "desc" },
        take: 100,
      }),
    ]);

    baseResponse.tabs = [
      {
        id: "disciplinary",
        label: "Disciplined Students",
        icon: "AlertTriangle",
        items: disciplinaryData.map((dc: any) => ({
          id: `case-${dc.id}`,
          date: dc.createdAt,
          category: "Disciplinary Case",
          title: `${dc.etudiant?.user?.prenom || ""} ${dc.etudiant?.user?.nom || ""}`,
          status: dc.status || "signale",
          description: dc.descriptionSignal_ar || dc.descriptionSignal_en || undefined,
        })),
        total: disciplinaryData.length,
      },
      {
        id: "projects",
        label: "Proposed Projects",
        icon: "BookOpen",
        items: projectsData.map((project: any) => ({
          id: `project-${project.id}`,
          date: project.createdAt,
          category: "PFE Subject",
          title: project.titre_ar || project.titre_en || "Untitled",
          status: project.status || "propose",
          description: project.description_ar || project.description_en || undefined,
        })),
        total: projectsData.length,
      },
      {
        id: "documents",
        label: "Documents Demanded",
        icon: "FileText",
        items: documentsData.map((doc: any) => ({
          id: `doc-${doc.id}`,
          date: doc.dateDemande || doc.createdAt || new Date(0),
          category: "Document Request",
          title: doc.description_ar || doc.description_en || "Document Request",
          status: doc.status || "en_attente",
          description: undefined,
        })),
        total: documentsData.length,
      },
    ];
  } else if (canonicalRole === "student" && (user.etudiant as any)) {
    const etudiantId = (user.etudiant as any).id;

    const [reclamationsData, justificationsData, voeuData, disciplinaryData] = await Promise.all([
      // Reclamations (grade/admin appeals)
      prisma.reclamation.findMany({
        where: {
          etudiantId: etudiantId,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      // Justifications
      prisma.justification.findMany({
        where: {
          etudiantId: etudiantId,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      // PFE Journey (voeux - wishes/choices)
      prisma.voeu.findMany({
        where: {
          etudiantId: etudiantId,
        },
        include: {
          specialite: true,
        },
        orderBy: { dateSaisie: "desc" },
        take: 100,
      }),
      // Disciplinary History
      prisma.dossierDisciplinaire.findMany({
        where: {
          etudiantId: etudiantId,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    baseResponse.tabs = [
      {
        id: "reclamations",
        label: "Reclamations",
        icon: "FileQuestion",
        items: reclamationsData.map((rec: any) => ({
          id: `reclamation-${rec.id}`,
          date: rec.createdAt,
          category: "Reclamation",
          title: rec.objet_ar || rec.objet_en || "Appeal",
          status: rec.status,
          description: rec.description_ar || rec.description_en || undefined,
        })),
        total: reclamationsData.length,
      },
      {
        id: "justifications",
        label: "Justifications",
        icon: "CheckCircle",
        items: justificationsData.map((just: any) => ({
          id: `justification-${just.id}`,
          date: just.createdAt,
          category: "Justification",
          title: just.motif_ar || just.motif_en || "Justification",
          status: just.status || "soumis",
          description: just.details_ar || just.details_en || undefined,
        })),
        total: justificationsData.length,
      },
      {
        id: "pfe-journey",
        label: "PFE Choices",
        icon: "Briefcase",
        items: voeuData.map((voeu: any) => ({
          id: `voeu-${voeu.id}`,
          date: voeu.dateSaisie,
          category: "Specialite Choice",
          title: voeu.specialite?.nom_ar || voeu.specialite?.nom_en || "Specialite",
          status: voeu.status || "en_attente",
          description: `Ordre: ${voeu.ordre}`,
        })),
        total: voeuData.length,
      },
      {
        id: "disciplinary",
        label: "Disciplinary History",
        icon: "AlertTriangle",
        items: disciplinaryData.map((dc: any) => ({
          id: `discipline-${dc.id}`,
          date: dc.createdAt,
          category: "Disciplinary Case",
          title: dc.descriptionSignal_ar || dc.descriptionSignal_en || "Case",
          status: dc.status || "signale",
          description: undefined,
        })),
        total: disciplinaryData.length,
      },
    ];
  }

  return baseResponse;
};
