import { Response } from "express";
import logger from "../../../utils/logger";
import { AffectationServiceError } from "../services/campaign.service";
import { AffectationValidationError } from "../validators/affectation.validators";

export const sendServiceError = (res: Response, error: unknown, fallback: string): void => {
  if (error instanceof AffectationValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  if (error instanceof AffectationServiceError) {
    res.status(error.status).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }

  logger.error(fallback, error);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: fallback,
    },
  });
};

export const parseIdParam = (raw: unknown): number | null => {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

export const respondInvalidId = (res: Response, field = "id"): void => {
  res.status(400).json({
    success: false,
    error: {
      code: "INVALID_PARAMETER",
      message: `Invalid ${field} parameter`,
    },
  });
};
