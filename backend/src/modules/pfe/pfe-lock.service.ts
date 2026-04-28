/**
 * PFE assignment-lock service — single source of truth for the PFE locking
 * lifecycle. Consumed by both TypeScript callers and the legacy JS PFE
 * controllers (via `require`).
 *
 * Lifecycle:
 *     draft  →  assigned  →  finalized   (one-way; finalized is terminal)
 *
 * Locking rule: once `assignmentStatus === 'finalized'`, the student cannot
 * change their topic, leave their group, or modify their assignment in any
 * way. The guards in this file are the enforcement point — do not replicate
 * the status check elsewhere.
 *
 * Implementation note: reads/writes go through `$queryRaw` / `$executeRaw`
 * so this file does not depend on the Prisma client being regenerated after
 * the schema change. Once `npx prisma generate` succeeds (close any dev
 * server holding the engine DLL first on Windows), the raw queries continue
 * to work unchanged.
 */

import prisma from "../../config/database";
import logger from "../../utils/logger";
import { createAlert } from "../alerts/alert.service";

export const PFE_STATUS = {
  DRAFT: "draft",
  ASSIGNED: "assigned",
  FINALIZED: "finalized",
} as const;

export type PfeAssignmentStatus =
  | typeof PFE_STATUS.DRAFT
  | typeof PFE_STATUS.ASSIGNED
  | typeof PFE_STATUS.FINALIZED;

/** Thrown when a mutation is attempted on a finalized (locked) PFE. */
export class PfeFinalizedError extends Error {
  public readonly code = "PFE_FINALIZED" as const;
  public readonly status = 423; // 423 Locked
  constructor() {
    super("Your PFE is finalized and cannot be modified");
    this.name = "PfeFinalizedError";
  }
}

const normalizeStatus = (value: unknown): PfeAssignmentStatus => {
  const str = String(value || "").toLowerCase();
  if (str === PFE_STATUS.ASSIGNED) return PFE_STATUS.ASSIGNED;
  if (str === PFE_STATUS.FINALIZED) return PFE_STATUS.FINALIZED;
  return PFE_STATUS.DRAFT;
};

// ── Reads ───────────────────────────────────────────────────────────
export const getSubjectAssignmentStatus = async (
  sujetId: number
): Promise<PfeAssignmentStatus | null> => {
  const rows = await prisma.$queryRaw<Array<{ status: string | null }>>`
    SELECT assignment_status AS "status"
      FROM pfe_sujets
     WHERE id = ${sujetId}
     LIMIT 1
  `;
  if (!rows.length) return null;
  return normalizeStatus(rows[0].status);
};

/**
 * Resolve the PFE assignment status a student is currently bound to, if any.
 * A student is bound via GroupMember → GroupPfe → PfeSujet.sujetFinalId.
 */
export const getStudentSubjectAssignmentStatus = async (
  etudiantId: number
): Promise<PfeAssignmentStatus | null> => {
  const rows = await prisma.$queryRaw<Array<{ status: string | null }>>`
    SELECT ps.assignment_status AS "status"
      FROM group_members gm
      JOIN groups_pfe gp ON gp.id = gm.group_id
      JOIN pfe_sujets  ps ON ps.id = gp.sujet_final_id
     WHERE gm.etudiant_id = ${etudiantId}
     LIMIT 1
  `;
  if (!rows.length) return null;
  return normalizeStatus(rows[0].status);
};

/**
 * Resolve the assignment status for the subject a given GroupPfe is working
 * on. Returns null if the group or its subject cannot be resolved.
 */
export const getGroupAssignmentStatus = async (
  groupId: number
): Promise<PfeAssignmentStatus | null> => {
  const rows = await prisma.$queryRaw<Array<{ status: string | null }>>`
    SELECT ps.assignment_status AS "status"
      FROM groups_pfe gp
      JOIN pfe_sujets ps ON ps.id = gp.sujet_final_id
     WHERE gp.id = ${groupId}
     LIMIT 1
  `;
  if (!rows.length) return null;
  return normalizeStatus(rows[0].status);
};

