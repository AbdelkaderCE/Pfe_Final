import { StatusJustification, StatusReclamation, StatusSujet } from "@prisma/client";

export type LockableEntity = "reclamation" | "justification" | "pfe_subject";

/**
 * Terminal status sets.
 * Once a record reaches any status in this set, it is FINAL and must never
 * be mutated by approve/reject/validate/refuse actions again.
 *
 * The active workflow may still move through intermediate states
 * (e.g. reclamation: soumise → en_cours → traitee) — only the terminal
 * states are locked.
 */
export const TERMINAL_STATUSES: {
  reclamation: ReadonlyArray<StatusReclamation>;
  justification: ReadonlyArray<StatusJustification>;
  pfe_subject: ReadonlyArray<StatusSujet>;
} = {
  reclamation: [StatusReclamation.traitee, StatusReclamation.refusee],
  justification: [StatusJustification.valide, StatusJustification.refuse],
  pfe_subject: [
    StatusSujet.valide,
    StatusSujet.reserve,
    StatusSujet.affecte,
    StatusSujet.termine,
  ],
};

/**
 * The initial "pending" status — kept for reference / seeding.
 * Prefer TERMINAL_STATUSES for lock checks.
 */
export const PENDING_STATUS: {
  reclamation: StatusReclamation;
  justification: StatusJustification;
  pfe_subject: StatusSujet;
} = {
  reclamation: StatusReclamation.soumise,
  justification: StatusJustification.soumis,
  pfe_subject: StatusSujet.propose,
};

export class StatusLockError extends Error {
  readonly status = 409;
  readonly code = "ALREADY_PROCESSED";
  readonly entity: LockableEntity;
  readonly currentStatus: string | null;

  constructor(entity: LockableEntity, currentStatus: string | null) {
    super(
      `${entity} has already been processed${
        currentStatus ? ` (current status: ${currentStatus})` : ""
      }. Decision is final and cannot be changed.`
    );
    this.entity = entity;
    this.currentStatus = currentStatus;
  }
}

export class EntityNotFoundError extends Error {
  readonly status = 404;
  readonly code = "NOT_FOUND";
  readonly entity: LockableEntity;

  constructor(entity: LockableEntity, id: number) {
    super(`${entity} ${id} not found`);
    this.entity = entity;
  }
}

export const isReclamationTerminal = (status: StatusReclamation): boolean =>
  TERMINAL_STATUSES.reclamation.includes(status);

export const isJustificationTerminal = (status: StatusJustification): boolean =>
  TERMINAL_STATUSES.justification.includes(status);

export const isPfeSubjectTerminal = (status: StatusSujet): boolean =>
  TERMINAL_STATUSES.pfe_subject.includes(status);
