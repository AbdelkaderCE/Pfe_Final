// Discipline Module — Service Layer (Part 1: Dossiers & Conseils)
import * as repo from "../repositories/discipline.repository";
import { normalizeGravite, normalizeRole, isPositiveInt, parseIntArray, parseMemberIds, MIN_ADDITIONAL_COUNCIL_MEMBERS, MAX_ADDITIONAL_COUNCIL_MEMBERS } from "../validators/discipline.validators";
import { createMeetingScheduledAlert, createDisciplinaryDecisionAlerts, listAdminUserIds } from "../../alerts/alerts.service";
import { createAlert } from "../../alerts/alert.service";
import type { CallerContext, CreateDossierInput, UpdateDossierInput, CreateConseilInput, UpdateConseilInput, FinaliserConseilInput, AddMembreInput, RecordDecisionInput } from "../types/discipline.types";
import logger from "../../../utils/logger";

const ADMIN_ROLE = "admin";

// ── Caller context builder ──────────────────────────────────
export const buildCallerContext = async (user: { id: number; roles: string[] }): Promise<CallerContext> => {
  const isAdmin = Array.isArray(user.roles) && user.roles.some((r) => normalizeRole(r) === ADMIN_ROLE);
  const ens = await repo.findEnseignantByUserId(user.id);
  return { userId: user.id, roles: user.roles, isAdmin, enseignantId: ens?.id ?? null };
};

// ── Transform helpers (adopted from old project) ────────────
const transformDecision = (decision: any) => {
  if (!decision) return null;
  return { id: decision.id, verdict: decision.nom_en || decision.nom_ar, details: decision.description_en || decision.description_ar, niveauSanction: decision.niveauSanction };
};
export const transformDossier = (dossier: any) => ({ ...dossier, decision: transformDecision(dossier.decision) });
export const transformDossiers = (dossiers: any[]) => dossiers.map(transformDossier);

// ── Resolve infraction by name or create ────────────────────
const resolveInfractionId = async (typeInfraction: string, gravite?: string): Promise<number> => {
  const existing = await repo.findInfractionByName(typeInfraction);
  if (existing) return existing.id;
  const g = normalizeGravite(gravite) || "moyenne";
  const created = await repo.createInfraction({ nom_ar: typeInfraction, nom_en: typeInfraction, gravite: g });
  return created.id;
};

// ═══════════════════ DOSSIER SERVICES ═══════════════════════

export const listDossiers = async (caller: CallerContext, query: Record<string, any>) => {
  const { status, conseilId, search, gravite, studentId } = query;
  const graviteFilter = normalizeGravite(gravite);
  const where: any = {
    ...(!caller.isAdmin && caller.enseignantId ? { enseignantSignalant: caller.enseignantId } : {}),
    ...(status && { status }),
    ...(conseilId && { conseilId: Number(conseilId) }),
    ...(graviteFilter && { infraction: { gravite: graviteFilter } }),
    ...(studentId && { etudiantId: Number(studentId) }),
    ...(search && { OR: [
      { etudiant: { user: { OR: [{ nom: { contains: search, mode: "insensitive" } }, { prenom: { contains: search, mode: "insensitive" } }] } } },
      { descriptionSignal_ar: { contains: search, mode: "insensitive" } },
      { descriptionSignal_en: { contains: search, mode: "insensitive" } },
    ] }),
  };
  const dossiers = await repo.findManyDossiers(where);
  return transformDossiers(dossiers);
};

