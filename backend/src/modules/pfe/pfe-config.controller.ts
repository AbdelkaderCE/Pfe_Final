import type { Request, Response } from "express";
import {
  getPfeConfigSnapshot,
  isStudentVisibilityOpen,
  isSubmissionOpen,
  setStudentVisibilityOpen,
  setSubmissionOpen,
  setMaxSubjectsPerTeacher,
  setStudentSelectionAllowed,
  setJuryEnabled,
} from "./pfe-config.service";
import { emitSubmissionOpenedAlerts } from "./pfe-alerts.service";

export const getSubmissionFlagHandler = async (_req: Request, res: Response) => {
  try {
    const open = await isSubmissionOpen();
    res.json({ success: true, data: { isSubmissionOpen: open } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_CONFIG_READ_FAILED", message },
    });
  }
};

export const setSubmissionFlagHandler = async (req: Request & { user?: { id?: number } }, res: Response) => {
  try {
    const raw = (req.body as { isSubmissionOpen?: unknown; open?: unknown })?.isSubmissionOpen
      ?? (req.body as { open?: unknown })?.open;
    if (typeof raw !== "boolean") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "Body must include `isSubmissionOpen: boolean`",
        },
      });
      return;
    }
    const previous = await isSubmissionOpen();
    const result = await setSubmissionOpen(raw, req.user?.id ?? null);
    // Fan-out: when the toggle moves false→true, notify every teacher that
    // submissions are now open. Done after the write commits; alert errors
    // are swallowed inside the helper so they cannot mask the success.
    if (!previous && result.isSubmissionOpen) {
      await emitSubmissionOpenedAlerts(req.user?.id ?? null);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_CONFIG_WRITE_FAILED", message },
    });
  }
};

export const getStudentVisibilityHandler = async (_req: Request, res: Response) => {
  try {
    const open = await isStudentVisibilityOpen();
    res.json({ success: true, data: { isStudentVisibilityOpen: open } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_CONFIG_READ_FAILED", message },
    });
  }
};

export const setStudentVisibilityHandler = async (req: Request & { user?: { id?: number } }, res: Response) => {
  try {
    const raw = (req.body as { isStudentVisibilityOpen?: unknown; open?: unknown })?.isStudentVisibilityOpen
      ?? (req.body as { open?: unknown })?.open;
    if (typeof raw !== "boolean") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "Body must include `isStudentVisibilityOpen: boolean`",
        },
      });
      return;
    }
    const result = await setStudentVisibilityOpen(raw, req.user?.id ?? null);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_CONFIG_WRITE_FAILED", message },
    });
  }
};

export const getPfeConfigSnapshotHandler = async (_req: Request, res: Response) => {
  try {
    const snapshot = await getPfeConfigSnapshot();
    res.json({ success: true, data: snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_CONFIG_READ_FAILED", message },
    });
  }
};

/**
 * PUT /admin/config — update multiple PFE config settings at once.
 * The body is a partial map of config keys to their new values.
 */
export const updatePfeConfigHandler = async (req: Request & { user?: { id?: number } }, res: Response) => {
  try {
    const body = req.body || {};
    const userId = req.user?.id ?? null;

    // Process each setting if present in the body
    if (typeof body.submissionOpen === "boolean") {
      const previous = await isSubmissionOpen();
      await setSubmissionOpen(body.submissionOpen, userId);
      if (!previous && body.submissionOpen) {
        await emitSubmissionOpenedAlerts(userId);
      }
    }
    if (typeof body.studentVisibilityOpen === "boolean") {
      await setStudentVisibilityOpen(body.studentVisibilityOpen, userId);
    }
    if (typeof body.maxSubjectsPerTeacher === "number") {
      await setMaxSubjectsPerTeacher(body.maxSubjectsPerTeacher, userId);
    }
    if (typeof body.allowStudentSelection === "boolean") {
      await setStudentSelectionAllowed(body.allowStudentSelection, userId);
    }
    if (typeof body.juryEnabled === "boolean") {
      await setJuryEnabled(body.juryEnabled, userId);
    }

    // Return the updated snapshot
    const snapshot = await getPfeConfigSnapshot();
    res.json({ success: true, data: snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "PFE_CONFIG_WRITE_FAILED", message },
    });
  }
};
