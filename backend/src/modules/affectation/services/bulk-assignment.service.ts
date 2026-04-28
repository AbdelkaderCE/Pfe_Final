import { Prisma } from "@prisma/client";
import prisma from "../../../config/database";
import { hashPassword, generateRandomPassword } from "../../../utils/password";

/**
 * Bulk operations for the admin "affectation" surface — CSV student import,
 * mass promo assignment, and mass teacher → enseignement assignment.
 *
 * Design notes:
 *   - All operations are idempotent at the row level: existing users keyed
 *     by email are reused (NOT recreated); existing student rows have their
 *     promoId updated; existing enseignement rows are deduped on (teacher,
 *     module, promo, type, year).
 *   - Each call returns a per-row report so the admin UI can show "X created,
 *     Y updated, Z skipped" without making the user replay the operation.
 *   - We never throw on a single row; only on payload-level errors. Row
 *     failures are accumulated under `errors`.
 */

export class BulkAssignmentError extends Error {
  statusCode: number;
  code: string;
  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "BulkAssignmentError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const STUDENT_ROLE_NAME = "etudiant";

export type StudentImportRow = {
  firstName?: string;
  lastName?: string;
  email?: string;
  matricule?: string;
};

export type StudentImportReportRow = {
  email: string;
  status: "created" | "updated" | "skipped" | "error";
  userId?: number;
  etudiantId?: number;
  matricule?: string | null;
  promoId?: number | null;
  message?: string;
  tempPassword?: string;
};

const normalize = (value: unknown): string => String(value ?? "").trim();

const emailLooksValid = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ensureStudentRoleId = async (
  tx: Prisma.TransactionClient
): Promise<number> => {
  const existing = await tx.role.findFirst({
    where: { nom: { equals: STUDENT_ROLE_NAME, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await tx.role.create({
    data: { nom: STUDENT_ROLE_NAME, description: "Etudiant" },
    select: { id: true },
  });
  return created.id;
};

/**
 * Parse a raw CSV string into rows. Accepts comma OR semicolon separators
 * and a header line. Header keys are case-insensitive and tolerant of common
 * synonyms (firstname/prenom, lastname/nom, email/mail, matricule/id).
 */
export const parseStudentCsv = (raw: string): StudentImportRow[] => {
  const text = String(raw || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return [];

  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 1) return [];

  const detectSeparator = (line: string): "," | ";" | "\t" => {
    if (line.includes(";")) return ";";
    if (line.includes("\t")) return "\t";
    return ",";
  };

  const sep = detectSeparator(lines[0]);
  // Naive splitter — sufficient for ASCII CSVs the admin uploads. Quoted
  // values containing the separator are unwrapped of their outer quotes.
  const splitLine = (line: string): string[] =>
    line
      .split(sep)
      .map((cell) => cell.trim().replace(/^"(.*)"$/, "$1"));

  const headerCells = splitLine(lines[0]).map((cell) => cell.toLowerCase());
  const colMap = {
    firstName: headerCells.findIndex((h) =>
      ["firstname", "first_name", "prenom", "prénom"].includes(h)
    ),
    lastName: headerCells.findIndex((h) =>
      ["lastname", "last_name", "nom", "surname"].includes(h)
    ),
    email: headerCells.findIndex((h) => ["email", "mail", "courriel"].includes(h)),
    matricule: headerCells.findIndex((h) =>
      ["matricule", "id", "numero", "reference"].includes(h)
    ),
  };

  if (colMap.email < 0) {
    throw new BulkAssignmentError(
      "INVALID_CSV_HEADER",
      "CSV must contain an `email` column"
    );
  }

  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    return {
      firstName: colMap.firstName >= 0 ? normalize(cells[colMap.firstName]) : "",
      lastName: colMap.lastName >= 0 ? normalize(cells[colMap.lastName]) : "",
      email: normalize(cells[colMap.email]).toLowerCase(),
      matricule: colMap.matricule >= 0 ? normalize(cells[colMap.matricule]) : "",
    };
  });
};

/**
 * Import a batch of students. Each row is processed independently:
 *   - existing user (matched by email) → student role is granted if missing,
 *     etudiant row is upserted, promoId is updated when provided.
 *   - new email → user is created with a temp password, marked firstUse=true,
 *     student role attached, etudiant row created.
 *
 * `targetPromoId` is optional — when present every imported student is
 * assigned to that promo. Rows with missing/invalid emails go to `errors`.
 */
export const importStudentsBulk = async (input: {
  rows: StudentImportRow[];
  promoId?: number | null;
}): Promise<{
  totals: { received: number; created: number; updated: number; skipped: number; errors: number };
  rows: StudentImportReportRow[];
}> => {
  const rows = Array.isArray(input.rows) ? input.rows : [];
  const promoId =
    Number.isInteger(input.promoId) && (input.promoId as number) > 0
      ? (input.promoId as number)
      : null;

  if (promoId) {
    const promo = await prisma.promo.findUnique({
      where: { id: promoId },
      select: { id: true },
    });
    if (!promo) {
      throw new BulkAssignmentError("PROMO_NOT_FOUND", "Selected promo not found", 404);
    }
  }

  const report: StudentImportReportRow[] = [];

  for (const raw of rows) {
    const email = normalize(raw.email).toLowerCase();
    const firstName = normalize(raw.firstName) || "Etudiant";
    const lastName = normalize(raw.lastName) || "Etudiant";
    const incomingMatricule = normalize(raw.matricule);

    if (!email || !emailLooksValid(email)) {
      report.push({
        email: email || "(empty)",
        status: "error",
        message: "Invalid or missing email",
      });
      continue;
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          etudiant: { select: { id: true, promoId: true, matricule: true } },
        },
      });

      if (existingUser) {
        // Update path — student row is upserted, role is added if missing.
        const result = await prisma.$transaction(async (tx) => {
          const studentRoleId = await ensureStudentRoleId(tx);
          await tx.userRole.upsert({
            where: {
              userId_roleId: { userId: existingUser.id, roleId: studentRoleId },
            },
            update: {},
            create: { userId: existingUser.id, roleId: studentRoleId },
          });

          const matricule =
            incomingMatricule ||
            existingUser.etudiant?.matricule ||
            `TMP-${existingUser.id}`;

          const etudiant = await tx.etudiant.upsert({
            where: { userId: existingUser.id },
            update: {
              matricule,
              ...(promoId ? { promoId } : {}),
            },
            create: {
              userId: existingUser.id,
              matricule,
              promoId: promoId ?? undefined,
              anneeInscription: new Date().getFullYear(),
            },
            select: { id: true, promoId: true, matricule: true },
          });

          return etudiant;
        });

        report.push({
          email,
          status: "updated",
          userId: existingUser.id,
          etudiantId: result.id,
          matricule: result.matricule,
          promoId: result.promoId,
        });
      } else {
        const tempPassword = generateRandomPassword(12);
        const hashedPassword = await hashPassword(tempPassword);

        const result = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email,
              password: hashedPassword,
              nom: lastName,
              prenom: firstName,
              firstUse: true,
            },
            select: { id: true },
          });