export const getDossier = async (id: number, caller: CallerContext) => {
  const dossier: any = await repo.findDossierById(id);
  if (!dossier) return { error: "Dossier introuvable.", status: 404 };

  // Check student access
  if (!caller.isAdmin && !caller.enseignantId) {
    const etudiant = await repo.findEtudiantByUserId(caller.userId);
    if (etudiant && dossier.etudiantId === etudiant.id) return { data: transformDossier(dossier) };
    return { error: "Accès refusé à ce dossier.", status: 403 };
  }

  if (!caller.isAdmin && caller.enseignantId && dossier.enseignantSignalant !== caller.enseignantId) {
    if (dossier.conseilId && dossier.conseil?.membres) {
      const isMember = dossier.conseil.membres.some((m: any) => m.enseignantId === caller.enseignantId);
      if (!isMember) return { error: "Accès refusé à ce dossier.", status: 403 };
    } else {
      return { error: "Accès refusé à ce dossier.", status: 403 };
    }
  }

  // Build access control metadata
  let conseilAccessControl = null;
  if (dossier.conseil) {
    const userMember = dossier.conseil.membres?.find((m: any) => m.enseignantId === caller.enseignantId);
    const isPresident = userMember?.role === "president";
    conseilAccessControl = { isAdmin: caller.isAdmin, isPresident, canMakeDecisions: caller.isAdmin || isPresident, isViewOnly: !(caller.isAdmin || isPresident), userRole: userMember?.role || (caller.isAdmin ? "admin" : null) };
  }

  const responseData = transformDossier({ ...dossier, conseil: dossier.conseil ? { ...dossier.conseil, _accessControl: conseilAccessControl } : null });
  return { data: responseData };
};

export const createDossiers = async (input: CreateDossierInput, caller: CallerContext) => {
  const studentIdToUse = input.etudiantId || input.studentId;
  const studentIdsArray = Array.isArray(input.studentIds)
    ? parseIntArray(input.studentIds)
    : isPositiveInt(Number(studentIdToUse)) ? [Number(studentIdToUse)] : [];

  if (!studentIdsArray.length) return { error: "etudiantId ou studentId est obligatoire.", status: 400 };

  let infractionId = input.infractionId ? Number(input.infractionId) : null;
  if (!infractionId && input.typeInfraction) {
    infractionId = await resolveInfractionId(input.typeInfraction, input.gravite);
  }
  if (!infractionId) return { error: "infractionId ou typeInfraction est obligatoire.", status: 400 };

  const desc = input.descriptionSignal || input.description || input.reason || input.titre || "";

  const dossiers = await Promise.all(
    studentIdsArray.map((eid) =>
      repo.createDossier({
        etudiantId: eid,
        enseignantSignalant: caller.enseignantId,
        infractionId: infractionId!,
        descriptionSignal_ar: desc, descriptionSignal_en: desc,
        conseilId: null,
        dateSignal: input.dateSignal ? new Date(input.dateSignal) : new Date(),
        status: "signale",
      })
    )
  );

  // Alert: notify admins about new dossier
  try {
    const adminIds = await listAdminUserIds();
    for (const adminId of adminIds) {
      await createAlert({ userId: adminId, type: "REQUEST", title: "Nouveau dossier disciplinaire", message: `Un nouveau signalement a été créé (dossier #${dossiers[0]?.id}).` });
    }
  } catch (e) { logger.warn("Failed to send dossier creation alerts: " + String(e)); }

  const result = studentIdsArray.length === 1 ? transformDossier(dossiers[0]) : transformDossiers(dossiers);
  return { data: result };
};

export const updateDossierService = async (id: number, input: UpdateDossierInput, caller: CallerContext) => {
  if (input.status !== undefined && !caller.isAdmin) {
    return { error: "Seul un administrateur peut modifier le statut d'un dossier.", status: 403 };
  }
  const data: any = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.decisionId !== undefined) data.decisionId = input.decisionId ? Number(input.decisionId) : null;
  if (input.remarqueDecision !== undefined) { data.remarqueDecision_ar = input.remarqueDecision; data.remarqueDecision_en = input.remarqueDecision; }
  if (input.dateDecision !== undefined) data.dateDecision = input.dateDecision ? new Date(input.dateDecision) : null;
  if (input.conseilId !== undefined) data.conseilId = input.conseilId ? Number(input.conseilId) : null;
  if (input.description !== undefined) { data.descriptionSignal_ar = input.description; data.descriptionSignal_en = input.description; }

  const dossier = await repo.updateDossier(id, data);
  return { data: transformDossier(dossier) };
};

