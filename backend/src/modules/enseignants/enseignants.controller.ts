import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";

/**
 * Deprecated: teacher↔course assignment is no longer the system's source of
 * truth. Teacher data is derived from PFE supervision (GroupPfe / GroupMember)
 * and the Promo entity. This shim is kept so existing clients receive a clear,
 * non-fatal response instead of a 404 while they migrate.
 */
export const getMyEnseignements = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  res.status(410).json({
    success: false,
    deprecated: true,
    message:
      "This feature is deprecated. Teacher data is now sourced from PFE supervision (GroupPfe).",
    data: [],
  });
};
