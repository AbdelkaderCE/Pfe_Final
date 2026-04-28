// Discipline Module — Catalog Services (Infractions, Decisions, Students, Stats)
import * as repo from "../repositories/discipline.repository";
import { normalizeGravite, normalizeNiveauSanction, isPositiveInt, trimOrNull } from "../validators/discipline.validators";
import type { CreateInfractionInput, UpdateInfractionInput, CreateDecisionInput, UpdateDecisionInput } from "../types/discipline.types";

// ═══════════════════ INFRACTION SERVICES ════════════════════

export const listInfractions = () => repo.findManyInfractions();

export const getInfraction = async (id: number) => {
  const infraction = await repo.findInfractionById(id);
  if (!infraction) return { error: "Infraction introuvable.", status: 404 };
  return { data: infraction };
};

export const createInfractionService = async (input: CreateInfractionInput) => {
  if (!input.nom && !input.nom_ar && !input.nom_en) return { error: "nom ou nom_ar/nom_en est obligatoire.", status: 400 };
  if (!input.gravite) return { error: "gravite est obligatoire.", status: 400 };

  const gravite = normalizeGravite(input.gravite);
  if (!gravite) return { error: "gravite invalide. Valeurs: faible, moyenne, grave, tres_grave.", status: 400 };

  const infraction = await repo.createInfraction({
    nom_ar: input.nom_ar || input.nom || "",
    nom_en: input.nom_en || input.nom || undefined,
    description_ar: input.description_ar || input.description || undefined,
    description_en: input.description_en || input.description || undefined,
    gravite,
  });
  return { data: infraction };
};

export const updateInfractionService = async (id: number, input: UpdateInfractionInput) => {
  if (!isPositiveInt(id)) return { error: "Identifiant invalide.", status: 400 };

  const payload: Record<string, any> = {};
  if (input.nom !== undefined || input.nom_ar !== undefined) {
    payload.nom_ar = String((input.nom_ar ?? input.nom) || "").trim();
    if (!payload.nom_ar) return { error: "nom_ar ne peut pas être vide.", status: 400 };
  }
  if (input.nom !== undefined || input.nom_en !== undefined) {
    payload.nom_en = String((input.nom_en ?? input.nom) || "").trim();
    if (!payload.nom_en) return { error: "nom_en ne peut pas être vide.", status: 400 };
  }
  if (input.description !== undefined || input.description_ar !== undefined) payload.description_ar = trimOrNull(input.description_ar ?? input.description);
  if (input.description !== undefined || input.description_en !== undefined) payload.description_en = trimOrNull(input.description_en ?? input.description);
  if (input.gravite !== undefined) {
    const g = normalizeGravite(input.gravite);
    if (!g) return { error: "gravite invalide.", status: 400 };
    payload.gravite = g;
  }

  const infraction = await repo.updateInfraction(id, payload);
  return { data: infraction };
};

export const deleteInfractionService = async (id: number) => {
  if (!isPositiveInt(id)) return { error: "Identifiant invalide.", status: 400 };
  try {
    await repo.deleteInfraction(id);
    return { message: "Infraction supprimée." };
  } catch (e: any) {
    if (e?.code === "P2003") return { error: "Impossible de supprimer: utilisée dans des dossiers.", status: 409 };
    throw e;
  }
};

// ═══════════════════ DECISION SERVICES ══════════════════════

export const listDecisions = () => repo.findManyDecisions();

export const getDecisionService = async (id: number) => {
  const decision = await repo.findDecisionById(id);
  if (!decision) return { error: "Décision introuvable.", status: 404 };
  return { data: decision };
};

export const createDecisionService = async (input: CreateDecisionInput) => {
  if (!input.nom && !input.nom_ar && !input.nom_en) return { error: "nom est obligatoire.", status: 400 };

  const resolvedAr = String((input.nom_ar ?? input.nom ?? input.nom_en ?? "")).trim();
  const resolvedEn = String((input.nom_en ?? input.nom ?? input.nom_ar ?? "")).trim();
  if (!resolvedAr || !resolvedEn) return { error: "nom_ar et nom_en ne peuvent pas être vides.", status: 400 };

  let niveauSanction = undefined;
  if (input.niveauSanction) {
    niveauSanction = normalizeNiveauSanction(input.niveauSanction);
    if (input.niveauSanction && !niveauSanction) return { error: "niveauSanction invalide.", status: 400 };
  }

  const decision = await repo.createDecision({
    nom_ar: resolvedAr, nom_en: resolvedEn,
    description_ar: input.description_ar || input.description || undefined,
    description_en: input.description_en || input.description || undefined,
    niveauSanction,
  });
  return { data: decision };
};