export const deleteDossierService = async (id: number, caller: CallerContext) => {
  const dossier = await repo.findDossierBasicById(id, { id: true, enseignantSignalant: true, status: true });
  if (!dossier) return { error: "Dossier introuvable.", status: 404 };
  if (!caller.isAdmin && caller.enseignantId !== dossier.enseignantSignalant) return { error: "Accès refusé à ce dossier.", status: 403 };
  if (dossier.status !== "signale") return { error: "Seuls les dossiers en état 'signale' peuvent être supprimés.", status: 409 };
  await repo.deleteDossier(id);
  return { message: "Dossier supprimé." };
};

// ═══════════════════ CONSEIL SERVICES ═══════════════════════

export const listConseils = async (caller: CallerContext, query: Record<string, any>) => {
  // Auto-update status to "en_cours" for meetings where date/time has passed
  await syncConseilStatuses();

  const { status, annee } = query;
  const where: any = {
    ...(!caller.isAdmin && caller.enseignantId ? { membres: { some: { enseignantId: caller.enseignantId } } } : {}),
    ...(status && { status }),
    ...(annee && { anneeUniversitaire: annee }),
  };
  const conseils = await repo.findManyConseils(where);
  return conseils.map((c: any) => ({ ...c, dossiers: transformDossiers(c.dossiers) }));
};

// Auto-update status to "en_cours" for meetings where date/time has passed
export const syncConseilStatuses = async () => {
  try {
    const conseilsToUpdate = await repo.findConseilsNeedingStatusUpdate();
    if (conseilsToUpdate.length > 0) {
      const ids = conseilsToUpdate.map((c) => c.id);
      await repo.updateManyConseilsStatus(ids, "en_cours");
      logger.info(`Updated ${ids.length} conseil(s) status to "en_cours"`);
    }
  } catch (error) {
    logger.error("Failed to sync conseil statuses:", error);
  }
};

export const getConseil = async (id: number, caller: CallerContext) => {
  const conseil: any = await repo.findConseilById(id);
  if (!conseil) return { error: "Conseil introuvable.", status: 404 };

  const isMember = caller.isAdmin || conseil.membres.some((m: any) => m.enseignantId === caller.enseignantId);
  if (!isMember) return { error: "Accès refusé à ce conseil.", status: 403 };

  const userMember = conseil.membres.find((m: any) => m.enseignantId === caller.enseignantId);
  const isPresident = userMember?.role === "president";
  const canMakeDecisions = caller.isAdmin || isPresident;

  const dossiersWithAccess = conseil.dossiers.map((d: any) => ({
    ...transformDossier(d),
    _accessControl: { canMakeDecisions, isViewOnly: !canMakeDecisions },
  }));

  return {
    data: {
      ...conseil, dossiers: dossiersWithAccess,
      _accessControl: { isAdmin: caller.isAdmin, isPresident, canMakeDecisions, isViewOnly: !canMakeDecisions && isMember, userRole: userMember?.role || (caller.isAdmin ? "admin" : null) },
    },
  };
};