          const studentRoleId = await ensureStudentRoleId(tx);
          await tx.userRole.create({
            data: { userId: newUser.id, roleId: studentRoleId },
          });

          const etudiant = await tx.etudiant.create({
            data: {
              userId: newUser.id,
              matricule: incomingMatricule || `TMP-${newUser.id}`,
              promoId: promoId ?? undefined,
              anneeInscription: new Date().getFullYear(),
            },
            select: { id: true, promoId: true, matricule: true },
          });

          return { newUser, etudiant };
        });

        report.push({
          email,
          status: "created",
          userId: result.newUser.id,
          etudiantId: result.etudiant.id,
          matricule: result.etudiant.matricule,
          promoId: result.etudiant.promoId,
          tempPassword,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.push({ email, status: "error", message });
    }
  }

  const totals = report.reduce(
    (acc, row) => {
      if (row.status === "created") acc.created += 1;
      else if (row.status === "updated") acc.updated += 1;
      else if (row.status === "skipped") acc.skipped += 1;
      else if (row.status === "error") acc.errors += 1;
      return acc;
    },
    { received: rows.length, created: 0, updated: 0, skipped: 0, errors: 0 }
  );

  return { totals, rows: report };
};

/**
 * Mass-assign N students to one promo. Inputs are user-ids OR student-ids
 * (the admin UI gives student ids; CSV-imported users come back with userId).
 * Rows that cannot be resolved go to `errors`. The promo is verified once.
 */
