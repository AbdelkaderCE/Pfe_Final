import prisma from "../../config/database";

/**
 * Submission lock — uses the existing `pfe_config` key-value table so we
 * don't need a schema change. The boolean is stored as the string "true" /
 * "false" under a fixed key. Default (missing row) is **closed**.
 *
 * The same key-value table backs other PFE configs, so we co-exist by using
 * a unique nom_config and never touching rows we don't own.
 */
const SUBMISSION_OPEN_KEY = "submission_open";
// Legacy key written by the original sujet.controller.create check. We honor
// it as a fallback so existing admin settings keep working until they're
// explicitly migrated via the new endpoint.
const LEGACY_SUBMISSION_KEY = "proposition_sujets_ouverte";
// Student visibility window: when CLOSED, the available-subjects listing
// returned to students is empty (admin can stage subjects without exposing
// them). Independent of `submission_open` — admin can keep submissions open
// while hiding the catalog from students.
const STUDENT_VISIBILITY_KEY = "student_visibility_open";

const PARSE_TRUE = new Set(["true", "1", "yes", "on"]);

const parseBoolean = (raw: string | null | undefined): boolean =>
  PARSE_TRUE.has(String(raw || "").trim().toLowerCase());

/**
 * Returns the current "are teachers allowed to submit subjects?" flag.
 * Resolution order:
 *   1. New canonical key `submission_open`
 *   2. Legacy key `proposition_sujets_ouverte` (latest by updatedAt)
 *   3. Default: `false` — fail-closed.
 */
export const isSubmissionOpen = async (): Promise<boolean> => {
  const newRow = await prisma.pfeConfig.findFirst({
    where: { nom_config: SUBMISSION_OPEN_KEY },
    select: { valeur: true },
  });
  if (newRow) return parseBoolean(newRow.valeur);

  const legacy = await prisma.pfeConfig.findFirst({
    where: { nom_config: LEGACY_SUBMISSION_KEY },
    orderBy: { updatedAt: "desc" },
    select: { valeur: true },
  });
  if (legacy) return parseBoolean(legacy.valeur);

  return false;
};

/**
 * Toggle the flag. Idempotent (upsert by unique nom_config).
 *
 * `anneeUniversitaire` is required by the schema — we reuse the active
 * academic year if one exists, otherwise fall back to the current civil
 * year as a string so the row can always be created. The value isn't
 * meaningful for this lock; it just satisfies NOT NULL.
 */
export const setSubmissionOpen = async (
  open: boolean,
  byUserId?: number | null
): Promise<{ isSubmissionOpen: boolean; updatedAt: Date }> => {
  const annee = await resolveAnneeLabel();
  const value = open ? "true" : "false";

  const row = await prisma.pfeConfig.upsert({
    where: { nom_config: SUBMISSION_OPEN_KEY },
    create: {
      nom_config: SUBMISSION_OPEN_KEY,
      valeur: value,
      anneeUniversitaire: annee,
      createdBy: byUserId ?? null,
      description_en: "Whether teachers may submit new PFE subjects",
    },
    update: {
      valeur: value,
      // anneeUniversitaire is left untouched on update so the original
      // creation context is preserved.
    },
    select: { valeur: true, updatedAt: true },
  });

  return {
    isSubmissionOpen: PARSE_TRUE.has(String(row.valeur).trim().toLowerCase()),
    updatedAt: row.updatedAt,
  };
};

