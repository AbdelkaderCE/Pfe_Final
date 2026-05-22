import type { Prisma } from "@prisma/client";
import prisma from "../../config/database";
import { ensureRbacCatalog } from "../../shared/rbac.service";
import { generateRandomPassword, hashPassword } from "../../utils/password";

export type UserImportType = "student" | "teacher";

export type CsvImportRow = {
  rowNumber: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
};

export type CsvImportRowStatus = "valid" | "invalid" | "duplicate" | "created" | "error";

export type CsvImportRowResult = CsvImportRow & {
  status: CsvImportRowStatus;
  message?: string;
  tempPassword?: string;
  userId?: number;
};

export type CsvImportTotals = {
  received: number;
  valid: number;
  invalid: number;
  duplicates: number;
  created: number;
  errors: number;
};

export type CsvImportResult = {
  totals: CsvImportTotals;
  rows: CsvImportRowResult[];
};

export class UserImportError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "UserImportError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const EXPECTED_HEADERS_STUDENT = ["matricule", "nom", "prenom", "email", "telephone"] as const;
const EXPECTED_HEADERS_TEACHER = ["nom", "prenom", "email", "telephone"] as const;
const CSV_INJECTION_PREFIXES = ["=", "+", "-", "@", "\t"] as const;
const MAX_PHONE_DIGITS = 20;
const MIN_PHONE_DIGITS = 6;

const normalizeHeader = (value: string): string => String(value || "").trim().toLowerCase().replace(/^\uFEFF/, "");
const normalizeCell = (value: string): string => String(value ?? "").trim();
const normalizeEmail = (value: string): string => normalizeCell(value).toLowerCase();
const normalizeMatricule = (value: string): string => normalizeCell(value);

const emailLooksValid = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const stripPhoneToDigits = (value: string): string => value.replace(/\D/g, "");

const phoneLooksValid = (phone: string): boolean => {
  const trimmed = normalizeCell(phone);
  if (!trimmed) return false;
  if (!/^[+()\d\s.-]+$/.test(trimmed)) return false;
  const digits = stripPhoneToDigits(trimmed);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
};

const isCsvInjection = (value: string, allowLeadingPlus: boolean): boolean => {
  const trimmed = normalizeCell(value);
  if (!trimmed) return false;
  if (allowLeadingPlus && trimmed.startsWith("+")) {
    return CSV_INJECTION_PREFIXES.some((prefix) => prefix !== "+" && trimmed.startsWith(prefix));
  }
  return CSV_INJECTION_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
};

const detectSeparator = (line: string): "," | ";" => {
  const commaCount = (line.match(/,/g) || []).length;
  const semiCount = (line.match(/;/g) || []).length;
  return semiCount > commaCount ? ";" : ",";
};

const parseCsv = (text: string, separator: string): string[][] => {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === separator) {
      current.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      current.push(cell);
      rows.push(current);
      current = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }

  return rows.filter((row) => row.some((value) => String(value).trim() !== ""));
};

const parseUserImportCsv = (csvText: string, type: UserImportType): CsvImportRow[] => {
  const normalized = String(csvText || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    throw new UserImportError("EMPTY_CSV", "CSV file is empty");
  }

  const firstLine = normalized.split("\n")[0] || "";
  const separator = detectSeparator(firstLine);
  const rows = parseCsv(normalized, separator);

  if (rows.length < 2) {
    throw new UserImportError("NO_DATA_ROWS", "CSV must have a header row and at least one data row");
  }

  const expectedHeaders = type === "student" ? EXPECTED_HEADERS_STUDENT : EXPECTED_HEADERS_TEACHER;
  const header = rows[0].map(normalizeHeader);
  if (header.length !== expectedHeaders.length) {
    throw new UserImportError(
      "INVALID_CSV_HEADER",
      `CSV header must be exactly: ${expectedHeaders.join(",")}`
    );
  }

  for (let i = 0; i < expectedHeaders.length; i += 1) {
    if (header[i] !== expectedHeaders[i]) {
      throw new UserImportError(
        "INVALID_CSV_HEADER",
        `CSV header must be exactly: ${expectedHeaders.join(",")}`
      );
    }
  }

  return rows.slice(1).map((cells, index) => {
    const safeCells = [...cells];
    while (safeCells.length < expectedHeaders.length) {
      safeCells.push("");
    }

    if (type === "student") {
      return {
        rowNumber: index + 2,
        matricule: normalizeMatricule(safeCells[0]),
        nom: normalizeCell(safeCells[1]),
        prenom: normalizeCell(safeCells[2]),
        email: normalizeCell(safeCells[3]),
        telephone: normalizeCell(safeCells[4]),
      };
    } else {
      return {
        rowNumber: index + 2,
        matricule: "",
        nom: normalizeCell(safeCells[0]),
        prenom: normalizeCell(safeCells[1]),
        email: normalizeCell(safeCells[2]),
        telephone: normalizeCell(safeCells[3]),
      };
    }
  });
};