// ── Guards ──────────────────────────────────────────────────────────
export const assertPfeNotFinalized = async (sujetId: number): Promise<void> => {
  const status = await getSubjectAssignmentStatus(sujetId);
  if (status === PFE_STATUS.FINALIZED) {
    throw new PfeFinalizedError();
  }
};

export const assertGroupNotFinalized = async (groupId: number): Promise<void> => {
  const status = await getGroupAssignmentStatus(groupId);
  if (status === PFE_STATUS.FINALIZED) {
    throw new PfeFinalizedError();
  }
};

export const assertStudentPfeNotFinalized = async (
  etudiantId: number
): Promise<void> => {
  const status = await getStudentSubjectAssignmentStatus(etudiantId);
  if (status === PFE_STATUS.FINALIZED) {
    throw new PfeFinalizedError();
  }
};

/**
 * Resolve the subjectId a student's group is working on, if any.
 * Useful when the caller only has the etudiantId and needs the sujetId
 * to check / transition the lock.
 */
export const getStudentSubjectId = async (
  etudiantId: number
): Promise<number | null> => {
  const rows = await prisma.$queryRaw<Array<{ sujetId: number }>>`
    SELECT gp.sujet_final_id AS "sujetId"
      FROM group_members gm
      JOIN groups_pfe gp ON gp.id = gm.group_id
     WHERE gm.etudiant_id = ${etudiantId}
     LIMIT 1
  `;
  return rows.length ? rows[0].sujetId : null;
};

// ── Transitions ─────────────────────────────────────────────────────
export const markPfeAssigned = async (sujetId: number): Promise<void> => {
  // Only promote from 'draft'. Do not regress from 'finalized'.
  await prisma.$executeRawUnsafe(
    `UPDATE pfe_sujets
        SET assignment_status = 'assigned',
            updated_at        = now()
      WHERE id = $1
        AND assignment_status = 'draft'`,
    sujetId
  );
};

/**
 * Finalize a PFE subject and notify every student bound to it.
 * Idempotent: a second call is a no-op (WHERE filter prevents duplicate
 * alerts). Alert delivery is best-effort — failures are logged but never
 * roll back the status transition.
 */
export const finalizePfe = async (
  sujetId: number,
  options: { actorUserId?: number } = {}
): Promise<{ finalized: boolean }> => {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE pfe_sujets
        SET assignment_status = 'finalized',
            finalized_at      = now(),
            updated_at        = now()
      WHERE id = $1
        AND assignment_status <> 'finalized'`,
    sujetId
  );

  const rowsChanged = typeof result === "number" ? result : 0;
  if (rowsChanged === 0) {
    return { finalized: false };
  }

  // Lookup subject title + bound students for the notification.
  const subjectRows = await prisma.$queryRaw<
    Array<{ titre: string | null }>
  >`
    SELECT COALESCE(titre_en, titre_ar) AS "titre"
      FROM pfe_sujets
     WHERE id = ${sujetId}
     LIMIT 1
  `;

  const studentRows = await prisma.$queryRaw<Array<{ userId: number }>>`
    SELECT e.user_id AS "userId"
      FROM group_members gm
      JOIN groups_pfe gp  ON gp.id  = gm.group_id
      JOIN etudiants  e   ON e.id   = gm.etudiant_id
     WHERE gp.sujet_final_id = ${sujetId}
  `;

  const subjectTitle = subjectRows[0]?.titre || "Your PFE";
  const message = "Your PFE assignment has been finalized";

  for (const row of studentRows) {
    try {
      await createAlert({
        userId: row.userId,
        type: "DECISION",
        title: "PFE finalized",
        message: `${message} (${subjectTitle}).`,
        relatedId: sujetId,
      });
    } catch (error) {
      logger.warn(
        `notifyPfeFinalized: failed to deliver alert for user ${row.userId}`,
        { error }
      );
    }
  }

  if (options.actorUserId) {
    logger.info(`PFE ${sujetId} finalized by user ${options.actorUserId}`);
  }

  return { finalized: true };
};