export const updateDecisionService = async (id: number, input: UpdateDecisionInput) => {
  if (!isPositiveInt(id)) return { error: "Identifiant invalide.", status: 400 };

  const payload: Record<string, any> = {};
  if (input.nom !== undefined || input.nom_ar !== undefined) {
    payload.nom_ar = String((input.nom_ar ?? input.nom) || "").trim();
    if (!payload.nom_ar) return { error: "nom_ar ne peut pas être vide.", status: 400 };
  }
  if (input.nom !== undefined || input.nom_en !== undefined) {
    payload.nom_en = String((input.nom_en ?? input.nom) || "").trim();
    if (!payload.nom_en) return { error: "nom_en ne peut pas être vide.", status: 400 };
  }
  if (input.description !== undefined || input.description_ar !== undefined) payload.description_ar = trimOrNull(input.description_ar ?? input.description);
  if (input.description !== undefined || input.description_en !== undefined) payload.description_en = trimOrNull(input.description_en ?? input.description);
  if (input.niveauSanction !== undefined) {
    const v = String(input.niveauSanction || "").trim().toLowerCase();
    if (!v) { payload.niveauSanction = null; }
    else {
      const ns = normalizeNiveauSanction(v);
      if (!ns) return { error: "niveauSanction invalide.", status: 400 };
      payload.niveauSanction = ns;
    }
  }

  const decision = await repo.updateDecision(id, payload);
  return { data: decision };
};

export const deleteDecisionService = async (id: number) => {
  if (!isPositiveInt(id)) return { error: "Identifiant invalide.", status: 400 };
  try {
    await repo.deleteDecisionById(id);
    return { message: "Décision supprimée." };
  } catch (e: any) {
    if (e?.code === "P2003") return { error: "Impossible de supprimer: utilisée dans des dossiers.", status: 409 };
    throw e;
  }
};

// ═══════════════════ STUDENT / STAFF / STATS ════════════════

export const listStudents = async (q: string, enseignantId?: number | null) => {
  const students = await repo.searchStudents(q, enseignantId ?? undefined);
  return students.map((s) => ({ id: s.id, matricule: s.matricule, fullName: `${s.user.prenom} ${s.user.nom}` }));
};

export const getStudentProfile = async (id: number) => {
  const profile = await repo.findStudentProfile(id);
  if (!profile) return { error: "Étudiant introuvable.", status: 404 };
  const dossiers = await repo.findStudentDossiers(id);
  return {
    data: {
      student: profile, dossiers,
      stats: { totalCases: dossiers.length, pendingCases: dossiers.filter((d) => d.status === "signale").length, completedCases: dossiers.filter((d) => d.status === "traite").length },
    },
  };
};

export const listStaff = async () => {
  const staff = await repo.findAllStaff();
  return staff.map((s) => ({
    id: s.id,
    name: [s.user?.prenom, s.user?.nom].filter(Boolean).join(" ").trim(),
    email: s.user?.email,
    grade: s.grade?.nom_en || s.grade?.nom_ar || "Staff",
  }));
};

export const searchStaff = async (q: string) => {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  const staff = await repo.searchStaffByQuery(query);
  return staff.map((s) => ({
    id: s.id,
    name: [s.user?.prenom, s.user?.nom].filter(Boolean).join(" ").trim(),
    email: s.user?.email,
    grade: s.grade?.nom_en || s.grade?.nom_ar || "Staff",
  }));
};

export const getStats = async () => {
  const [total, pending, completed, conseils, infractions, decisions, minor, major, severe] = await Promise.all([
    repo.countDossiers(),
    repo.countDossiers({ status: "signale" }),
    repo.countDossiers({ status: "traite" }),
    repo.countConseils(),
    repo.countInfractions(),
    repo.countDecisions(),
    repo.countDossiers({ infraction: { gravite: "faible" } }),
    repo.countDossiers({ infraction: { gravite: "moyenne" } }),
    repo.countDossiers({ infraction: { gravite: { in: ["grave", "tres_grave"] } } } as any),
  ]);
  return {
    dossiers: { total, pending, completed, byGravity: { minor, major, severe } },
    conseils,
    infractions,
    decisions,
  };
};