const resolveRoleName = (type: UserImportType): "etudiant" | "enseignant" =>
  type === "student" ? "etudiant" : "enseignant";

const ensureRoleId = async (
  tx: Prisma.TransactionClient,
  roleName: "etudiant" | "enseignant"
): Promise<number> => {
  const role = await tx.role.findFirst({
    where: { nom: { equals: roleName, mode: "insensitive" } },
    select: { id: true },
  });

  if (!role) {
    throw new UserImportError("ROLE_NOT_FOUND", `Role '${roleName}' not found`, 500);
  }

  return role.id;
};

const applyRowMessage = (row: CsvImportRowResult, status: CsvImportRowStatus, message: string) => {
  row.status = status;
  row.message = message;
};

const validateCsvRows = (rows: CsvImportRow[], type: UserImportType): CsvImportRowResult[] => {
  const seenEmails = new Set<string>();
  const seenMatricules = new Set<string>();

  return rows.map((row) => {
    const entry: CsvImportRowResult = { ...row, status: "valid" };
    const errors: string[] = [];
    const duplicates: string[] = [];

    if (type === "student" && !row.matricule) errors.push("Missing matricule");
    if (!row.nom) errors.push("Missing nom");
    if (!row.prenom) errors.push("Missing prenom");
    if (!row.email) errors.push("Missing email");
    if (!row.telephone) errors.push("Missing telephone");

    const email = normalizeEmail(row.email);
    if (row.email && !emailLooksValid(email)) {
      errors.push(`Invalid email format: ${row.email}`);
    }

    if (row.telephone && !phoneLooksValid(row.telephone)) {
      errors.push(`Invalid telephone format: ${row.telephone}`);
    }

    if (type === "student" && isCsvInjection(row.matricule, false)) {
      errors.push(`Unsafe value in matricule: ${row.matricule}`);
    }
    if (isCsvInjection(row.nom, false)) {
      errors.push(`Unsafe value in nom: ${row.nom}`);
    }
    if (isCsvInjection(row.prenom, false)) {
      errors.push(`Unsafe value in prenom: ${row.prenom}`);
    }
    if (isCsvInjection(row.email, false)) {
      errors.push(`Unsafe value in email: ${row.email}`);
    }
    if (isCsvInjection(row.telephone, true)) {
      errors.push(`Unsafe value in telephone: ${row.telephone}`);
    }

    if (email) {
      if (seenEmails.has(email)) {
        duplicates.push(`Duplicate email in CSV: ${row.email}`);
      } else {
        seenEmails.add(email);
      }
    }

    if (type === "student" && row.matricule) {
      const matriculeKey = row.matricule.toLowerCase();
      if (seenMatricules.has(matriculeKey)) {
        duplicates.push(`Duplicate matricule in CSV: ${row.matricule}`);
      } else {
        seenMatricules.add(matriculeKey);
      }
    }

    if (errors.length > 0) {
      applyRowMessage(entry, "invalid", errors[0]);
      return entry;
    }

    if (duplicates.length > 0) {
      applyRowMessage(entry, "duplicate", duplicates[0]);
      return entry;
    }

    return entry;
  });
};

