// ═══════════════════════════════════════════════════════════════
// Discipline Module — Type Definitions
// Clean Architecture: Types layer
// ═══════════════════════════════════════════════════════════════

import type { Prisma } from "@prisma/client";

// ── Status / Enum value types ────────────────────────────────

export type StatusDossierValue = "signale" | "en_instruction" | "jugement" | "traite";
export type StatusConseilValue = "planifie" | "en_cours" | "termine";
export type RoleConseilValue = "president" | "rapporteur" | "membre";
export type GraviteInfractionValue = "faible" | "moyenne" | "grave" | "tres_grave";
export type NiveauSanctionValue = "avertissement" | "blame" | "suspension" | "exclusion";

// ── Auth context (derived from JWT, never from request body) ──

export interface CallerContext {
  userId: number;
  roles: string[];
  isAdmin: boolean;
  enseignantId: number | null;
}

// ── Access control metadata appended to responses ────────────

export interface ConseilAccessControl {
  isAdmin: boolean;
  isPresident: boolean;
  canMakeDecisions: boolean;
  isViewOnly: boolean;
  userRole: string | null;
}

export interface DossierAccessControl {
  canMakeDecisions: boolean;
  isViewOnly: boolean;
}

// ── Dossier DTOs ─────────────────────────────────────────────

export interface CreateDossierInput {
  etudiantId?: number;
  studentId?: number;
  studentIds?: number[];
  infractionId?: number;
  typeInfraction?: string;
  gravite?: string;
  descriptionSignal?: string;
  description?: string;
  reason?: string;
  titre?: string;
  dateSignal?: string;
}

export interface UpdateDossierInput {
  status?: StatusDossierValue;
  decisionId?: number | null;
  remarqueDecision?: string;
  dateDecision?: string | null;
  conseilId?: number | null;
  description?: string;
}

// ── Conseil DTOs ─────────────────────────────────────────────

export interface CreateConseilInput {
  dateReunion: string;
  heure?: string;
  lieu?: string;
  anneeUniversitaire: string;
  description_ar?: string;
  description_en?: string;
  dossierIds: number[];
  membres?: Array<{ enseignantId?: number } | number>;
  presidentId: number;
}

export interface UpdateConseilInput {
  dateReunion?: string;
  heure?: string;
  lieu?: string;
  anneeUniversitaire?: string;
  description?: string;
  status?: StatusConseilValue;
  presidentId?: number;
  membres?: Array<{ enseignantId?: number } | number>;
}

export interface FinaliserConseilInput {
  drafts?: Array<{
    caseId: number;
    decisionId?: number | string;
    decision?: string;
    sanctions?: string;
    dateDecision?: string;
  }>;
}

// ── Membre DTOs ──────────────────────────────────────────────

export interface AddMembreInput {
  conseilId?: number;
  enseignantId: number;
  role?: string;
}

// ── Infraction DTOs ──────────────────────────────────────────

export interface CreateInfractionInput {
  nom?: string;
  nom_ar?: string;
  nom_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  gravite: string;
}

export interface UpdateInfractionInput {
  nom?: string;
  nom_ar?: string;
  nom_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  gravite?: string;
}

// ── Decision DTOs ────────────────────────────────────────────

export interface CreateDecisionInput {
  nom?: string;
  nom_ar?: string;
  nom_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  niveauSanction?: string;
}

export interface UpdateDecisionInput {
  nom?: string;
  nom_ar?: string;
  nom_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  niveauSanction?: string;
}

export interface RecordDecisionInput {
  dossierId: number;
  decisionId: number;
  remarque?: string;
  dateDecision?: string;
}

// ── Standardised API response ────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message?: string;
  error?: { message: string };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Prisma transaction client alias ─────────────────────────

export type TxClient = Prisma.TransactionClient;
