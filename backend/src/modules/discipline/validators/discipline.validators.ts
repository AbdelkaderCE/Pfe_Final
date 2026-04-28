// ═══════════════════════════════════════════════════════════════
// Discipline Module — Validators
// Clean Architecture: Input validation and normalization
// ═══════════════════════════════════════════════════════════════

import type {
  GraviteInfractionValue,
  NiveauSanctionValue,
  RoleConseilValue,
} from "../types/discipline.types";

// ── Gravité normaliser ───────────────────────────────────────

const GRAVITE_MAP: Record<string, GraviteInfractionValue> = {
  faible: "faible",
  mineure: "faible",
  minor: "faible",
  moyenne: "moyenne",
  medium: "moyenne",
  grave: "grave",
  majeure: "grave",
  major: "grave",
  tres_grave: "tres_grave",
  très_grave: "tres_grave",
  severe: "tres_grave",
};

export const normalizeGravite = (value: unknown): GraviteInfractionValue | null => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return GRAVITE_MAP[normalized] ?? null;
};

// ── Niveau sanction normaliser ───────────────────────────────

const VALID_SANCTIONS: NiveauSanctionValue[] = [
  "avertissement",
  "blame",
  "suspension",
  "exclusion",
];

export const normalizeNiveauSanction = (
  value: unknown,
): NiveauSanctionValue | null => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  return VALID_SANCTIONS.includes(normalized as NiveauSanctionValue)
    ? (normalized as NiveauSanctionValue)
    : null;
};

// ── Role normaliser ──────────────────────────────────────────

const VALID_ROLES_CONSEIL: RoleConseilValue[] = ["president", "rapporteur", "membre"];

export const normalizeRoleConseil = (
  value: unknown,
): RoleConseilValue | null => {
  const normalized = String(value || "membre").toLowerCase();
  return VALID_ROLES_CONSEIL.includes(normalized as RoleConseilValue)
    ? (normalized as RoleConseilValue)
    : null;
};

// ── Generic helpers ──────────────────────────────────────────

export const normalizeRole = (role: string): string =>
  String(role || "").trim().toLowerCase();

export const isPositiveInt = (value: unknown): value is number =>
  Number.isInteger(Number(value)) && Number(value) > 0;

export const toPositiveIntOrNull = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const parseIntArray = (
  input: unknown,
): number[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0);
};

export const parseMemberIds = (
  input: unknown,
): number[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((m: { enseignantId?: unknown } | number) =>
      Number(typeof m === "object" && m !== null ? m.enseignantId : m),
    )
    .filter((id) => Number.isInteger(id) && id > 0);
};

export const trimOrNull = (value: unknown): string | null => {
  const s = String(value || "").trim();
  return s || null;
};

export const trimOrEmpty = (value: unknown): string =>
  String(value || "").trim();

// ── Council member count limits ──────────────────────────────
// Workflow requires: 1 president + 1 rapporteur (auto) + exactly 2 members.

export const MIN_ADDITIONAL_COUNCIL_MEMBERS = 2;
export const MAX_ADDITIONAL_COUNCIL_MEMBERS = 10;