const applyDatabaseDuplicates = async (
  type: UserImportType,
  rows: CsvImportRowResult[]
): Promise<void> => {
  const candidates = rows.filter((row) => row.status === "valid");
  if (candidates.length === 0) return;

  const emails = candidates.map((row) => normalizeEmail(row.email)).filter(Boolean);
  const matricules = candidates.map((row) => row.matricule).filter(Boolean);

  const [existingUsers, existingMatricules] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: emails, mode: "insensitive" } },
      select: { email: true },
    }),
    type === "student"
      ? prisma.etudiant.findMany({
          where: { matricule: { in: matricules } },
          select: { matricule: true },
        })
      : Promise.resolve([]),
  ]);

  const existingEmailSet = new Set(existingUsers.map((user) => normalizeEmail(user.email)));
  const existingMatriculeSet = new Set(existingMatricules.map((record: { matricule: string | null }) => (record.matricule || "").toLowerCase()));

  rows.forEach((row) => {
    if (row.status !== "valid") return;
    const emailKey = normalizeEmail(row.email);
    const matriculeKey = row.matricule.toLowerCase();
    const duplicates: string[] = [];

    if (emailKey && existingEmailSet.has(emailKey)) {
      duplicates.push(`Email already exists: ${row.email}`);
    }
    if (matriculeKey && existingMatriculeSet.has(matriculeKey)) {
      duplicates.push(`Matricule already exists: ${row.matricule}`);
    }

    if (duplicates.length > 0) {
      applyRowMessage(row, "duplicate", duplicates[0]);
    }
  });
};

const buildTotals = (rows: CsvImportRowResult[], createdCount: number): CsvImportTotals => {
  const invalid = rows.filter((row) => row.status === "invalid").length;
  const duplicates = rows.filter((row) => row.status === "duplicate").length;
  const errors = rows.filter((row) => row.status === "error").length;
  const valid = rows.filter((row) => row.status === "valid" || row.status === "created").length;

  return {
    received: rows.length,
    valid,
    invalid,
    duplicates,
    created: createdCount,
    errors,
  };
};

export const importUsersFromCsv = async (input: {
  csvText: string;
  type: UserImportType;
  forcePasswordChange?: boolean;
}): Promise<CsvImportResult> => {
  await ensureRbacCatalog();

  const parsedRows = parseUserImportCsv(input.csvText, input.type);
  const results = validateCsvRows(parsedRows, input.type);
  await applyDatabaseDuplicates(input.type, results);

  const importableRows = results.filter((row) => row.status === "valid");
  if (importableRows.length === 0) {
    return {
      totals: buildTotals(results, 0),
      rows: results,
    };
  }

  const roleName = resolveRoleName(input.type);
  const forcePasswordChange = input.forcePasswordChange !== false;
  const createdByRowNumber = new Map<number, { userId: number; tempPassword: string }>();

  await prisma.$transaction(async (tx) => {
    const roleId = await ensureRoleId(tx, roleName);

    for (const row of importableRows) {
      const tempPassword = generateRandomPassword(12);
      const hashedPassword = await hashPassword(tempPassword);

      const user = await tx.user.create({
        data: {
          email: normalizeEmail(row.email),
          password: hashedPassword,
          nom: row.nom,
          prenom: row.prenom,
          telephone: row.telephone,
          firstUse: forcePasswordChange,
        },
        select: { id: true },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId,
        },
      });

      if (input.type === "student") {
        await tx.etudiant.create({
          data: {
            userId: user.id,
            matricule: row.matricule,
            anneeInscription: new Date().getFullYear(),
          },
        });
      } else {
        await tx.enseignant.create({
          data: {
            userId: user.id,
          },
        });
      }

      createdByRowNumber.set(row.rowNumber, { userId: user.id, tempPassword });
    }
  });

  results.forEach((row) => {
    const created = createdByRowNumber.get(row.rowNumber);
    if (!created) return;
    row.status = "created";
    row.userId = created.userId;
    row.tempPassword = created.tempPassword;
  });

  return {
    totals: buildTotals(results, createdByRowNumber.size),
    rows: results,
  };
};
