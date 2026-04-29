import type { Response } from "express";
import type { AuthRequest } from "../../../middlewares/auth.middleware";
import prisma from "../../../config/database";
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

/**
 * POST /api/v1/affectation/bulk/import-averages
 *
 * Body: { rows: [{ email: string, average: number }] }
 *   OR: { csv: "email,average\nstudent@...,14.5\n..." }
 *
 * Validates each row, resolves the student, and updates their `moyenne`.
 * Returns a summary with successes and errors for each row.
 */
export const importAveragesHandler = async (req: AuthRequest, res: Response) => {
  try {
    type AverageRow = { email?: string; studentId?: number | string; average?: number | string; moyenne?: number | string };
    const body = (req.body ?? {}) as { rows?: AverageRow[]; csv?: string };

    let rows: AverageRow[] = [];

    if (Array.isArray(body.rows)) {
      rows = body.rows;
    } else if (typeof body.csv === "string" && body.csv.trim()) {
      // Simple CSV parser: first line is header, remaining are data
      const lines = body.csv.trim().split(/\r?\n/);
      if (lines.length < 2) {
        res.status(400).json({
          success: false,
          error: { code: "CSV_EMPTY", message: "CSV must have a header row and at least one data row" },
        });
        return;
      }
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const emailIdx = header.findIndex((h) => h === "email");
      const avgIdx = header.findIndex((h) =>
        ["average", "moyenne", "score", "averagescore", "average_score"].includes(h)
      );
      if (emailIdx === -1 || avgIdx === -1) {
        res.status(400).json({
          success: false,
          error: {
            code: "CSV_MISSING_COLUMNS",
            message: "CSV header must include 'email' and one of 'average'/'moyenne'/'score' columns",
          },
        });
        return;
      }
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (!cols[emailIdx]) continue;
        rows.push({ email: cols[emailIdx], average: cols[avgIdx] });
      }
    }

    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: "EMPTY_PAYLOAD", message: "No data rows provided" },
      });
      return;
    }

    const results: Array<{
      row: number;
      email?: string;
      status: "success" | "error";
      message?: string;
      updatedAverage?: number;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = (row.email || "").trim().toLowerCase();
      const rawAvg = Number(row.average ?? row.moyenne);

      if (!email) {
        results.push({ row: i + 1, status: "error", message: "Missing email" });
        continue;
      }
      if (isNaN(rawAvg) || rawAvg < 0 || rawAvg > 20) {
        results.push({ row: i + 1, email, status: "error", message: `Invalid average: ${row.average ?? row.moyenne}. Must be 0-20.` });
        continue;
      }

      // Resolve student by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!user) {
        results.push({ row: i + 1, email, status: "error", message: "Student not found" });
        continue;
      }
      const etudiant = await prisma.etudiant.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!etudiant) {
        results.push({ row: i + 1, email, status: "error", message: "User exists but is not a student" });
        continue;
      }

      // Update the moyenne
      const rounded = Math.round(rawAvg * 100) / 100;
      await prisma.etudiant.update({
        where: { id: etudiant.id },
        data: { moyenne: rounded },
      });
      results.push({ row: i + 1, email, status: "success", updatedAverage: rounded });
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    res.status(200).json({
      success: true,
      data: {
        total: rows.length,
        successCount,
        errorCount,
        results,
      },
    });
  } catch (error) {
    handleError(res, error, "AVERAGES_IMPORT_FAILED");
  }
};

