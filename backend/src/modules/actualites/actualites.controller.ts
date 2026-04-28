import { Request, Response } from "express";
import {
  listEventsActualites,
  listNewsActualites,
  listPinnedActualites,
} from "./actualites.service";
import logger from "../../utils/logger";

export const getPinnedActualitesHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await listPinnedActualites();
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    logger.error("Error loading pinned actualites", error);
    res.status(500).json({ success: false, message: "Failed to load pinned actualites" });
  }
};

export const getNewsActualitesHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await listNewsActualites();
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    logger.error("Error loading actualites news", error);
    res.status(500).json({ success: false, message: "Failed to load actualites news" });
  }
};

export const getEventsActualitesHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await listEventsActualites();
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    logger.error("Error loading actualites events", error);
    res.status(500).json({ success: false, message: "Failed to load actualites events" });
  }
};
