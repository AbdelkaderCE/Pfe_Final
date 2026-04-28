import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth.middleware";
import {
  BulkAssignmentError,
  bulkAssignStudentsToPromo,
  bulkAssignTeacherEnseignements,
  importStudentsBulk,
  parseStudentCsv,
  type StudentImportRow,
  type TeacherAssignmentRow,
} from "../services/bulk-assignment.service";

const handleError = (res: Response, error: unknown, fallbackCode: string) => {
  if (error instanceof BulkAssignmentError) {
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    success: false,
    error: { code: fallbackCode, message },
  });
};

const parsePositiveInt = (raw: unknown): number | null => {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
};

/**
 * POST /api/v1/affectation/bulk/students/import
 * Body:
 *   { rows: [{firstName,lastName,email,matricule}], promoId?: number }
 *   OR { csv: "raw,csv,text", promoId?: number }
 * Either `rows` (array of objects) or `csv` (raw string) is required. When
 * both are provided, `rows` wins.
 */
export const importStudentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body ?? {}) as {
      rows?: StudentImportRow[];
      csv?: string;
      promoId?: number | string | null;
    };

    let rows: StudentImportRow[] = [];
    if (Array.isArray(body.rows)) {
      rows = body.rows;
    } else if (typeof body.csv === "string") {
      rows = parseStudentCsv(body.csv);
    }

    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "EMPTY_PAYLOAD",
          message: "Provide either `rows` (array) or `csv` (string) with at least one student",
        },
      });
      return;
    }

    const promoId = parsePositiveInt(body.promoId);
    const result = await importStudentsBulk({ rows, promoId });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, "STUDENTS_IMPORT_FAILED");
  }
};

/**
 * POST /api/v1/affectation/bulk/students/assign-promo
 * Body: { promoId: number, studentIds?: number[], userIds?: number[] }
 */
export const bulkAssignStudentsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body ?? {}) as {
      promoId?: number | string;
      studentIds?: Array<number | string>;
      userIds?: Array<number | string>;
    };

    const promoId = parsePositiveInt(body.promoId);
    if (!promoId) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_PROMO", message: "promoId is required" },
      });
      return;
    }

    const studentIds = (Array.isArray(body.studentIds) ? body.studentIds : [])
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);
    const userIds = (Array.isArray(body.userIds) ? body.userIds : [])
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);

    const result = await bulkAssignStudentsToPromo({ promoId, studentIds, userIds });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, "STUDENTS_BULK_ASSIGN_FAILED");
  }
};

/**
 * POST /api/v1/affectation/bulk/teachers/assign
 * Body: { rows: [{enseignantId, moduleId, promoId, type, academicYearId?}] }
 */
export const bulkAssignTeachersHandler = async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body ?? {}) as { rows?: TeacherAssignmentRow[] };
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: "EMPTY_ROWS", message: "`rows` must be a non-empty array" },
      });
      return;
    }
    const result = await bulkAssignTeacherEnseignements({ rows });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, "TEACHERS_BULK_ASSIGN_FAILED");
  }
};
