import { Prisma } from "@prisma/client";
import prisma from "../../config/database";
import logger from "../../utils/logger";

export type RequestWorkflowCategory = "reclamation" | "justification";

export type RequestWorkflowStage =
  | "submitted"
  | "under_review"
  | "teacher_response"
  | "council_review"
  | "final_decision";

export type RequestWorkflowAction =
  | "submitted"
  | "start_review"
  | "request_info"
  | "teacher_feedback"
  | "escalate_to_council"
  | "approve"
  | "reject"
  | "manual_update";

type WorkflowHistoryRow = {
  id: bigint | number;
  requestCategory: string;
  requestId: number;
  stage: string;
  action: string;
  actorUserId: number | null;
  actorRoles: string[] | null;
  note: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

type WorkflowStageRow = {
  requestId: number;
  stage: string;
};

export interface RequestWorkflowHistoryItem {
  id: number;
  requestCategory: RequestWorkflowCategory;
  requestId: number;
  stage: RequestWorkflowStage;
  action: RequestWorkflowAction;
  actorUserId: number | null;
  actorRoles: string[];
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

type AppendWorkflowEventInput = {
  requestCategory: RequestWorkflowCategory;
  requestId: number;
  stage: RequestWorkflowStage;
  action: RequestWorkflowAction;
  actorUserId?: number | null;
  actorRoles?: string[];
  note?: string | null;
  metadata?: Record<string, unknown> | null;
};

const WORKFLOW_STAGES: RequestWorkflowStage[] = [
  "submitted",
  "under_review",
  "teacher_response",
  "council_review",
  "final_decision",
];

const WORKFLOW_ACTIONS: RequestWorkflowAction[] = [
  "submitted",
  "start_review",
  "request_info",
  "teacher_feedback",
  "escalate_to_council",
  "approve",
  "reject",
  "manual_update",
];

const WORKFLOW_TABLE = "public.request_workflow_history";
const USERS_TABLE = "public.users";

let workflowTableInitialized = false;
let workflowInitPromise: Promise<void> | null = null;

const parseMetadata = (raw: Prisma.JsonValue | null): Record<string, unknown> | null => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  return raw as Record<string, unknown>;
};

const toNumber = (value: bigint | number): number =>
  typeof value === "bigint" ? Number(value) : value;

const normalizeWorkflowStage = (value: string): RequestWorkflowStage => {
  if (WORKFLOW_STAGES.includes(value as RequestWorkflowStage)) {
    return value as RequestWorkflowStage;
  }

  return "under_review";
};

const normalizeWorkflowAction = (value: string): RequestWorkflowAction => {
  if (WORKFLOW_ACTIONS.includes(value as RequestWorkflowAction)) {
    return value as RequestWorkflowAction;
  }

  return "manual_update";
};

const toPgTextArrayLiteral = (values: string[]): string => {
  if (!values.length) {
    return "{}";
  }

  const escaped = values.map((value) => {
    const item = String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${item}"`;
  });

  return `{${escaped.join(",")}}`;
};

const mapWorkflowRow = (row: WorkflowHistoryRow): RequestWorkflowHistoryItem => ({
  id: toNumber(row.id),
  requestCategory: row.requestCategory === "justification" ? "justification" : "reclamation",
  requestId: row.requestId,
  stage: normalizeWorkflowStage(row.stage),
  action: normalizeWorkflowAction(row.action),
  actorUserId: row.actorUserId,
  actorRoles: Array.isArray(row.actorRoles) ? row.actorRoles.filter(Boolean) : [],
  note: row.note,
  metadata: parseMetadata(row.metadata),
  createdAt: row.createdAt,
});

export const ensureRequestWorkflowHistoryTable = async (): Promise<void> => {
  if (workflowTableInitialized) {
    return;
  }

  if (!workflowInitPromise) {
    workflowInitPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${WORKFLOW_TABLE} (
          id BIGSERIAL PRIMARY KEY,
          request_category VARCHAR(32) NOT NULL,
          request_id INTEGER NOT NULL,
          stage VARCHAR(64) NOT NULL,
          action VARCHAR(64) NOT NULL,
          actor_user_id INTEGER REFERENCES ${USERS_TABLE}(id) ON DELETE SET NULL,
          actor_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
          note TEXT,
          metadata JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_request_workflow_request
        ON ${WORKFLOW_TABLE}(request_category, request_id, created_at DESC)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_request_workflow_stage
        ON ${WORKFLOW_TABLE}(stage)
      `);

      workflowTableInitialized = true;
    })()
      .catch((error) => {
        workflowTableInitialized = false;
        logger.error("Failed to initialize request workflow history table", error);
        throw error;
      })
      .finally(() => {
        workflowInitPromise = null;
      });
  }

  await workflowInitPromise;
};

export const appendRequestWorkflowEvent = async (
  input: AppendWorkflowEventInput
): Promise<RequestWorkflowHistoryItem> => {
  await ensureRequestWorkflowHistoryTable();

  const actorRoles = Array.from(new Set((input.actorRoles || []).map((role) => String(role || "").trim()).filter(Boolean)));
  const actorRolesLiteral = toPgTextArrayLiteral(actorRoles);
  const metadataSql = input.metadata
    ? Prisma.sql`CAST(${JSON.stringify(input.metadata)} AS JSONB)`
    : Prisma.sql`NULL`;

  const rows = await prisma.$queryRaw<WorkflowHistoryRow[]>(Prisma.sql`
    INSERT INTO public.request_workflow_history (
      request_category,
      request_id,
      stage,
      action,
      actor_user_id,
      actor_roles,
      note,
      metadata,
      created_at
    )
    VALUES (
      ${input.requestCategory},
      ${input.requestId},
      ${input.stage},
      ${input.action},
      ${input.actorUserId ?? null},
      CAST(${actorRolesLiteral} AS TEXT[]),
      ${input.note?.trim() || null},
      ${metadataSql},
      NOW()
    )
    RETURNING
      id,
      request_category AS "requestCategory",
      request_id AS "requestId",
      stage,
      action,
      actor_user_id AS "actorUserId",
      actor_roles AS "actorRoles",
      note,
      metadata,
      created_at AS "createdAt"
  `);

  if (!rows.length) {
    throw new Error("Unable to append workflow event");
  }

  return mapWorkflowRow(rows[0]);
};

export const ensureRequestWorkflowSubmitted = async (input: {
  requestCategory: RequestWorkflowCategory;
  requestId: number;
  actorUserId?: number | null;
  actorRoles?: string[];
  note?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  await ensureRequestWorkflowHistoryTable();

  const actorRoles = Array.from(new Set((input.actorRoles || []).map((role) => String(role || "").trim()).filter(Boolean)));
  const actorRolesLiteral = toPgTextArrayLiteral(actorRoles);
  const metadataSql = input.metadata
    ? Prisma.sql`CAST(${JSON.stringify(input.metadata)} AS JSONB)`
    : Prisma.sql`NULL`;

  await prisma.$queryRaw<WorkflowHistoryRow[]>(Prisma.sql`
    INSERT INTO public.request_workflow_history (
      request_category,
      request_id,
      stage,
      action,
      actor_user_id,
      actor_roles,
      note,
      metadata,
      created_at
    )
    SELECT
      ${input.requestCategory},
      ${input.requestId},
      'submitted',
      'submitted',
      ${input.actorUserId ?? null},
      CAST(${actorRolesLiteral} AS TEXT[]),
      ${input.note?.trim() || "Request submitted"},
      ${metadataSql},
      NOW()
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.request_workflow_history
      WHERE request_category = ${input.requestCategory}
        AND request_id = ${input.requestId}
    )
  `);
};

export const listRequestWorkflowHistory = async (
  requestCategory: RequestWorkflowCategory,
  requestId: number,
  limit = 100
): Promise<RequestWorkflowHistoryItem[]> => {
  await ensureRequestWorkflowHistoryTable();

  const safeLimit = Math.max(1, Math.min(300, Math.floor(Number(limit) || 100)));

  const rows = await prisma.$queryRaw<WorkflowHistoryRow[]>(Prisma.sql`
    SELECT
      id,
      request_category AS "requestCategory",
      request_id AS "requestId",
      stage,
      action,
      actor_user_id AS "actorUserId",
      actor_roles AS "actorRoles",
      note,
      metadata,
      created_at AS "createdAt"
    FROM public.request_workflow_history
    WHERE request_category = ${requestCategory}
      AND request_id = ${requestId}
    ORDER BY created_at DESC, id DESC
    LIMIT ${safeLimit}
  `);

  return rows.map(mapWorkflowRow).reverse();
};

export const getRequestLatestWorkflowStage = async (
  requestCategory: RequestWorkflowCategory,
  requestId: number
): Promise<RequestWorkflowStage | null> => {
  await ensureRequestWorkflowHistoryTable();

  const rows = await prisma.$queryRaw<Array<{ stage: string }>>(Prisma.sql`
    SELECT stage
    FROM public.request_workflow_history
    WHERE request_category = ${requestCategory}
      AND request_id = ${requestId}
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `);

  if (!rows.length) {
    return null;
  }

  return normalizeWorkflowStage(rows[0].stage);
};

export const loadLatestWorkflowStageMap = async (
  requestCategory: RequestWorkflowCategory,
  requestIds: number[]
): Promise<Map<number, RequestWorkflowStage>> => {
  const stageMap = new Map<number, RequestWorkflowStage>();

  if (!requestIds.length) {
    return stageMap;
  }

  await ensureRequestWorkflowHistoryTable();

  const rows = await prisma.$queryRaw<WorkflowStageRow[]>(Prisma.sql`
    SELECT DISTINCT ON (request_id)
      request_id AS "requestId",
      stage
    FROM public.request_workflow_history
    WHERE request_category = ${requestCategory}
      AND request_id IN (${Prisma.join(requestIds)})
    ORDER BY request_id, created_at DESC, id DESC
  `);

  rows.forEach((row) => {
    stageMap.set(row.requestId, normalizeWorkflowStage(row.stage));
  });

  return stageMap;
};

export const mapReclamationStatusToWorkflowStage = (status: string): RequestWorkflowStage => {
  const normalized = String(status || "").toLowerCase();
  if (["traitee", "refusee"].includes(normalized)) {
    return "final_decision";
  }
  if (["en_cours", "en_attente"].includes(normalized)) {
    return "under_review";
  }
  return "submitted";
};

export const mapJustificationStatusToWorkflowStage = (status: string): RequestWorkflowStage => {
  const normalized = String(status || "").toLowerCase();
  if (["valide", "refuse"].includes(normalized)) {
    return "final_decision";
  }
  if (["en_verification"].includes(normalized)) {
    return "under_review";
  }
  return "submitted";
};
