import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getUserAlerts,
  markAsRead,
} from "./alerts.service";
import logger from "../../utils/logger";

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const parseId = (raw: unknown): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const requireUserId = (req: AuthRequest, res: Response): number | null => {
  const userId = Number(req.user?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return null;
  }

  return userId;
};

export const getAlertsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const unreadOnly = parseBoolean(req.query.unreadOnly);
    const limitRaw = Number(req.query.limit);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

    const data = await getUserAlerts(userId, {
      onlyUnread: unreadOnly === true,
      limit,
    });

    const unreadCount = data.reduce((count, alert) => count + (alert.isRead ? 0 : 1), 0);
    res.status(200).json({ success: true, data, count: data.length, unreadCount });
  } catch (error) {
    logger.error("getAlertsHandler", error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des alertes utilisateur" });
  }
};

export const getActiveAlertsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const data = await getUserAlerts(userId, {});
    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    logger.error("getActiveAlertsHandler", error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des alertes actives" });
  }
};

export const markAlertAsReadHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: "ID invalide" });
    return;
  }

  try {
    const data = await markAsRead(id, userId);
    res.status(200).json({ success: true, message: "Alerte marquée comme lue", data });
  } catch (error) {
    logger.error("markAlertAsReadHandler", error);
    const message = error instanceof Error ? error.message : "Alerte introuvable";
    const statusCode = message.toLowerCase().includes("not found") ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};
