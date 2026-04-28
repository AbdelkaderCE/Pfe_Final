import { Request, Response, NextFunction } from "express";
import multer from "multer";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Resource not found",
    },
  });
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof multer.MulterError) {
    let message = "File upload failed";

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum allowed size is 10 MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field.";
    }

    res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message,
      },
    });
    return;
  }

  // Validation error
  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      },
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token expired",
      },
    });
    return;
  }

  // Prisma errors
  if (err.code === "P2002") {
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_ERROR",
        message: "A record with this value already exists",
        field: err.meta?.target,
      },
    });
    return;
  }

  if (err.code === "P2025") {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Record not found",
      },
    });
    return;
  }

  if (
    err.code === "P2003"
    || /violates\s+RESTRICT\s+setting\s+of\s+foreign\s+key\s+constraint/i.test(String(err.message || ""))
  ) {
    res.status(409).json({
      success: false,
      error: {
        code: "FOREIGN_KEY_CONFLICT",
        message: "Cannot delete this record because dependent records still reference it.",
      },
    });
    return;
  }

  // Default error — never leak raw stack or internal messages to clients in production
  const httpStatus = err.status || err.statusCode || 500;
  const isClientError = httpStatus < 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(httpStatus).json({
    success: false,
    error: {
      code: err.code || (isClientError ? "REQUEST_ERROR" : "INTERNAL_SERVER_ERROR"),
      message: isClientError || !isProduction
        ? (err.message || "Something went wrong")
        : "An internal server error occurred",
    },
  });
  return;
};
