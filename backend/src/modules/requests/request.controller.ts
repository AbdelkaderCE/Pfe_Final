import { Response } from "express";
import prisma from "../../config/database";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Prisma, StatusJustification, StatusReclamation, SubmissionStatus, SubmissionType } from "@prisma/client";
import path from "path";
import { writeAuditLogSafe } from "../../shared/audit-log.service";
import {
  appendRequestWorkflowEvent,
  ensureRequestWorkflowHistoryTable,
  ensureRequestWorkflowSubmitted,
  listRequestWorkflowHistory,
  loadLatestWorkflowStageMap,
  mapJustificationStatusToWorkflowStage,
  mapReclamationStatusToWorkflowStage,
  RequestWorkflowAction,
  RequestWorkflowCategory,
  RequestWorkflowStage,
} from "../requests/workflow.service";
import { ensureLocalUploadDirectory } from "../../shared/local-upload.service";
import { TERMINAL_STATUSES } from "../../shared/status-lock";

type RequestAttachmentPayload = {
  id: number | string;
  name: string;
  type: string;
  size: string;
  mimeType: string | null;
  fileSize: number | null;
  url: string | null;
  downloadUrl: string | null;
  isImage: boolean;
  createdAt: Date | null;
};

type ReclamationDocumentRow = {
  id: number;
  reclamationId: number;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: bigint | number | null;
  createdAt: Date;
};

type JustificationDocumentRow = {
  id: number;
  justificationId: number;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: bigint | number | null;
  createdAt: Date;
};

let requestSupportTablesInitialized = false;
let requestSupportTablesInitPromise: Promise<void> | null = null;

const executeSafe = async (query: string) => {
  try {
    await prisma.$executeRawUnsafe(query);
  } catch (e: any) {
    if (e?.meta?.code === '23505' || (e?.message && e.message.includes('23505'))) return;
    throw e;
  }
};

const normalizeStoredPath = (storedPath: string): string =>
  storedPath.replace(/\\/g, "/").replace(/^\/+/, "");

const toPublicFileUrl = (storedPath?: string | null): string | null => {
  if (!storedPath) {
    return null;
  }

  if (/^https?:\/\//i.test(storedPath)) {
    return storedPath;
  }

  const normalized = normalizeStoredPath(storedPath);
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  return `/uploads/${normalized.replace(/^uploads\//, "")}`;
};

const toNumber = (value: bigint | number | null | undefined): number | null => {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return null;
};