export const createConseilService = async (input: CreateConseilInput, caller: CallerContext) => {
  if (!input.dateReunion || !input.anneeUniversitaire) return { error: "dateReunion et anneeUniversitaire sont obligatoires.", status: 400 };

  const dossierIdList = parseIntArray(input.dossierIds);
  if (!dossierIdList.length) return { error: "Au moins un dossier (dossierIds) est obligatoire.", status: 400 };

  const presidentId = Number(input.presidentId);
  if (!isPositiveInt(presidentId)) return { error: "presidentId est obligatoire.", status: 400 };

  const additionalMemberIds = parseMemberIds(input.membres || []);
  if (additionalMemberIds.length < MIN_ADDITIONAL_COUNCIL_MEMBERS || additionalMemberIds.length > MAX_ADDITIONAL_COUNCIL_MEMBERS) {
    return { error: `Le conseil doit contenir entre ${MIN_ADDITIONAL_COUNCIL_MEMBERS} et ${MAX_ADDITIONAL_COUNCIL_MEMBERS} membres supplémentaires.`, status: 400 };
  }

  const dossiers = await repo.findDossiersByIds(dossierIdList);
  if (dossiers.length !== dossierIdList.length) return { error: "Un ou plusieurs dossiers introuvables.", status: 404 };

  const ineligible = dossiers.find((d) => d.status !== "signale" || d.conseilId !== null);
  if (ineligible) return { error: `Dossier ${ineligible.id} n'est pas dans l'état 'signale' ou est déjà rattaché à un conseil.`, status: 409 };

  const reporters = [...new Set(dossiers.map((d) => d.enseignantSignalant).filter((id): id is number => Number.isInteger(id!) && id! > 0))];
  if (reporters.length !== 1) return { error: reporters.length === 0 ? "Aucun enseignant signalant trouvé." : "Tous les dossiers doivent partager le même enseignant signalant.", status: 409 };

  const rapporteurId = reporters[0];
  if (rapporteurId === presidentId) return { error: "Le signalant ne peut pas présider le conseil.", status: 409 };

  const memberSet = new Set(additionalMemberIds);
  if (memberSet.size !== additionalMemberIds.length) return { error: "Les membres supplémentaires doivent être distincts.", status: 409 };
  if (memberSet.has(presidentId) || memberSet.has(rapporteurId)) return { error: "Le président et le rapporteur ne peuvent pas être réutilisés comme membres.", status: 409 };

  const conseil = await repo.runTransaction(async (tx) => {
    const newConseil = await repo.createConseil({
      dateReunion: new Date(input.dateReunion),
      heure: input.heure ? new Date(`1970-01-01T${input.heure}:00`) : null,
      lieu: input.lieu, anneeUniversitaire: input.anneeUniversitaire,
      description_ar: input.description_ar || input.description_en, description_en: input.description_en || input.description_ar,
    }, tx);

    await repo.createManyMembres([
      { conseilId: newConseil.id, enseignantId: presidentId, role: "president" },
      { conseilId: newConseil.id, enseignantId: rapporteurId, role: "rapporteur" },
      ...additionalMemberIds.map((eid) => ({ conseilId: newConseil.id, enseignantId: eid, role: "membre" as const })),
    ], tx);

    await repo.updateManyDossiers({ id: { in: dossierIdList } }, { conseilId: newConseil.id, status: "en_instruction" }, tx);

    for (const did of dossierIdList) {
      await createMeetingScheduledAlert({ dossierId: did, adminUserId: caller.userId }, tx);
    }

    // Alert: notify members about new council
    const allMemberEnseignantIds = [presidentId, rapporteurId, ...additionalMemberIds];
    for (const ensId of allMemberEnseignantIds) {
      const ens = await tx.enseignant.findUnique({ where: { id: ensId }, select: { userId: true } });
      if (ens) {
        await createAlert({ userId: ens.userId, type: "MEETING", title: "Conseil disciplinaire créé", message: `Vous êtes membre d'un nouveau conseil disciplinaire prévu le ${input.dateReunion}.` }, tx);
      }
    }

    return repo.findConseilById(newConseil.id, tx);
  });

  return { data: conseil };
};