const resolveAnneeLabel = async (): Promise<string> => {
  const active = await prisma.academicYear.findFirst({
    where: { isActive: true },
    select: { name: true },
  });
  if (active?.name) return active.name;

  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

/**
 * Student catalog visibility window. Default is OPEN (true) so existing
 * deployments keep behaving as before — the admin must explicitly close it.
 */
export const isStudentVisibilityOpen = async (): Promise<boolean> => {
  const row = await prisma.pfeConfig.findFirst({
    where: { nom_config: STUDENT_VISIBILITY_KEY },
    select: { valeur: true },
  });
  if (!row) return true; // default: visible
  return parseBoolean(row.valeur);
};

export const setStudentVisibilityOpen = async (
  open: boolean,
  byUserId?: number | null
): Promise<{ isStudentVisibilityOpen: boolean; updatedAt: Date }> => {
  const annee = await resolveAnneeLabel();
  const value = open ? "true" : "false";

  const row = await prisma.pfeConfig.upsert({
    where: { nom_config: STUDENT_VISIBILITY_KEY },
    create: {
      nom_config: STUDENT_VISIBILITY_KEY,
      valeur: value,
      anneeUniversitaire: annee,
      createdBy: byUserId ?? null,
      description_en: "Whether students may browse PFE subjects",
    },
    update: { valeur: value },
    select: { valeur: true, updatedAt: true },
  });

  return {
    isStudentVisibilityOpen: PARSE_TRUE.has(String(row.valeur).trim().toLowerCase()),
    updatedAt: row.updatedAt,
  };
};

// ── Max subjects per teacher ────────────────────────────────────
const MAX_SUBJECTS_KEY = "max_subjects_per_teacher";

export const getMaxSubjectsPerTeacher = async (): Promise<number> => {
  const row = await prisma.pfeConfig.findFirst({
    where: { nom_config: MAX_SUBJECTS_KEY },
    select: { valeur: true },
  });
  if (!row) return 3; // default
  const parsed = Number(row.valeur);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3;
};

export const setMaxSubjectsPerTeacher = async (
  value: number,
  byUserId?: number | null
): Promise<{ maxSubjectsPerTeacher: number; updatedAt: Date }> => {
  const annee = await resolveAnneeLabel();
  const sanitized = Math.max(1, Math.min(20, Math.round(value)));
  const row = await prisma.pfeConfig.upsert({
    where: { nom_config: MAX_SUBJECTS_KEY },
    create: {
      nom_config: MAX_SUBJECTS_KEY,
      valeur: String(sanitized),
      anneeUniversitaire: annee,
      createdBy: byUserId ?? null,
      description_en: "Maximum number of PFE subjects a teacher may propose per year",
    },
    update: { valeur: String(sanitized) },
    select: { valeur: true, updatedAt: true },
  });
  return { maxSubjectsPerTeacher: Number(row.valeur), updatedAt: row.updatedAt };
};

// ── Allow student selection ─────────────────────────────────────
const ALLOW_STUDENT_SELECTION_KEY = "allow_student_selection";

export const isStudentSelectionAllowed = async (): Promise<boolean> => {
  const row = await prisma.pfeConfig.findFirst({
    where: { nom_config: ALLOW_STUDENT_SELECTION_KEY },
    select: { valeur: true },
  });
  if (!row) return false; // default: disabled
  return parseBoolean(row.valeur);
};

export const setStudentSelectionAllowed = async (
  allowed: boolean,
  byUserId?: number | null
): Promise<{ allowStudentSelection: boolean; updatedAt: Date }> => {
  const annee = await resolveAnneeLabel();
  const value = allowed ? "true" : "false";
  const row = await prisma.pfeConfig.upsert({
    where: { nom_config: ALLOW_STUDENT_SELECTION_KEY },
    create: {
      nom_config: ALLOW_STUDENT_SELECTION_KEY,
      valeur: value,
      anneeUniversitaire: annee,
      createdBy: byUserId ?? null,
      description_en: "Whether students may choose/select PFE subjects",
    },
    update: { valeur: value },
    select: { valeur: true, updatedAt: true },
  });
  return {
    allowStudentSelection: parseBoolean(row.valeur),
    updatedAt: row.updatedAt,
  };
};

// ── Jury enabled ────────────────────────────────────────────────
const JURY_ENABLED_KEY = "jury_enabled";

export const isJuryEnabled = async (): Promise<boolean> => {
  const row = await prisma.pfeConfig.findFirst({
    where: { nom_config: JURY_ENABLED_KEY },
    select: { valeur: true },
  });
  if (!row) return true; // default: enabled
  return parseBoolean(row.valeur);
};

export const setJuryEnabled = async (
  enabled: boolean,
  byUserId?: number | null
): Promise<{ juryEnabled: boolean; updatedAt: Date }> => {
  const annee = await resolveAnneeLabel();
  const value = enabled ? "true" : "false";
  const row = await prisma.pfeConfig.upsert({
    where: { nom_config: JURY_ENABLED_KEY },
    create: {
      nom_config: JURY_ENABLED_KEY,
      valeur: value,
      anneeUniversitaire: annee,
      createdBy: byUserId ?? null,
      description_en: "Whether the jury system is active",
    },
    update: { valeur: value },
    select: { valeur: true, updatedAt: true },
  });
  return { juryEnabled: parseBoolean(row.valeur), updatedAt: row.updatedAt };
};

/**
 * Bundle read for the admin "PFE config" UI — returns every toggle the UI
 * needs in one round-trip. New flags should be added here so the frontend
 * doesn't have to learn about extra endpoints.
 */
export const getPfeConfigSnapshot = async () => {
  const [
    submissionOpen,
    studentVisibilityOpen,
    maxSubjectsPerTeacher,
    allowStudentSelection,
    juryEnabled,
  ] = await Promise.all([
    isSubmissionOpen(),
    isStudentVisibilityOpen(),
    getMaxSubjectsPerTeacher(),
    isStudentSelectionAllowed(),
    isJuryEnabled(),
  ]);
  return {
    submissionOpen,
    studentVisibilityOpen,
    maxSubjectsPerTeacher,
    allowStudentSelection,
    juryEnabled,
  };
};