const formatAttachmentSize = (value: bigint | number | null | undefined): string => {
  const size = toNumber(value);
  if (!size || Number.isNaN(size) || size <= 0) {
    return "N/A";
  }

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const inferAttachmentKind = (mimeType?: string | null, fileName?: string): string => {
  const mime = String(mimeType || "").toLowerCase();
  const extension = path.extname(fileName || "").toLowerCase();

  if (
    mime.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"].includes(extension)
  ) {
    return "Image";
  }

  if (mime === "application/pdf" || extension === ".pdf") {
    return "PDF";
  }

  if (mime.startsWith("text/") || extension === ".txt") {
    return "Text";
  }

  return "Document";
};

const buildAttachmentPayload = (input: {
  id: number | string;
  filePath: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: bigint | number | null;
  createdAt?: Date | null;
}): RequestAttachmentPayload => {
  const normalizedFileName =
    input.fileName?.trim() || path.basename(normalizeStoredPath(input.filePath || "attachment"));
  const kind = inferAttachmentKind(input.mimeType, normalizedFileName);
  const publicUrl = toPublicFileUrl(input.filePath);

  return {
    id: input.id,
    name: normalizedFileName,
    type: kind,
    size: formatAttachmentSize(input.fileSize),
    mimeType: input.mimeType || null,
    fileSize: toNumber(input.fileSize),
    url: publicUrl,
    downloadUrl: publicUrl,
    isImage: kind === "Image",
    createdAt: input.createdAt || null,
  };
};

const parseLegacyJustificationAttachments = (rawDocument?: string | null): RequestAttachmentPayload[] => {
  const rawValue = String(rawDocument || "").trim();
  if (!rawValue) {
    return [];
  }

  const attachments: RequestAttachmentPayload[] = [];

  if (rawValue.startsWith("[") || rawValue.startsWith("{")) {
    try {
      const parsed = JSON.parse(rawValue);
      const values = Array.isArray(parsed) ? parsed : [parsed];

      values.forEach((entry, index) => {
        if (!entry || typeof entry !== "object") {
          return;
        }

        const filePath = String(
          (entry as Record<string, unknown>).filePath ||
            (entry as Record<string, unknown>).path ||
            (entry as Record<string, unknown>).url ||
            ""
        ).trim();

        if (!filePath) {
          return;
        }

        const fileName = String(
          (entry as Record<string, unknown>).fileName ||
            (entry as Record<string, unknown>).name ||
            path.basename(filePath)
        ).trim();

        const mimeType = String((entry as Record<string, unknown>).mimeType || "").trim() || null;
        const fileSize = Number((entry as Record<string, unknown>).fileSize || 0);
        const createdAtRaw = (entry as Record<string, unknown>).createdAt;
        const createdAt = createdAtRaw ? new Date(String(createdAtRaw)) : null;

        attachments.push(
          buildAttachmentPayload({
            id: `legacy-${index}-${fileName}`,
            filePath,
            fileName,
            mimeType,
            fileSize: Number.isFinite(fileSize) && fileSize > 0 ? fileSize : null,
            createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null,
          })
        );
      });

      if (attachments.length) {
        return attachments;
      }
    } catch {
      // Fallback to legacy plain string path
    }
  }

  return [
    buildAttachmentPayload({
      id: `legacy-${path.basename(rawValue)}`,
      filePath: rawValue,
      fileName: path.basename(rawValue),
      mimeType: null,
      fileSize: null,
      createdAt: null,
    }),
  ];
};

export const ensureRequestSupportTables = async () => {
  if (requestSupportTablesInitialized) {
    return;
  }

  if (!requestSupportTablesInitPromise) {
    requestSupportTablesInitPromise = (async () => {
      ensureLocalUploadDirectory("others", "student-requests");

      await executeSafe(`
        CREATE TABLE IF NOT EXISTS student_reclamation_documents (
          id SERIAL PRIMARY KEY,
          reclamation_id INTEGER NOT NULL REFERENCES reclamations(id) ON DELETE CASCADE,
          etudiant_id INTEGER NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(120),
          file_size BIGINT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await executeSafe(`
        CREATE INDEX IF NOT EXISTS idx_student_reclamation_documents_reclamation_id
        ON student_reclamation_documents(reclamation_id)
      `);

      await executeSafe(`
        CREATE INDEX IF NOT EXISTS idx_student_reclamation_documents_etudiant_id
        ON student_reclamation_documents(etudiant_id)
      `);

      await executeSafe(`
        CREATE TABLE IF NOT EXISTS student_justification_documents (
          id SERIAL PRIMARY KEY,
          justification_id INTEGER NOT NULL REFERENCES justifications(id) ON DELETE CASCADE,
          etudiant_id INTEGER NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(120),
          file_size BIGINT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await executeSafe(`
        CREATE INDEX IF NOT EXISTS idx_student_justification_documents_justification_id
        ON student_justification_documents(justification_id)
      `);

      await executeSafe(`
        CREATE INDEX IF NOT EXISTS idx_student_justification_documents_etudiant_id
        ON student_justification_documents(etudiant_id)
      `);

      await ensureRequestWorkflowHistoryTable();
      requestSupportTablesInitialized = true;
    })().finally(() => {
      requestSupportTablesInitPromise = null;
    });
  }

  return requestSupportTablesInitPromise;
};

const loadReclamationAttachmentsMap = async (reclamationIds: number[]) => {
  const map = new Map<number, RequestAttachmentPayload[]>();

  if (!reclamationIds.length) {
    return map;
  }

  const rows = await prisma.$queryRaw<ReclamationDocumentRow[]>(Prisma.sql`
    SELECT
      id,
      reclamation_id AS "reclamationId",
      file_path AS "filePath",
      file_name AS "fileName",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      created_at AS "createdAt"
    FROM student_reclamation_documents
    WHERE reclamation_id IN (${Prisma.join(reclamationIds)})
    ORDER BY created_at DESC
  `);

  rows.forEach((row) => {
    const group = map.get(row.reclamationId) || [];
    group.push(
      buildAttachmentPayload({
        id: row.id,
        filePath: row.filePath,
        fileName: row.fileName,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        createdAt: row.createdAt,
      })
    );
    map.set(row.reclamationId, group);
  });

  return map;
};

const loadJustificationAttachmentsMap = async (justificationIds: number[]) => {
  const map = new Map<number, RequestAttachmentPayload[]>();

  if (!justificationIds.length) {
    return map;
  }

  const rows = await prisma.$queryRaw<JustificationDocumentRow[]>(Prisma.sql`
    SELECT
      id,
      justification_id AS "justificationId",
      file_path AS "filePath",
      file_name AS "fileName",
      mime_type AS "mimeType",
      file_size AS "fileSize",
      created_at AS "createdAt"
    FROM student_justification_documents
    WHERE justification_id IN (${Prisma.join(justificationIds)})
    ORDER BY created_at DESC
  `);

  rows.forEach((row) => {
    const group = map.get(row.justificationId) || [];
    group.push(
      buildAttachmentPayload({
        id: row.id,
        filePath: row.filePath,
        fileName: row.fileName,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        createdAt: row.createdAt,
      })
    );
    map.set(row.justificationId, group);
  });

  return map;
};

// ─── Helper: récupérer Etudiant.id depuis User.id ───────────────────────────
const getEtudiantId = async (userId?: number): Promise<number | null> => {
  if (typeof userId === "number") {
    const etudiant = await prisma.etudiant.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (etudiant) return etudiant.id;
  }

  return null;
};

const isAdminRole = (roles: string[] = []): boolean => {
  return roles.some((role) => role === "admin");
};

const mapReclamationStatusToUi = (status: StatusReclamation, response?: string | null) => {
  if (status === StatusReclamation.traitee) return "resolved";
  if (status === StatusReclamation.refusee) return "rejected";
  if (response && response.includes("[INFO_REQUEST]")) return "info-requested";
  if (status === StatusReclamation.en_cours || status === StatusReclamation.en_attente) return "under-review";
  return "submitted";
};

const mapJustificationStatusToUi = (status: StatusJustification, comment?: string | null) => {
  if (status === StatusJustification.valide) return "resolved";
  if (status === StatusJustification.refuse) return "rejected";
  if (comment && comment.includes("[INFO_REQUEST]")) return "info-requested";
  if (status === StatusJustification.en_verification) return "under-review";
  return "submitted";
};

const mapSubmissionStatusToUi = (status: SubmissionStatus): string => {
  if (status === SubmissionStatus.resolved) return "resolved";
  if (status === SubmissionStatus.rejected) return "rejected";
  if (status === SubmissionStatus.under_review) return "under-review";
  return "submitted";
};

const mapWorkflowStageToUiStatus = (stage: RequestWorkflowStage): string => {
  if (stage === "final_decision") {
    return "resolved";
  }

  if (["under_review", "teacher_response", "council_review"].includes(stage)) {
    return "under-review";
  }

  return "submitted";
};

const DECISION_ACTIONS = ["approve", "reject", "info", "teacher", "council"] as const;

type DecisionAction = (typeof DECISION_ACTIONS)[number];

const isDecisionAction = (value: string): value is DecisionAction => {
  return DECISION_ACTIONS.includes(value as DecisionAction);
};

const getWorkflowTransitionForDecision = (
  action: DecisionAction
): { stage: RequestWorkflowStage; actionCode: RequestWorkflowAction } => {
  switch (action) {
    case "approve":
      return { stage: "final_decision", actionCode: "approve" };
    case "reject":
      return { stage: "final_decision", actionCode: "reject" };
    case "teacher":
      return { stage: "teacher_response", actionCode: "teacher_feedback" };
    case "council":
      return { stage: "council_review", actionCode: "escalate_to_council" };
    case "info":
    default:
      return { stage: "under_review", actionCode: "request_info" };
  }
};

const buildDecisionComment = (action: DecisionAction, responseText: string): string | null => {
  const trimmed = responseText.trim();
  if (!trimmed) {
    return null;
  }

  if (action === "info") {
    return `[INFO_REQUEST] ${trimmed}`;
  }

  if (action === "teacher") {
    return `[TEACHER_REVIEW] ${trimmed}`;
  }

  if (action === "council") {
    return `[COUNCIL_REVIEW] ${trimmed}`;
  }

  return trimmed;
};

const writeRequestAuditEvent = async (
  req: AuthRequest,
  input: {
    eventKey: string;
    action: string;
    entityType: string;
    entityId: number;
    payload?: Record<string, unknown>;
  }
) => {
  await writeAuditLogSafe({
    eventKey: input.eventKey,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorUserId: req.user?.id ?? null,
    actorRoles: req.user?.roles || [],
    requestPath: req.originalUrl,
    requestMethod: req.method,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
    payload: input.payload || null,
  });
};

const DEFAULT_RECLAMATION_TYPES = [
  { nom: "Grade Error", description: "Issue related to marks or exam grading." },
  { nom: "Schedule Conflict", description: "Conflict in timetable or exam schedule." },
  { nom: "Administrative Error", description: "Administrative or registration issue." },
  { nom: "Other", description: "Other reclamation reasons." },
];

const DEFAULT_JUSTIFICATION_TYPES = [
  { nom: "Medical", description: "Medical reason with supporting document." },
  { nom: "Family Emergency", description: "Urgent family situation." },
  { nom: "Academic Overlap", description: "Overlap with another official academic activity." },
  { nom: "Administrative Reason", description: "Institutional or administrative reason." },
  { nom: "Other", description: "Other justification reasons." },
];

const ensureDefaultReclamationTypes = async () => {
  for (const item of DEFAULT_RECLAMATION_TYPES) {
    const existing = await prisma.reclamationType.findFirst({
      where: {
        OR: [
          { nom_ar: { equals: item.nom, mode: "insensitive" } },
          { nom_en: { equals: item.nom, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.reclamationType.create({
        data: { nom_ar: item.nom, description_ar: item.description },
      });
    }
  }
};

const ensureDefaultJustificationTypes = async () => {
  for (const item of DEFAULT_JUSTIFICATION_TYPES) {
    const existing = await prisma.typeAbsence.findFirst({
      where: {
        OR: [
          { nom_ar: { equals: item.nom, mode: "insensitive" } },
          { nom_en: { equals: item.nom, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.typeAbsence.create({
        data: { nom_ar: item.nom, description_ar: item.description },
      });
    }
  }
};

const resolveReclamationTypeId = async (typeIdRaw: unknown, typeNameRaw: unknown): Promise<number> => {
  const parsedTypeId = Number(typeIdRaw);
  if (Number.isInteger(parsedTypeId) && parsedTypeId > 0) {
    const existing = await prisma.reclamationType.findUnique({
      where: { id: parsedTypeId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const typeName = String(typeNameRaw || "General").trim() || "General";

  const byName = await prisma.reclamationType.findFirst({
    where: {
      OR: [
        { nom_ar: { equals: typeName, mode: "insensitive" } },
        { nom_en: { equals: typeName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  if (byName) return byName.id;

  const created = await prisma.reclamationType.create({
    data: {
      nom_ar: typeName,
      nom_en: typeName,
      description_ar: "Auto-created by public request submission",
      description_en: "Auto-created by public request submission",
    },
    select: { id: true },
  });

  return created.id;
};

const resolveJustificationTypeId = async (typeIdRaw: unknown, typeNameRaw: unknown): Promise<number> => {
  const parsedTypeId = Number(typeIdRaw);
  if (Number.isInteger(parsedTypeId) && parsedTypeId > 0) {
    const existing = await prisma.typeAbsence.findUnique({
      where: { id: parsedTypeId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const typeName = String(typeNameRaw || "General").trim() || "General";

  const byName = await prisma.typeAbsence.findFirst({
    where: {
      OR: [
        { nom_ar: { equals: typeName, mode: "insensitive" } },
        { nom_en: { equals: typeName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  if (byName) return byName.id;

  const created = await prisma.typeAbsence.create({
    data: {
      nom_ar: typeName,
      nom_en: typeName,
      description_ar: "Auto-created by public justification submission",
      description_en: "Auto-created by public justification submission",
    },
    select: { id: true },
  });

  return created.id;
};

// ════════════════════════════════════════════════════════════
//  RECLAMATIONS
// ════════════════════════════════════════════════════════════

// POST /api/v1/requests/reclamations
export const createReclamation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureRequestSupportTables();

    const userId = req.user?.id;
    const etudiantId = await getEtudiantId(userId);

    // ── PATH 1: Authenticated student ───────────────────────────
    if (etudiantId) {
      const { typeId, typeName, objet, description, priorite } = req.body;
      const resolvedTypeId = await resolveReclamationTypeId(typeId, typeName);

      const uploadedFiles = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];
      const preparedFiles = uploadedFiles.map((file) => ({
        storedPath: normalizeStoredPath(path.relative(process.cwd(), file.path)),
        fileName: file.originalname || path.basename(file.path),
        mimeType: file.mimetype || null,
        fileSize: typeof file.size === "number" ? file.size : null,
      }));

      const reclamation = await prisma.$transaction(async (tx) => {
        const created = await tx.reclamation.create({
          data: {
            etudiantId,
            typeId: resolvedTypeId,
            objet_ar: objet,
            objet_en: objet,
            description_ar: description,
            description_en: description,
            priorite: priorite ?? "normale",
            status: "soumise",
          },
          include: {
            type: { select: { nom_ar: true, nom_en: true } },
            etudiant: {
              include: {
                user: { select: { nom: true, prenom: true, email: true } },
              },
            },
          },
        });

        for (const file of preparedFiles) {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO student_reclamation_documents (
              reclamation_id,
              etudiant_id,
              file_path,
              file_name,
              mime_type,
              file_size,
              created_at
            )
            VALUES (
              ${created.id},
              ${etudiantId},
              ${file.storedPath},
              ${file.fileName},
              ${file.mimeType},
              ${file.fileSize},
              NOW()
            )
          `);
        }

        return created;
      });

      await ensureRequestWorkflowSubmitted({
        requestCategory: "reclamation",
        requestId: reclamation.id,
        actorUserId: req.user?.id ?? null,
        actorRoles: req.user?.roles || [],
        note: "Student submitted reclamation",
        metadata: { status: reclamation.status, source: "student_portal" },
      });

      await writeRequestAuditEvent(req, {
        eventKey: "requests.reclamation.created",
        action: "create",
        entityType: "reclamation",
        entityId: reclamation.id,
        payload: { etudiantId, typeId: resolvedTypeId },
      });

      res.status(201).json({ success: true, message: "Reclamation submitted successfully", data: reclamation });
      return;
    }

    // ── PATH 2: Authenticated non-student (teacher, admin…) ─────
    if (userId) {
      const { objet, description } = req.body;
      const subject = String(objet || "").trim() || null;
      const message = String(description || "").trim();

      if (!message) {
        res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "description is required" } });
        return;
      }

      const submission = await prisma.submission.create({
        data: { type: SubmissionType.RECLAMATION, userId, subject, message },
      });

      await writeRequestAuditEvent(req, {
        eventKey: "requests.submission.created",
        action: "create",
        entityType: "submission",
        entityId: submission.id,
        payload: { type: "RECLAMATION", userId },
      });

      res.status(201).json({ success: true, message: "Reclamation submitted successfully", data: submission });
      return;
    }

    // ── PATH 3: Guest (unauthenticated) ─────────────────────────
    const { objet, description, guestFirstName, guestLastName, guestEmail } = req.body;
    const firstName = String(guestFirstName || "").trim();
    const lastName = String(guestLastName || "").trim();
    const email = String(guestEmail || "").trim();
    const subject = String(objet || "").trim() || null;
    const message = String(description || "").trim();

    if (!firstName || !lastName || !email) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Guest first name, last name, and email are required" } });
      return;
    }
    if (!message) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "description is required" } });
      return;
    }

    const guestSubmission = await prisma.guestSubmission.create({
      data: { type: SubmissionType.RECLAMATION, firstName, lastName, email, subject, message },
    });

    res.status(201).json({ success: true, message: "Reclamation submitted successfully", data: guestSubmission });
  } catch (error) {
    console.error("createReclamation error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// GET /api/v1/requests/reclamations
export const getMyReclamations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const etudiantId = await getEtudiantId(userId);

    if (!etudiantId) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only students can view reclamations" },
      });
      return;
    }

    const { status } = req.query;
    const where: any = { etudiantId };
    if (status) where.status = status;

    const reclamations = await prisma.reclamation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        type: { select: { nom_ar: true, nom_en: true } },
      },
    });

    const workflowStageMap = await loadLatestWorkflowStageMap(
      "reclamation",
      reclamations.map((item) => item.id)
    );

    // Stats pour les cartes du dashboard
    const all = await prisma.reclamation.findMany({
      where: { etudiantId },
      select: { status: true },
    });

    const stats = {
      total: all.length,
      pending: all.filter((r) => r.status === "soumise" || r.status === "en_cours").length,
      resolved: all.filter((r) => r.status === "traitee").length,
      rejected: all.filter((r) => r.status === "refusee").length,
    };

    const attachmentMap = await loadReclamationAttachmentsMap(reclamations.map((item) => item.id));

    res.status(200).json({
      success: true,
      data: await Promise.all(
        reclamations.map(async (item) => ({
          ...item,
          attachments: attachmentMap.get(item.id) || [],
          timeline: await listRequestWorkflowHistory("reclamation", item.id),
          workflowStage: workflowStageMap.get(item.id) || mapReclamationStatusToWorkflowStage(item.status),
        }))
      ),
      stats,
    });
  } catch (error) {
    console.error("getMyReclamations error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// GET /api/v1/requests/admin/inbox
export const getAdminRequestsInbox = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdminRole(req.user?.roles)) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only admin can access requests inbox" },
      });
      return;
    }

    await ensureRequestSupportTables();

    const [reclamations, justifications, submissions, guestSubmissions] = await Promise.all([
      prisma.reclamation.findMany({
        include: {
          type: { select: { nom_ar: true, nom_en: true } },
          etudiant: {
            select: {
              id: true,
              userId: true,
              matricule: true,
              promo: { select: { section: true } },
              user: { select: { nom: true, prenom: true } },
            },
          },
        },
      }),
      prisma.justification.findMany({
        include: {
          type: { select: { nom_ar: true, nom_en: true } },
          etudiant: {
            select: {
              id: true,
              userId: true,
              matricule: true,
              promo: { select: { section: true } },
              user: { select: { nom: true, prenom: true } },
            },
          },
        },
      }),
      prisma.submission.findMany({
        include: {
          user: { select: { nom: true, prenom: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.guestSubmission.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const [
      reclamationAttachmentsMap,
      justificationAttachmentsMap,
      reclamationWorkflowStageMap,
      justificationWorkflowStageMap,
    ] = await Promise.all([
      loadReclamationAttachmentsMap(reclamations.map((item) => item.id)),
      loadJustificationAttachmentsMap(justifications.map((item) => item.id)),
      loadLatestWorkflowStageMap("reclamation", reclamations.map((item) => item.id)),
      loadLatestWorkflowStageMap("justification", justifications.map((item) => item.id)),
    ]);

    const mappedReclamations = reclamations.map((item) => {
      const studentName = `${item.etudiant.user.prenom ?? ""} ${item.etudiant.user.nom ?? ""}`.trim() || "Student";
      const workflowStage =
        reclamationWorkflowStageMap.get(item.id) || mapReclamationStatusToWorkflowStage(item.status);

      return {
        id: `REC-${item.id}`,
        requestId: item.id,
        category: "reclamation",
        title: item.objet_ar || item.objet_en,
        description: item.description_ar || item.description_en,
        type: item.type?.nom_ar || item.type?.nom_en || "Reclamation",
        status: mapReclamationStatusToUi(item.status, item.reponse_ar || item.reponse_en),
        priority: ["haute", "urgente"].includes(String(item.priorite)) ? "high" : "normal",
        dateSubmitted: item.createdAt,
        studentName,
        studentEtudiantId: item.etudiant.id,
        studentUserId: item.etudiant.userId || null,
        studentId: item.etudiant.matricule || `ETU-${item.etudiant.id}`,
        department: item.etudiant.promo?.section || "N/A",
        attachments: reclamationAttachmentsMap.get(item.id) || [],
        internalNotes: item.reponse_ar || item.reponse_en || "",
        linkedExam: null,
        workflowStage,
        workflowStatus: mapWorkflowStageToUiStatus(workflowStage),
        submitterSource: "student",
        guestEmail: null,
      };
    });

    const mappedJustifications = justifications.map((item) => {
      const studentName = `${item.etudiant.user.prenom ?? ""} ${item.etudiant.user.nom ?? ""}`.trim() || "Student";
      const workflowStage =
        justificationWorkflowStageMap.get(item.id) || mapJustificationStatusToWorkflowStage(item.status);
      const tableAttachments = justificationAttachmentsMap.get(item.id) || [];
      const mergedByKey = new Map<string, RequestAttachmentPayload>();

      tableAttachments.forEach((attachment) => {
        mergedByKey.set(`${attachment.name}-${attachment.url || ""}`, attachment);
      });

      if (!tableAttachments.length) {
        parseLegacyJustificationAttachments(item.document).forEach((attachment) => {
          const key = `${attachment.name}-${attachment.url || ""}`;
          if (!mergedByKey.has(key)) {
            mergedByKey.set(key, attachment);
          }
        });
      }

      return {
        id: `JUS-${item.id}`,
        requestId: item.id,
        category: "justification",
        title: item.motif_ar || item.motif_en || "Absence Justification",
        description: item.motif_ar || item.motif_en || "No additional description provided",
        type: item.type?.nom_ar || item.type?.nom_en || "Justification",
        status: mapJustificationStatusToUi(item.status, item.commentaireAdmin_ar || item.commentaireAdmin_en),
        priority: "normal",
        dateSubmitted: item.createdAt,
        studentName,
        studentEtudiantId: item.etudiant.id,
        studentUserId: item.etudiant.userId || null,
        studentId: item.etudiant.matricule || `ETU-${item.etudiant.id}`,
        department: item.etudiant.promo?.section || "N/A",
        attachments: Array.from(mergedByKey.values()),
        internalNotes: item.commentaireAdmin_ar || item.commentaireAdmin_en || "",
        linkedExam: null,
        workflowStage,
        workflowStatus: mapWorkflowStageToUiStatus(workflowStage),
        submitterSource: "student",
        guestEmail: null,
      };
    });

    const mappedSubmissions = submissions.map((item) => {
      const submitterName = `${item.user.prenom ?? ""} ${item.user.nom ?? ""}`.trim() || item.user.email;
      const typeLabel = item.type === SubmissionType.RECLAMATION ? "Reclamation" : "Justification";
      return {
        id: `SUB-${item.id}`,
        requestId: item.id,
        category: "submission",
        title: item.subject || typeLabel,
        description: item.message,
        type: typeLabel,
        status: mapSubmissionStatusToUi(item.status),
        priority: "normal",
        dateSubmitted: item.createdAt,
        studentName: submitterName,
        studentEtudiantId: null,
        studentUserId: item.userId,
        studentId: `USR-${item.userId}`,
        department: "N/A",
        attachments: [],
        internalNotes: item.adminNote || "",
        linkedExam: null,
        workflowStage: "submitted" as const,
        workflowStatus: "submitted",
        submitterSource: "user",
        guestEmail: null,
      };
    });

    const mappedGuestSubmissions = guestSubmissions.map((item) => {
      const submitterName = `${item.firstName} ${item.lastName}`.trim();
      const typeLabel = item.type === SubmissionType.RECLAMATION ? "Reclamation" : "Justification";
      return {
        id: `GSUB-${item.id}`,
        requestId: item.id,
        category: "guest_submission",
        title: item.subject || typeLabel,
        description: item.message,
        type: typeLabel,
        status: mapSubmissionStatusToUi(item.status),
        priority: "normal",
        dateSubmitted: item.createdAt,
        studentName: submitterName,
        studentEtudiantId: null,
        studentUserId: null,
        studentId: `GUEST-${item.id}`,
        department: "N/A",
        attachments: [],
        internalNotes: item.adminNote || "",
        linkedExam: null,
        workflowStage: "submitted" as const,
        workflowStatus: "submitted",
        submitterSource: "guest",
        guestEmail: item.email,
      };
    });

    const data = [...mappedReclamations, ...mappedJustifications, ...mappedSubmissions, ...mappedGuestSubmissions].sort(
      (a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getAdminRequestsInbox error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// POST /api/v1/requests/admin/reclamations/:id/decision
export const decideReclamation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdminRole(req.user?.roles)) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only admin can decide requests" },
      });
      return;
    }

    const reclamationId = Number(req.params.id);
    if (!Number.isInteger(reclamationId) || reclamationId <= 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid reclamation id" } });
      return;
    }

    const action = String(req.body?.action || "").toLowerCase();
    const responseText = String(req.body?.responseText || "").trim();
    if (!isDecisionAction(action)) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid action" } });
      return;
    }

    const status: StatusReclamation =
      action === "approve"
        ? StatusReclamation.traitee
        : action === "reject"
          ? StatusReclamation.refusee
          : StatusReclamation.en_cours;

    const responseValue = buildDecisionComment(action, responseText);
    const workflowTransition = getWorkflowTransitionForDecision(action);

    const lockResult = await prisma.reclamation.updateMany({
      where: {
        id: reclamationId,
        status: { notIn: [...TERMINAL_STATUSES.reclamation] },
      },
      data: {
        status,
        traitePar: req.user?.id,
        dateTraitement: new Date(),
        reponse_ar: responseValue,
        reponse_en: responseValue,
      },
    });

    if (lockResult.count === 0) {
      const existing = await prisma.reclamation.findUnique({
        where: { id: reclamationId },
        select: { status: true },
      });
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Reclamation not found" },
        });
        return;
      }
      res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_PROCESSED",
          message: `Reclamation has already been decided (current status: ${existing.status}). Decision is final.`,
        },
      });
      return;
    }

    const updated = await prisma.reclamation.findUnique({
      where: { id: reclamationId },
      include: { etudiant: { select: { id: true } } },
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Reclamation not found" },
      });
      return;
    }

    await appendRequestWorkflowEvent({
      requestCategory: "reclamation",
      requestId: updated.id,
      stage: workflowTransition.stage,
      action: workflowTransition.actionCode,
      actorUserId: req.user?.id ?? null,
      actorRoles: req.user?.roles || [],
      note: responseText || undefined,
      metadata: {
        decision: action,
        status,
      },
    });

    await writeRequestAuditEvent(req, {
      eventKey: "requests.reclamation.decision",
      action: action,
      entityType: "reclamation",
      entityId: updated.id,
      payload: {
        decision: action,
        status,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...updated,
        workflowStage: workflowTransition.stage,
      },
    });
  } catch (error) {
    console.error("decideReclamation error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// ════════════════════════════════════════════════════════════
//  JUSTIFICATIONS
// ════════════════════════════════════════════════════════════

// POST /api/v1/requests/justifications
export const createJustification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureRequestSupportTables();

    const userId = req.user?.id;
    const etudiantId = await getEtudiantId(userId);

    // ── PATH 1: Authenticated student ───────────────────────────
    if (etudiantId) {
      const { typeId, typeName, dateAbsence, motif } = req.body;
      const resolvedTypeId = await resolveJustificationTypeId(typeId, typeName);

      const uploadedFiles = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];
      const preparedFiles = uploadedFiles.map((file) => ({
        storedPath: normalizeStoredPath(path.relative(process.cwd(), file.path)),
        fileName: file.originalname || path.basename(file.path),
        mimeType: file.mimetype || null,
        fileSize: typeof file.size === "number" ? file.size : null,
      }));

      const justification = await prisma.$transaction(async (tx) => {
        const created = await tx.justification.create({
          data: {
            etudiantId,
            typeId: resolvedTypeId,
            dateAbsence: new Date(dateAbsence),
            motif_ar: motif ?? null,
            motif_en: motif ?? null,
            document: preparedFiles[0]?.storedPath || null,
            status: "soumis",
          },
          include: {
            type: { select: { nom_ar: true, nom_en: true } },
            etudiant: {
              include: {
                user: { select: { nom: true, prenom: true, email: true } },
              },
            },
          },
        });

        for (const file of preparedFiles) {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO student_justification_documents (
              justification_id,
              etudiant_id,
              file_path,
              file_name,
              mime_type,
              file_size,
              created_at
            )
            VALUES (
              ${created.id},
              ${etudiantId},
              ${file.storedPath},
              ${file.fileName},
              ${file.mimeType},
              ${file.fileSize},
              NOW()
            )
          `);
        }

        return created;
      });

      await ensureRequestWorkflowSubmitted({
        requestCategory: "justification",
        requestId: justification.id,
        actorUserId: req.user?.id ?? null,
        actorRoles: req.user?.roles || [],
        note: "Student submitted justification",
        metadata: { status: justification.status, source: "student_portal" },
      });

      await writeRequestAuditEvent(req, {
        eventKey: "requests.justification.created",
        action: "create",
        entityType: "justification",
        entityId: justification.id,
        payload: { etudiantId, typeId: resolvedTypeId },
      });

      res.status(201).json({ success: true, message: "Justification submitted successfully", data: justification });
      return;
    }

    // ── PATH 2: Authenticated non-student (teacher, admin…) ─────
    if (userId) {
      const { objet, description, dateAbsence } = req.body;
      const subject = String(objet || "").trim() || null;
      const datePart = dateAbsence ? ` (absence date: ${dateAbsence})` : "";
      const message = (String(description || "").trim() || "Justification submitted") + datePart;

      const submission = await prisma.submission.create({
        data: { type: SubmissionType.JUSTIFICATION, userId, subject, message },
      });

      await writeRequestAuditEvent(req, {
        eventKey: "requests.submission.created",
        action: "create",
        entityType: "submission",
        entityId: submission.id,
        payload: { type: "JUSTIFICATION", userId },
      });

      res.status(201).json({ success: true, message: "Justification submitted successfully", data: submission });
      return;
    }

    // ── PATH 3: Guest (unauthenticated) ─────────────────────────
    const { objet, description, dateAbsence, guestFirstName, guestLastName, guestEmail } = req.body;
    const firstName = String(guestFirstName || "").trim();
    const lastName = String(guestLastName || "").trim();
    const email = String(guestEmail || "").trim();
    const subject = String(objet || "").trim() || null;
    const datePart = dateAbsence ? ` (absence date: ${dateAbsence})` : "";
    const message = (String(description || "").trim() || "Justification submitted") + datePart;

    if (!firstName || !lastName || !email) {
      res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Guest first name, last name, and email are required" } });
      return;
    }

    const guestSubmission = await prisma.guestSubmission.create({
      data: { type: SubmissionType.JUSTIFICATION, firstName, lastName, email, subject, message },
    });

    res.status(201).json({ success: true, message: "Justification submitted successfully", data: guestSubmission });
  } catch (error) {
    console.error("createJustification error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// GET /api/v1/requests/justifications
export const getMyJustifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const etudiantId = await getEtudiantId(userId);

    if (!etudiantId) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only students can view justifications" },
      });
      return;
    }

    const { status } = req.query;
    const where: any = { etudiantId };
    if (status) where.status = status;

    const justifications = await prisma.justification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        type: { select: { nom_ar: true, nom_en: true } },
      },
    });

    const workflowStageMap = await loadLatestWorkflowStageMap(
      "justification",
      justifications.map((item) => item.id)
    );

    const all = await prisma.justification.findMany({
      where: { etudiantId },
      select: { status: true },
    });

    const stats = {
      total: all.length,
      pending: all.filter((j) => j.status === "soumis" || j.status === "en_verification").length,
      resolved: all.filter((j) => j.status === "valide").length,
      rejected: all.filter((j) => j.status === "refuse").length,
    };

    const attachmentMap = await loadJustificationAttachmentsMap(justifications.map((item) => item.id));

    res.status(200).json({
      success: true,
      data: await Promise.all(
        justifications.map(async (item) => ({
          ...item,
          attachments: attachmentMap.get(item.id) || [],
          timeline: await listRequestWorkflowHistory("justification", item.id),
          workflowStage: workflowStageMap.get(item.id) || mapJustificationStatusToWorkflowStage(item.status),
        }))
      ),
      stats,
    });
  } catch (error) {
    console.error("getMyJustifications error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// POST /api/v1/requests/admin/justifications/:id/decision
export const decideJustification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdminRole(req.user?.roles)) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only admin can decide requests" },
      });
      return;
    }

    const justificationId = Number(req.params.id);
    if (!Number.isInteger(justificationId) || justificationId <= 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid justification id" } });
      return;
    }

    const action = String(req.body?.action || "").toLowerCase();
    const responseText = String(req.body?.responseText || "").trim();
    if (!isDecisionAction(action)) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid action" } });
      return;
    }

    const status: StatusJustification =
      action === "approve"
        ? StatusJustification.valide
        : action === "reject"
          ? StatusJustification.refuse
          : StatusJustification.en_verification;

    const adminComment = buildDecisionComment(action, responseText);
    const workflowTransition = getWorkflowTransitionForDecision(action);

    const lockResult = await prisma.justification.updateMany({
      where: {
        id: justificationId,
        status: { notIn: [...TERMINAL_STATUSES.justification] },
      },
      data: {
        status,
        traitePar: req.user?.id,
        dateTraitement: new Date(),
        commentaireAdmin_ar: adminComment,
        commentaireAdmin_en: adminComment,
      },
    });

    if (lockResult.count === 0) {
      const existing = await prisma.justification.findUnique({
        where: { id: justificationId },
        select: { status: true },
      });
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Justification not found" },
        });
        return;
      }
      res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_PROCESSED",
          message: `Justification has already been decided (current status: ${existing.status}). Decision is final.`,
        },
      });
      return;
    }

    const updated = await prisma.justification.findUnique({
      where: { id: justificationId },
      include: { etudiant: { select: { id: true } } },
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Justification not found" },
      });
      return;
    }

    await appendRequestWorkflowEvent({
      requestCategory: "justification",
      requestId: updated.id,
      stage: workflowTransition.stage,
      action: workflowTransition.actionCode,
      actorUserId: req.user?.id ?? null,
      actorRoles: req.user?.roles || [],
      note: responseText || undefined,
      metadata: {
        decision: action,
        status,
      },
    });

    await writeRequestAuditEvent(req, {
      eventKey: "requests.justification.decision",
      action: action,
      entityType: "justification",
      entityId: updated.id,
      payload: {
        decision: action,
        status,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...updated,
        workflowStage: workflowTransition.stage,
      },
    });
  } catch (error) {
    console.error("decideJustification error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// GET /api/v1/requests/admin/:category/:id/workflow
export const getAdminRequestWorkflowHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdminRole(req.user?.roles)) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only admin can access request workflow history" },
      });
      return;
    }

    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid request id" } });
      return;
    }

    const categoryRaw = String(req.params.category || "").trim().toLowerCase();
    const requestCategory: RequestWorkflowCategory | null =
      categoryRaw === "reclamation" || categoryRaw === "justification"
        ? (categoryRaw as RequestWorkflowCategory)
        : null;

    if (!requestCategory) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Category must be reclamation or justification" },
      });
      return;
    }

    const recordStatus =
      requestCategory === "reclamation"
        ? await prisma.reclamation.findUnique({ where: { id: requestId }, select: { status: true } })
        : await prisma.justification.findUnique({ where: { id: requestId }, select: { status: true } });

    if (!recordStatus) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Request not found" },
      });
      return;
    }

    let history = await listRequestWorkflowHistory(requestCategory, requestId, 200);

    if (!history.length) {
      const fallbackStage =
        requestCategory === "reclamation"
          ? mapReclamationStatusToWorkflowStage(recordStatus.status)
          : mapJustificationStatusToWorkflowStage(recordStatus.status);

      await appendRequestWorkflowEvent({
        requestCategory,
        requestId,
        stage: fallbackStage,
        action: "manual_update",
        actorUserId: req.user?.id ?? null,
        actorRoles: req.user?.roles || [],
        note: "Backfilled workflow from current request status",
        metadata: {
          backfilled: true,
          sourceStatus: recordStatus.status,
        },
      });

      history = await listRequestWorkflowHistory(requestCategory, requestId, 200);
    }

    const currentStage =
      history[history.length - 1]?.stage ||
      (requestCategory === "reclamation"
        ? mapReclamationStatusToWorkflowStage(recordStatus.status)
        : mapJustificationStatusToWorkflowStage(recordStatus.status));

    res.status(200).json({
      success: true,
      data: {
        requestCategory,
        requestId,
        currentStage,
        history,
      },
    });
  } catch (error) {
    console.error("getAdminRequestWorkflowHistory error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};

// POST /api/v1/requests/admin/submissions/:id/decision
export const decideSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdminRole(req.user?.roles)) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only admin can decide requests" } });
      return;
    }

    const submissionId = Number(req.params.id);
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid submission id" } });
      return;
    }

    const action = String(req.body?.action || "").toLowerCase();
    const responseText = String(req.body?.responseText || "").trim();
    if (!isDecisionAction(action)) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid action" } });
      return;
    }

    const existing = await prisma.submission.findUnique({ where: { id: submissionId }, select: { id: true, status: true } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Submission not found" } });
      return;
    }

    if (existing.status === SubmissionStatus.resolved || existing.status === SubmissionStatus.rejected) {
      res.status(409).json({
        success: false,
        error: { code: "ALREADY_PROCESSED", message: `Submission has already been decided (current status: ${existing.status}). Decision is final.` },
      });
      return;
    }

    const newStatus: SubmissionStatus =
      action === "approve" ? SubmissionStatus.resolved
      : action === "reject" ? SubmissionStatus.rejected
      : SubmissionStatus.under_review;

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: { status: newStatus, adminNote: responseText || null },
    });

    await writeRequestAuditEvent(req, {
      eventKey: "requests.submission.decision",
      action,
      entityType: "submission",
      entityId: submissionId,
      payload: { decision: action, status: newStatus },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("decideSubmission error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  }
};

// POST /api/v1/requests/admin/guest-submissions/:id/decision
export const decideGuestSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdminRole(req.user?.roles)) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only admin can decide requests" } });
      return;
    }

    const submissionId = Number(req.params.id);
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid guest submission id" } });
      return;
    }

    const action = String(req.body?.action || "").toLowerCase();
    const responseText = String(req.body?.responseText || "").trim();
    if (!isDecisionAction(action)) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid action" } });
      return;
    }

    const existing = await prisma.guestSubmission.findUnique({ where: { id: submissionId }, select: { id: true, status: true } });
    if (!existing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Guest submission not found" } });
      return;
    }

    if (existing.status === SubmissionStatus.resolved || existing.status === SubmissionStatus.rejected) {
      res.status(409).json({
        success: false,
        error: { code: "ALREADY_PROCESSED", message: `Guest submission has already been decided (current status: ${existing.status}). Decision is final.` },
      });
      return;
    }

    const newStatus: SubmissionStatus =
      action === "approve" ? SubmissionStatus.resolved
      : action === "reject" ? SubmissionStatus.rejected
      : SubmissionStatus.under_review;

    const updated = await prisma.guestSubmission.update({
      where: { id: submissionId },
      data: { status: newStatus, adminNote: responseText || null },
    });

    await writeRequestAuditEvent(req, {
      eventKey: "requests.guest_submission.decision",
      action,
      entityType: "guest_submission",
      entityId: submissionId,
      payload: { decision: action, status: newStatus },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("decideGuestSubmission error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  }
};

// GET /api/v1/requests/types/reclamations
export const getReclamationTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureDefaultReclamationTypes();
    const types = await prisma.reclamationType.findMany({
      select: { id: true, code: true, nom_ar: true, nom_en: true, description_ar: true, description_en: true },
      orderBy: { id: "asc" },
    });
    const data = types.map((t) => ({ ...t, nom: t.nom_en || t.nom_ar || "" }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  }
};

// GET /api/v1/requests/types/justifications
export const getJustificationTypes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureDefaultJustificationTypes();
    const types = await prisma.typeAbsence.findMany({
      select: { id: true, code: true, nom_ar: true, nom_en: true, description_ar: true, description_en: true },
      orderBy: { id: "asc" },
    });
    const data = types.map((t) => ({ ...t, nom: t.nom_en || t.nom_ar || "" }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  }
};