export const updateConseilService = async (id: number, input: UpdateConseilInput, _caller: CallerContext) => {
  const existing = await repo.findConseilBasicById(id);
  if (!existing) return { error: "Conseil introuvable.", status: 404 };
  if (existing.status === "termine") return { error: "Un conseil finalisé ne peut pas être modifié.", status: 409 };

  const reporters = [...new Set(existing.dossiers.map((d) => d.enseignantSignalant).filter((id): id is number => typeof id === "number" && id > 0))];
  if (reporters.length !== 1) return { error: reporters.length === 0 ? "Aucun enseignant signalant trouvé." : "Signalants multiples.", status: 409 };
  const rapporteurId = reporters[0];

  const currentPresident = existing.membres.find((m) => m.role === "president");
  const nextPresidentId = input.presidentId !== undefined ? Number(input.presidentId) : currentPresident?.enseignantId;
  if (!isPositiveInt(nextPresidentId)) return { error: "presidentId est obligatoire.", status: 400 };
  if (nextPresidentId === rapporteurId) return { error: "Le signalant ne peut pas présider le conseil.", status: 409 };

  const additionalMemberIds = Array.isArray(input.membres)
    ? parseMemberIds(input.membres)
    : existing.membres.filter((m) => m.role === "membre").map((m) => m.enseignantId);

  if (additionalMemberIds.length < MIN_ADDITIONAL_COUNCIL_MEMBERS || additionalMemberIds.length > MAX_ADDITIONAL_COUNCIL_MEMBERS) {
    return { error: `Le conseil doit contenir entre ${MIN_ADDITIONAL_COUNCIL_MEMBERS} et ${MAX_ADDITIONAL_COUNCIL_MEMBERS} membres supplémentaires.`, status: 400 };
  }

  const memberSet = new Set(additionalMemberIds);
  if (memberSet.size !== additionalMemberIds.length) return { error: "Les membres doivent être distincts.", status: 409 };
  if (memberSet.has(nextPresidentId!) || memberSet.has(rapporteurId)) return { error: "Le président et le rapporteur ne peuvent pas être réutilisés comme membres.", status: 409 };

  const shouldReplaceMembers = input.presidentId !== undefined || Array.isArray(input.membres);

  const conseil = await repo.runTransaction(async (tx) => {
    const data: any = {};
    if (input.dateReunion) data.dateReunion = new Date(input.dateReunion);
    if (input.heure) data.heure = new Date(`1970-01-01T${input.heure}:00`);
    if (input.lieu !== undefined) data.lieu = input.lieu;
    if (input.anneeUniversitaire) data.anneeUniversitaire = input.anneeUniversitaire;
    if (input.description !== undefined) { data.description_ar = input.description; data.description_en = input.description; }
    if (input.status) data.status = input.status;
    await repo.updateConseil(id, data, tx);

    if (shouldReplaceMembers) {
      await repo.deleteManyMembresByConseil(id, tx);
      await repo.createManyMembres([
        { conseilId: id, enseignantId: nextPresidentId!, role: "president" },
        { conseilId: id, enseignantId: rapporteurId, role: "rapporteur" },
        ...additionalMemberIds.map((eid) => ({ conseilId: id, enseignantId: eid, role: "membre" as const })),
      ], tx);
    }

    return repo.findConseilById(id, tx);
  });

  return { data: conseil };
};

export const deleteConseilService = async (id: number) => {
  const existing = await repo.findConseilBasicById(id);
  if (!existing) return { error: "Conseil introuvable.", status: 404 };
  if (existing.status === "termine") return { error: "Un conseil finalisé ne peut pas être supprimé.", status: 409 };

  await repo.runTransaction(async (tx) => {
    await repo.deleteMembresByConseilRaw(id, tx);
    await repo.updateManyDossiers({ conseilId: id, status: { in: ["en_instruction", "jugement"] } as any }, { conseilId: null, status: "signale" }, tx);
    await repo.updateManyDossiers({ conseilId: id, status: { notIn: ["en_instruction", "jugement"] } as any }, { conseilId: null }, tx);
    await repo.deleteConseil(id, tx);
  });

  return { message: "Conseil supprimé." };
};

export const finaliserConseilService = async (id: number, input: FinaliserConseilInput, caller: CallerContext) => {
  const ens = await repo.findEnseignantByUserId(caller.userId);
  if (!ens) return { error: "Profil enseignant introuvable.", status: 403 };

  const president = await repo.findPresidentByConseil(id);
  if (president?.enseignantId !== ens.id) return { error: "Seul le président du conseil peut finaliser.", status: 403 };

  await repo.runTransaction(async (tx) => {
    await repo.updateConseil(id, { status: "termine" }, tx);

    if (Array.isArray(input.drafts) && input.drafts.length > 0) {
      for (const d of input.drafts) {
        // Resolve decision: try existing catalog record first, then create ad-hoc
        let decisionRecord: any = null;

        if (d.decisionId) {
          decisionRecord = await repo.findDecisionById(Number(d.decisionId), tx);
        }

        if (!decisionRecord && d.decision) {
          decisionRecord = await tx.decision.findFirst({
            where: { OR: [{ nom_ar: d.decision }, { nom_en: d.decision }] },
          });
        }

        if (!decisionRecord && d.decision) {
          decisionRecord = await repo.createDecision(
            { nom_ar: d.decision, nom_en: d.decision, description_ar: d.sanctions, description_en: d.sanctions },
            tx,
          );
        }

        if (!decisionRecord) continue;

        await repo.updateDossier(d.caseId, {
          decisionId: decisionRecord.id,
          remarqueDecision_ar: d.sanctions || "",
          remarqueDecision_en: d.sanctions || "",
          dateDecision: d.dateDecision ? new Date(d.dateDecision) : new Date(),
          status: "traite",
        }, tx);

        await createDisciplinaryDecisionAlerts(d.caseId, tx);
      }
    }
  });

  return { message: "Conseil finalisé." };
};

