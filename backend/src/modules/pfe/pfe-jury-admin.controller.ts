import type { Response } from "express";
import { Prisma, RoleJury } from "@prisma/client";
import prisma from "../../config/database";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { emitJuryComposedAlerts } from "./pfe-alerts.service";

/**
 * Admin "compose full jury" endpoint — creates the entire jury for a group
 * in one transaction:
 *   - exactly one president (required)
 *   - zero or more additional members (examinateur or rapporteur)
 *   - optional soutenance date / time / room set on the GroupPfe row
 *
 * The endpoint REPLACES any existing jury for the group (so it's safe to
 * call repeatedly while the admin tweaks the composition). Members are
 * deduplicated by enseignantId. After the transaction commits, alerts are
 * fanned out to students + jury teachers.
 */

type IncomingMember = {
  enseignantId?: number | string;
  role?: string;
};

type IncomingPayload = {
  presidentId?: number | string;
  members?: IncomingMember[];
  date?: string | null;
  time?: string | null;
  dateTime?: string | null;
  room?: string | null;
  salle?: string | null;
};

const ALLOWED_ROLES: RoleJury[] = ["president", "examinateur", "rapporteur"];

const toPositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeRole = (value: unknown, fallback: RoleJury): RoleJury => {
  const normalized = String(value || "").trim().toLowerCase();
  if (ALLOWED_ROLES.includes(normalized as RoleJury)) {
    return normalized as RoleJury;
  }
  return fallback;
};

const composeDateTime = (
  date: string | null | undefined,
  time: string | null | undefined,
  combined: string | null | undefined
): Date | null => {
  if (combined && typeof combined === "string") {
    const parsed = new Date(combined);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (date && typeof date === "string") {
    const slot = time && typeof time === "string" ? time : "00:00";
    const parsed = new Date(`${date}T${slot}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

export const composeJuryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = toPositiveInt(req.params.groupId);
    if (!groupId) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_GROUP_ID", message: "groupId must be a positive integer" },
      });
      return;
    }

    const body = (req.body || {}) as IncomingPayload;
    const presidentId = toPositiveInt(body.presidentId);
    if (!presidentId) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_PRESIDENT", message: "presidentId is required" },
      });
      return;
    }

    const rawMembers: IncomingMember[] = Array.isArray(body.members) ? body.members : [];
    // Deduplicate by enseignantId so the admin can't assign the same teacher
    // twice. The president slot is always processed first; if the same id
    // shows up again as a member it's silently dropped.
    const memberMap = new Map<number, RoleJury>();
    memberMap.set(presidentId, "president");
    for (const m of rawMembers) {
      const id = toPositiveInt(m.enseignantId);
      if (!id || memberMap.has(id)) continue;
      memberMap.set(id, normalizeRole(m.role, "examinateur"));
    }

    const enseignantIds = [...memberMap.keys()];
    const found = await prisma.enseignant.findMany({
      where: { id: { in: enseignantIds } },
      select: { id: true },
    });
    if (found.length !== enseignantIds.length) {
      const foundSet = new Set(found.map((e) => e.id));
      const missing = enseignantIds.filter((id) => !foundSet.has(id));
      res.status(404).json({
        success: false,
        error: {
          code: "TEACHER_NOT_FOUND",
          message: `Unknown enseignantId(s): ${missing.join(", ")}`,
        },
      });
      return;
    }

    const group = await prisma.groupPfe.findUnique({
      where: { id: groupId },
      select: { id: true },
    });
    if (!group) {
      res.status(404).json({
        success: false,
        error: { code: "GROUP_NOT_FOUND", message: `Group ${groupId} not found` },
      });
      return;
    }

    console.log('[DEBUG] ComposeJury Request Body:', JSON.stringify(body, null, 2));

    const dateSoutenance = composeDateTime(body.date, body.time, body.dateTime);
    console.log('[DEBUG] Parsed dateSoutenance:', dateSoutenance);

    const salleSoutenance = (() => {
      const raw = body.room ?? body.salle;
      if (typeof raw !== "string") return undefined;
      const trimmed = raw.trim();
      return trimmed.length ? trimmed : undefined;
    })();
    console.log('[DEBUG] Parsed salleSoutenance:', salleSoutenance);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.pfeJury.deleteMany({ where: { groupId } });
      await tx.pfeJury.createMany({
        data: enseignantIds.map((id) => ({
          groupId,
          enseignantId: id,
          role: memberMap.get(id)!,
        })),
      });

      const groupUpdate: Prisma.GroupPfeUpdateInput = {};
      if (dateSoutenance) groupUpdate.dateSoutenance = dateSoutenance;
      if (salleSoutenance !== undefined) groupUpdate.salleSoutenance = salleSoutenance;
      if (Object.keys(groupUpdate).length > 0) {
        await tx.groupPfe.update({ where: { id: groupId }, data: groupUpdate });
      }
    });

    // Alert fan-out happens after commit so a transient alert failure
    // can't unwind the jury composition.
    await emitJuryComposedAlerts(groupId);

    const refreshed = await prisma.groupPfe.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        dateSoutenance: true,
        salleSoutenance: true,
        pfeJury: {
          select: {
            id: true,
            role: true,
            enseignant: {
              select: {
                id: true,
                user: {
                  select: { id: true, nom: true, prenom: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    res.status(200).json({ success: true, data: refreshed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({
      success: false,
      error: { code: "JURY_COMPOSE_FAILED", message },
    });
  }
};