export const bulkAssignStudentsToPromo = async (input: {
  promoId: number;
  studentIds?: number[];
  userIds?: number[];
}): Promise<{
  totals: { requested: number; updated: number; errors: number };
  rows: Array<{
    inputId: number;
    inputKind: "etudiantId" | "userId";
    status: "updated" | "error";
    etudiantId?: number;
    userId?: number;
    promoId?: number;
    message?: string;
  }>;
}> => {
  const promoId = Number(input.promoId);
  if (!Number.isInteger(promoId) || promoId <= 0) {
    throw new BulkAssignmentError("INVALID_PROMO", "promoId must be a positive integer");
  }
  const promo = await prisma.promo.findUnique({
    where: { id: promoId },
    select: { id: true },
  });
  if (!promo) {
    throw new BulkAssignmentError("PROMO_NOT_FOUND", "Selected promo not found", 404);
  }

  const studentIds = Array.isArray(input.studentIds)
    ? input.studentIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];
  const userIds = Array.isArray(input.userIds)
    ? input.userIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (studentIds.length === 0 && userIds.length === 0) {
    throw new BulkAssignmentError(
      "EMPTY_SELECTION",
      "Provide at least one studentId or userId"
    );
  }

  const rows: Array<{
    inputId: number;
    inputKind: "etudiantId" | "userId";
    status: "updated" | "error";
    etudiantId?: number;
    userId?: number;
    promoId?: number;
    message?: string;
  }> = [];

  for (const id of studentIds) {
    try {
      const updated = await prisma.etudiant.update({
        where: { id },
        data: { promoId },
        select: { id: true, userId: true, promoId: true },
      });
      rows.push({
        inputId: id,
        inputKind: "etudiantId",
        status: "updated",
        etudiantId: updated.id,
        userId: updated.userId,
        promoId: updated.promoId ?? undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      rows.push({ inputId: id, inputKind: "etudiantId", status: "error", message });
    }
  }

  for (const id of userIds) {
    try {
      const updated = await prisma.etudiant.upsert({
        where: { userId: id },
        update: { promoId },
        create: {
          userId: id,
          promoId,
          matricule: `TMP-${id}`,
          anneeInscription: new Date().getFullYear(),
        },
        select: { id: true, userId: true, promoId: true },
      });
      rows.push({
        inputId: id,
        inputKind: "userId",
        status: "updated",
        etudiantId: updated.id,
        userId: updated.userId,
        promoId: updated.promoId ?? undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      rows.push({ inputId: id, inputKind: "userId", status: "error", message });
    }
  }

  const totals = rows.reduce(
    (acc, row) => {
      if (row.status === "updated") acc.updated += 1;
      else acc.errors += 1;
      return acc;
    },
    { requested: rows.length, updated: 0, errors: 0 }
  );

  return { totals, rows };
};

/**
 * Mass-assign teacher enseignements. Each row is one assignment (teacher +
 * module + promo + type + optional year). Duplicate rows already in the DB
 * are skipped (by the existing service-level dedup rule). The admin UI uses
 * this to bulk-attach a teacher to many modules in one click.
 */
export type TeacherAssignmentRow = {
  enseignantId: number | string;
  moduleId: number | string;
  promoId: number | string;
  type: string;
  academicYearId?: number | string | null;
};

export const bulkAssignTeacherEnseignements = async (input: {
  rows: TeacherAssignmentRow[];
}): Promise<{
  totals: { requested: number; created: number; skipped: number; errors: number };
  rows: Array<{
    enseignantId?: number;
    moduleId?: number;
    promoId?: number;
    type?: string;
    academicYearId?: number | null;
    enseignementId?: number;
    status: "created" | "skipped" | "error";
    message?: string;
  }>;
}> => {
  const VALID_TYPES = new Set(["cours", "td", "tp", "online"]);
  const incoming = Array.isArray(input.rows) ? input.rows : [];
  const report: Array<{
    enseignantId?: number;
    moduleId?: number;
    promoId?: number;
    type?: string;
    academicYearId?: number | null;
    enseignementId?: number;
    status: "created" | "skipped" | "error";
    message?: string;
  }> = [];

  for (const row of incoming) {
    const enseignantId = Number(row.enseignantId);
    const moduleId = Number(row.moduleId);
    const promoId = Number(row.promoId);
    const type = String(row.type || "").toLowerCase().trim();
    const academicYearId =
      row.academicYearId === undefined || row.academicYearId === null || row.academicYearId === ""
        ? null
        : Number(row.academicYearId);

    if (
      !Number.isInteger(enseignantId) ||
      !Number.isInteger(moduleId) ||
      !Number.isInteger(promoId) ||
      enseignantId <= 0 ||
      moduleId <= 0 ||
      promoId <= 0 ||
      !VALID_TYPES.has(type)
    ) {
      report.push({
        enseignantId: Number.isInteger(enseignantId) ? enseignantId : undefined,
        moduleId: Number.isInteger(moduleId) ? moduleId : undefined,
        promoId: Number.isInteger(promoId) ? promoId : undefined,
        type,
        status: "error",
        message: "Invalid row (enseignantId, moduleId, promoId, type required)",
      });
      continue;
    }

    try {
      const existing = await prisma.enseignement.findFirst({
        where: {
          enseignantId,
          moduleId,
          promoId,
          type: type as any,
          academicYearId: academicYearId ?? null,
        },
        select: { id: true },
      });

      if (existing) {
        report.push({
          enseignantId,
          moduleId,
          promoId,
          type,
          academicYearId,
          enseignementId: existing.id,
          status: "skipped",
          message: "Identical enseignement already exists",
        });
        continue;
      }

      let anneeUniversitaire: string | undefined;
      if (academicYearId) {
        const yr = await prisma.academicYear.findUnique({
          where: { id: academicYearId },
          select: { name: true },
        });
        if (yr?.name) anneeUniversitaire = yr.name;
      }

      const created = await prisma.enseignement.create({
        data: {
          enseignantId,
          moduleId,
          promoId,
          type: type as any,
          academicYearId: academicYearId ?? undefined,
          anneeUniversitaire,
        },
        select: { id: true },
      });

      report.push({
        enseignantId,
        moduleId,
        promoId,
        type,
        academicYearId,
        enseignementId: created.id,
        status: "created",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.push({
        enseignantId,
        moduleId,
        promoId,
        type,
        academicYearId,
        status: "error",
        message,
      });
    }
  }

  const totals = report.reduce(
    (acc, row) => {
      if (row.status === "created") acc.created += 1;
      else if (row.status === "skipped") acc.skipped += 1;
      else acc.errors += 1;
      return acc;
    },
    { requested: report.length, created: 0, skipped: 0, errors: 0 }
  );

  return { totals, rows: report };
};
