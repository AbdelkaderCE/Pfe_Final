import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { listAuditLogs } from "../../shared/audit-log.service";

const parsePositiveInt = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

export const listAdminAuditLogsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await listAuditLogs({
      page: parsePositiveInt(req.query.page),
      limit: parsePositiveInt(req.query.limit),
      eventKey: typeof req.query.eventKey === "string" ? req.query.eventKey : undefined,
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      entityType: typeof req.query.entityType === "string" ? req.query.entityType : undefined,
      entityId: typeof req.query.entityId === "string" ? req.query.entityId : undefined,
      actorUserId: parsePositiveInt(req.query.actorUserId),
      from: typeof req.query.from === "string" ? req.query.from : undefined,
      to: typeof req.query.to === "string" ? req.query.to : undefined,
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "ADMIN_AUDIT_LIST_FAILED",
        message: error instanceof Error ? error.message : "Failed to load audit logs",
      },
    });
  }
};
