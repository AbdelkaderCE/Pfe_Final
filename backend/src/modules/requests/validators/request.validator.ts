import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateReclamation = [
  body("typeId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("typeId must be a valid integer"),
  body("typeName")
    .optional()
    .trim(),
  body("objet")
    .trim()
    .notEmpty()
    .withMessage("Objet is required"),
 body("description")
  .trim()
  .notEmpty()
  .withMessage("Description is required"),
  body("priorite")
    .optional()
    .isIn(["faible", "normale", "haute", "urgente"])
    .withMessage("Invalid priorite value"),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateJustification = [
  body("typeId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("typeId must be a valid integer"),
  body("typeName")
    .optional()
    .trim(),
  body("dateAbsence")
    .notEmpty()
    .isISO8601()
    .withMessage("dateAbsence must be a valid date (YYYY-MM-DD)"),
  body("motif")
    .optional()
    .trim(),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];