// ═══════════════════ AVAILABLE MEMBERS ══════════════════════

export const getAvailableMembersService = async (conseilId: number, searchQuery: string) => {
  if (!isPositiveInt(conseilId)) return { error: "Conseil ID est obligatoire.", status: 400 };
  const members = await repo.findAvailableMembers(conseilId, searchQuery.trim().toLowerCase());
  const formatted = members.map((t: any) => ({
    id: t.id,
    name: [t.user.prenom, t.user.nom].filter(Boolean).join(" ").trim(),
    email: t.user.email,
    grade: t.grade?.nom_en || t.grade?.nom_ar || "Staff",
  }));
  return { data: formatted };
};

// ═══════════════════ MEMBRE SERVICES ════════════════════════

export const addMembreService = async (conseilIdFromPath: number | null, input: AddMembreInput) => {
  const conseilId = isPositiveInt(conseilIdFromPath) ? conseilIdFromPath! : Number(input.conseilId);
  const { enseignantId } = input;
  const normalizedRole = String(input.role || "membre").toLowerCase() as any;

  if (!conseilId || !enseignantId) return { error: "conseilId et enseignantId sont obligatoires.", status: 400 };
  if (!["president", "rapporteur", "membre"].includes(normalizedRole)) return { error: "role invalide.", status: 400 };

  const existing: any = await repo.findConseilBasicById(conseilId);
  if (!existing) return { error: "Conseil introuvable.", status: 404 };
  if (existing.status === "termine") return { error: "Un conseil finalisé ne peut pas être modifié.", status: 409 };

  const reporters = [...new Set(existing.dossiers.map((d: any) => d.enseignantSignalant).filter((id: any): id is number => typeof id === "number" && id > 0))];
  if (reporters.length !== 1) return { error: "Erreur enseignant signalant.", status: 409 };
  const rapporteurId: number = reporters[0] as number;

  if (normalizedRole === "rapporteur") return { error: "Le rapporteur est ajouté automatiquement.", status: 409 };
  if (enseignantId === rapporteurId) return { error: "Cet enseignant est le signalant (rapporteur automatique).", status: 409 };

  const hasRapporteur = existing.membres.some((m: any) => m.role === "rapporteur" && m.enseignantId === rapporteurId);
  const currentMembers = hasRapporteur ? existing.membres : [...existing.membres, { id: -1, enseignantId: rapporteurId, role: "rapporteur" }];

  if (currentMembers.some((m: any) => m.enseignantId === enseignantId)) return { error: "Cet enseignant est déjà membre.", status: 409 };
  if (normalizedRole === "president" && currentMembers.some((m: any) => m.role === "president")) return { error: "Ce conseil a déjà un président.", status: 409 };
  if (normalizedRole === "membre" && currentMembers.filter((m: any) => m.role === "membre").length >= MAX_ADDITIONAL_COUNCIL_MEMBERS) return { error: `Max ${MAX_ADDITIONAL_COUNCIL_MEMBERS} membres.`, status: 409 };

  const membre = await repo.runTransaction(async (tx) => {
    if (!hasRapporteur) await repo.createMembre({ conseilId, enseignantId: rapporteurId, role: "rapporteur" }, tx);
    return repo.createMembre({ conseilId, enseignantId, role: normalizedRole }, tx);
  });

  return { data: membre };
};

export const removeMembreService = async (memberId: number) => {
  if (!isPositiveInt(memberId)) return { error: "Membre ID est obligatoire.", status: 400 };
  await repo.deleteMembre(memberId);
  return { message: "Membre supprimé du conseil." };
};

