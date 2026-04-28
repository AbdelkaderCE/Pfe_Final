import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  createGuestSubmission,
  createUserSubmission,
  listUserSubmissions,
  SubmissionKind,
} from "./submission.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidType = (value: unknown): value is SubmissionKind => {
  const upper = String(value || "").toUpperCase();
  return upper === "JUSTIFICATION" || upper === "RECLAMATION";
};

const badRequest = (res: Response, message: string) =>
  res.status(400).json({
    success: false,
    error: { code: "BAD_REQUEST", message },
  });

/**
 * POST /api/v1/submissions
 * Routes guest vs authenticated based on presence of req.user (optionalAuth).
 */
export const createSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, message, subject, firstName, lastName, email } = req.body || {};

    if (!isValidType(type)) {
      badRequest(res, "type must be JUSTIFICATION or RECLAMATION");
      return;
    }

    const normalizedMessage = String(message || "").trim();
    if (!normalizedMessage) {
      badRequest(res, "message is required");
      return;
    }

    if (req.user?.id) {
      const created = await createUserSubmission({
        type: type as SubmissionKind,
        userId: req.user.id,
        subject: subject ?? null,
        message: normalizedMessage,
      });

      res.status(201).json({
        success: true,
        data: { ...created, author: { kind: "user", userId: req.user.id } },
      });
      return;
    }

    const fn = String(firstName || "").trim();
    const ln = String(lastName || "").trim();
    const em = String(email || "").trim();

    if (!fn || !ln) {
      badRequest(res, "firstName and lastName are required for guests");
      return;
    }

    if (!EMAIL_REGEX.test(em)) {
      badRequest(res, "A valid email is required for guests");
      return;
    }

    const created = await createGuestSubmission({
      type: type as SubmissionKind,
      firstName: fn,
      lastName: ln,
      email: em,
      subject: subject ?? null,
      message: normalizedMessage,
    });

    res.status(201).json({
      success: true,
      data: { ...created, author: { kind: "guest" } },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message },
    });
  }
};

/**
 * GET /api/v1/submissions/my
 * Returns submissions for the authenticated user. Guests are rejected.
 */
export const getMySubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const data = await listUserSubmissions(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message },
    });
  }
};
