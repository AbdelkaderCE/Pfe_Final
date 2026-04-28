import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import logger from "../utils/logger";

type AuditLogRow = {
  id: bigint | number;
  eventKey: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: number | null;
  actorRoles: string[] | null;
  requestPath: string | null;
  requestMethod: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
};

export interface AuditLogRecord {
  id: number;
  eventKey: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: number | null;
  actorRoles: string[];
  requestPath: string | null;
  requestMethod: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}

export interface WriteAuditLogInput {
  eventKey: string;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  actorUserId?: number | null;
  actorRoles?: string[];
  requestPath?: string | null;
  requestMethod?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  eventKey?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: number;
  from?: string;
  to?: string;
}

const AUDIT_TABLE = "public.audit_logs";
const USERS_TABLE = "public.users";

let auditTableInitialized = false;
let auditTableInitPromise: Promise<void> | null = null;

const toNumber = (value: bigint | number): number =>
  typeof value === "bigint" ? Number(value) : value;

const parsePayload = (raw: Prisma.JsonValue | null): Record<string, unknown> | null => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  return raw as Record<string, unknown>;
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

const mapRow = (row: AuditLogRow): AuditLogRecord => ({
  id: toNumber(row.id),
  eventKey: row.eventKey,
  action: row.action,
  entityType: row.entityType,
  entityId: row.entityId,
  actorUserId: row.actorUserId,
  actorRoles: Array.isArray(row.actorRoles) ? row.actorRoles.filter(Boolean) : [],
  requestPath: row.requestPath,
  requestMethod: row.requestMethod,
  ipAddress: row.ipAddress,
  userAgent: row.userAgent,
  payload: parsePayload(row.payload),
  createdAt: row.createdAt,
});

export const ensureAuditLogTable = async (): Promise<void> => {
  if (auditTableInitialized) {
    return;
  }

  if (!auditTableInitPromise) {
    auditTableInitPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${AUDIT_TABLE} (
          id BIGSERIAL PRIMARY KEY,
          event_key VARCHAR(120) NOT NULL,
          action VARCHAR(80) NOT NULL,
          entity_type VARCHAR(80) NOT NULL,
          entity_id VARCHAR(120),
          actor_user_id INTEGER REFERENCES ${USERS_TABLE}(id) ON DELETE SET NULL,
          actor_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
          request_path TEXT,
          request_method VARCHAR(12),
          ip_address VARCHAR(128),
          user_agent TEXT,
          payload JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
        ON ${AUDIT_TABLE}(created_at DESC)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
        ON ${AUDIT_TABLE}(entity_type, entity_id)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
        ON ${AUDIT_TABLE}(actor_user_id)
      `);

      auditTableInitialized = true;
    })()
      .catch((error) => {
        auditTableInitialized = false;
        logger.error("Failed to initialize audit log table", error);
        throw error;
      })
      .finally(() => {
        auditTableInitPromise = null;
      });
  }

  await auditTableInitPromise;
};

export const writeAuditLog = async (input: WriteAuditLogInput): Promise<AuditLogRecord> => {
  await ensureAuditLogTable();

  const actorRoles = Array.from(new Set((input.actorRoles || []).map((role) => String(role || "").trim()).filter(Boolean)));
  const actorRolesLiteral = toPgTextArrayLiteral(actorRoles);
  const payloadSql = input.payload
    ? Prisma.sql`CAST(${JSON.stringify(input.payload)} AS JSONB)`
    : Prisma.sql`NULL`;

  const rows = await prisma.$queryRaw<AuditLogRow[]>(Prisma.sql`
    INSERT INTO public.audit_logs (
      event_key,
      action,
      entity_type,
      entity_id,
      actor_user_id,
      actor_roles,
      request_path,
      request_method,
      ip_address,
      user_agent,
      payload,
      created_at
    )
    VALUES (
      ${input.eventKey},
      ${input.action},
      ${input.entityType},
      ${input.entityId ? String(input.entityId) : null},
      ${input.actorUserId ?? null},
      CAST(${actorRolesLiteral} AS TEXT[]),
      ${input.requestPath || null},
      ${input.requestMethod || null},
      ${input.ipAddress || null},
      ${input.userAgent || null},
      ${payloadSql},
      NOW()
    )
    RETURNING
      id,
      event_key AS "eventKey",
      action,
      entity_type AS "entityType",
      entity_id AS "entityId",
      actor_user_id AS "actorUserId",
      actor_roles AS "actorRoles",
      request_path AS "requestPath",
      request_method AS "requestMethod",
      ip_address AS "ipAddress",
      user_agent AS "userAgent",
      payload,
      created_at AS "createdAt"
  `);

  if (!rows.length) {
    throw new Error("Unable to persist audit log");
  }

  return mapRow(rows[0]);
};

export const writeAuditLogSafe = async (input: WriteAuditLogInput): Promise<void> => {
  try {
    await writeAuditLog(input);
  } catch (error) {
    logger.warn("Unable to persist audit log event", error);
  }
};

export const listAuditLogs = async (filters: AuditLogFilters = {}) => {
  await ensureAuditLogTable();

  const page = Math.max(1, Math.floor(Number(filters.page) || 1));
  const limit = Math.max(1, Math.min(100, Math.floor(Number(filters.limit) || 20)));
  const offset = (page - 1) * limit;

  const whereParts: Prisma.Sql[] = [];

  if (filters.eventKey?.trim()) {
    whereParts.push(Prisma.sql`event_key = ${filters.eventKey.trim()}`);
  }

  if (filters.action?.trim()) {
    whereParts.push(Prisma.sql`action = ${filters.action.trim()}`);
  }

  if (filters.entityType?.trim()) {
    whereParts.push(Prisma.sql`entity_type = ${filters.entityType.trim()}`);
  }

  if (filters.entityId?.trim()) {
    whereParts.push(Prisma.sql`entity_id = ${filters.entityId.trim()}`);
  }

  if (Number.isInteger(filters.actorUserId) && Number(filters.actorUserId) > 0) {
    whereParts.push(Prisma.sql`actor_user_id = ${Number(filters.actorUserId)}`);
  }

  if (filters.from?.trim()) {
    whereParts.push(Prisma.sql`created_at >= ${new Date(filters.from)}`);
  }

  if (filters.to?.trim()) {
    whereParts.push(Prisma.sql`created_at <= ${new Date(filters.to)}`);
  }

  const whereClause = whereParts.length
    ? Prisma.sql`WHERE ${Prisma.join(whereParts, " AND ")}`
    : Prisma.empty;

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::INT AS total
      FROM public.audit_logs
      ${whereClause}
    `),
    prisma.$queryRaw<AuditLogRow[]>(Prisma.sql`
      SELECT
        id,
        event_key AS "eventKey",
        action,
        entity_type AS "entityType",
        entity_id AS "entityId",
        actor_user_id AS "actorUserId",
        actor_roles AS "actorRoles",
        request_path AS "requestPath",
        request_method AS "requestMethod",
        ip_address AS "ipAddress",
        user_agent AS "userAgent",
        payload,
        created_at AS "createdAt"
      FROM public.audit_logs
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `),
  ]);

  const total = Number(countRows[0]?.total || 0);

  return {
    items: rows.map(mapRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};