// ═══════════════════ RECORD DECISION ════════════════════════

export const recordDecisionService = async (input: RecordDecisionInput, caller: CallerContext) => {
  if (!input.dossierId || !input.decisionId) return { error: "dossierId et decisionId sont obligatoires.", status: 400 };

  const target = await repo.findDossierBasicById(Number(input.dossierId), { conseilId: true });
  if (!(target as any)?.conseilId) return { error: "Le dossier n'est rattaché à aucun conseil.", status: 409 };

  const ens = await repo.findEnseignantByUserId(caller.userId);
  if (!ens) return { error: "Profil enseignant introuvable.", status: 403 };
  const president = await repo.findPresidentByConseil((target as any).conseilId);
  if (president?.enseignantId !== ens.id) return { error: "Seul le président peut enregistrer la décision.", status: 403 };

  const dossier = await repo.runTransaction(async (tx) => {
    const updated = await repo.updateDossier(Number(input.dossierId), {
      decisionId: Number(input.decisionId), remarqueDecision_ar: input.remarque, remarqueDecision_en: input.remarque,
      dateDecision: input.dateDecision ? new Date(input.dateDecision) : new Date(), status: "traite",
    }, tx);
    await createDisciplinaryDecisionAlerts(updated.id, tx);
    return updated;
  });

  return { data: transformDossier(dossier) };
};

// ═══════════════════ STUDENT SELF-ACCESS ════════════════════

export const getStudentOwnDossiers = async (userId: number) => {
  const etudiant = await repo.findEtudiantByUserId(userId);
  if (!etudiant) return { error: "Profil étudiant introuvable.", status: 404 };
  const dossiers = await repo.findStudentDossiers(etudiant.id);
  return { data: transformDossiers(dossiers) };
};

export const getStudentNotifications = async (userId: number) => {
  const etudiant = await repo.findEtudiantByUserId(userId);
  if (!etudiant) return { data: [] };

  const dossiers = await repo.findManyDossiers({ etudiantId: etudiant.id });
  const notifications: any[] = [];

  for (const dossier of dossiers) {
    const desc = (dossier as any).descriptionSignal_en || (dossier as any).descriptionSignal_ar || "";
    const infractionLabel = (dossier as any).infraction?.nom_en || (dossier as any).infraction?.nom_ar || "Misconduct";

    // Notification: case reported
    notifications.push({
      id: `notif-reported-${dossier.id}`,
      type: "info",
      title: "Case Reported",
      description: `A disciplinary case has been opened regarding: ${infractionLabel}. ${desc}`.trim(),
      date: (dossier as any).dateSignal || (dossier as any).createdAt,
      read: (dossier as any).status !== "signale",
    });

    // Notification: hearing scheduled (if conseil exists)
    if ((dossier as any).conseil) {
      const conseil = (dossier as any).conseil;
      notifications.push({
        id: `notif-hearing-${dossier.id}`,
        type: "hearing",
        title: "Hearing Scheduled",
        description: `A disciplinary council meeting has been scheduled for your case.`,
        date: conseil.dateReunion || (dossier as any).updatedAt,
        hearingDate: conseil.dateReunion,
        location: conseil.lieu || "TBD",
        read: ["traite", "jugement"].includes((dossier as any).status),
      });
    }

    // Notification: decision made
    if ((dossier as any).decision) {
      const decision = (dossier as any).decision;
      const verdict = decision.nom_en || decision.nom_ar || "Decision";
      const decisionDate = (dossier as any).dateDecision || (dossier as any).updatedAt;
      const appealDeadline = new Date(new Date(decisionDate).getTime() + 15 * 24 * 60 * 60 * 1000);

      notifications.push({
        id: `notif-decision-${dossier.id}`,
        type: "decision",
        title: "Decision Issued",
        description: `A decision has been issued for your case: ${verdict}.`,
        date: decisionDate,
        verdict,
        appealDeadline: appealDeadline.toISOString(),
        read: false,
      });
    }
  }

  // Sort by date descending
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { data: notifications };
};
