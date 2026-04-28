import {
  NiveauCible,
  NiveauSource,
  StatusCampagne,
} from "@prisma/client";

export class AffectationValidationError extends Error {
  public readonly details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "AffectationValidationError";
    this.details = details;
  }
}

export const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

export const parseNonNegativeInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
};

export const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const NON_EMPTY_STRING = (value: unknown, maxLen: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
};

const isNiveauSource = (value: unknown): value is NiveauSource =>
  typeof value === "string" &&
  (Object.values(NiveauSource) as string[]).includes(value);

const isNiveauCible = (value: unknown): value is NiveauCible =>
  typeof value === "string" &&
  (Object.values(NiveauCible) as string[]).includes(value);

const isStatusCampagne = (value: unknown): value is StatusCampagne =>
  typeof value === "string" &&
  (Object.values(StatusCampagne) as string[]).includes(value);

export const validateCreateCampaignBody = (body: any) => {
  const errors: string[] = [];

  const nom_ar = NON_EMPTY_STRING(body?.nom_ar ?? body?.nom, 150);
  if (!nom_ar) errors.push("nom_ar is required (max 150 chars)");

  const nom_en =
    body?.nom_en === undefined || body?.nom_en === null || body?.nom_en === ""
      ? null
      : NON_EMPTY_STRING(body.nom_en, 150);
  if (nom_en === null && body?.nom_en !== undefined && body?.nom_en !== null && body?.nom_en !== "") {
    errors.push("nom_en must be a non-empty string up to 150 chars");
  }

  const anneeUniversitaire = NON_EMPTY_STRING(body?.anneeUniversitaire, 20);
  if (!anneeUniversitaire) errors.push("anneeUniversitaire is required (e.g. 2025-2026)");

  const dateDebut = parseDate(body?.dateDebut);
  const dateFin = parseDate(body?.dateFin);
  if (!dateDebut) errors.push("dateDebut is required and must be a valid date");
  if (!dateFin) errors.push("dateFin is required and must be a valid date");
  if (dateDebut && dateFin && dateFin.getTime() < dateDebut.getTime()) {
    errors.push("dateFin must be after dateDebut");
  }

  const niveauSource = body?.niveauSource ?? "L3";
  const niveauCible = body?.niveauCible ?? "M1";
  if (!isNiveauSource(niveauSource)) errors.push("niveauSource must be one of L1,L2,L3,M1,M2");
  if (!isNiveauCible(niveauCible)) errors.push("niveauCible must be one of L2,L3,M1,M2,D1");

  let specialites: Array<{ specialiteId: number; quota?: number | null }> | undefined;
  if (body?.specialites !== undefined) {
    if (!Array.isArray(body.specialites)) {
      errors.push("specialites must be an array of { specialiteId, quota? }");
    } else {
      specialites = [];
      body.specialites.forEach((entry: any, idx: number) => {
        if (typeof entry === "number" || typeof entry === "string") {
          const sid = parsePositiveInt(entry);
          if (!sid) errors.push(`specialites[${idx}] must be a positive integer`);
          else specialites!.push({ specialiteId: sid });
          return;
        }
        const sid = parsePositiveInt(entry?.specialiteId);
        if (!sid) {
          errors.push(`specialites[${idx}].specialiteId must be a positive integer`);
          return;
        }
        let quota: number | null | undefined;
        if (entry?.quota !== undefined && entry?.quota !== null) {
          const q = parseNonNegativeInt(entry.quota);
          if (q === null) errors.push(`specialites[${idx}].quota must be a non-negative integer`);
          else quota = q;
        } else {
          quota = null;
        }
        specialites!.push({ specialiteId: sid, quota });
      });
    }
  }

  if (errors.length) throw new AffectationValidationError("Invalid campaign payload", errors);

  return {
    nom_ar: nom_ar!,
    nom_en: nom_en ?? null,
    anneeUniversitaire: anneeUniversitaire!,
    dateDebut: dateDebut!,
    dateFin: dateFin!,
    niveauSource: niveauSource as NiveauSource,
    niveauCible: niveauCible as NiveauCible,
    specialites,
  };
};

export const validateUpdateCampaignBody = (body: any) => {
  const errors: string[] = [];
  const patch: Record<string, unknown> = {};

  if (body?.nom_ar !== undefined) {
    const nom_ar = NON_EMPTY_STRING(body.nom_ar, 150);
    if (!nom_ar) errors.push("nom_ar must be a non-empty string");
    else patch.nom_ar = nom_ar;
  }
  if (body?.nom_en !== undefined) {
    if (body.nom_en === null || body.nom_en === "") patch.nom_en = null;
    else {
      const nom_en = NON_EMPTY_STRING(body.nom_en, 150);
      if (!nom_en) errors.push("nom_en must be a string up to 150 chars");
      else patch.nom_en = nom_en;
    }
  }
  if (body?.anneeUniversitaire !== undefined) {
    const annee = NON_EMPTY_STRING(body.anneeUniversitaire, 20);
    if (!annee) errors.push("anneeUniversitaire must be a non-empty string");
    else patch.anneeUniversitaire = annee;
  }
  if (body?.dateDebut !== undefined) {
    const dateDebut = parseDate(body.dateDebut);
    if (!dateDebut) errors.push("dateDebut must be a valid date");
    else patch.dateDebut = dateDebut;
  }
  if (body?.dateFin !== undefined) {
    const dateFin = parseDate(body.dateFin);
    if (!dateFin) errors.push("dateFin must be a valid date");
    else patch.dateFin = dateFin;
  }
  if (body?.niveauSource !== undefined) {
    if (!isNiveauSource(body.niveauSource)) errors.push("niveauSource is invalid");
    else patch.niveauSource = body.niveauSource;
  }
  if (body?.niveauCible !== undefined) {
    if (!isNiveauCible(body.niveauCible)) errors.push("niveauCible is invalid");
    else patch.niveauCible = body.niveauCible;
  }
  if (body?.status !== undefined) {
    if (!isStatusCampagne(body.status)) errors.push("status is invalid");
    else patch.status = body.status;
  }

  if (errors.length) throw new AffectationValidationError("Invalid update payload", errors);

  return patch as {
    nom_ar?: string;
    nom_en?: string | null;
    anneeUniversitaire?: string;
    dateDebut?: Date;
    dateFin?: Date;
    niveauSource?: NiveauSource;
    niveauCible?: NiveauCible;
    status?: StatusCampagne;
  };
};

export const validateLinkSpecialiteBody = (body: any, campagneIdParam?: unknown) => {
  const errors: string[] = [];
  const campagneId = parsePositiveInt(campagneIdParam ?? body?.campagneId);
  const specialiteId = parsePositiveInt(body?.specialiteId);
  let quota: number | null = null;

  if (!campagneId) errors.push("campagneId must be a positive integer");
  if (!specialiteId) errors.push("specialiteId must be a positive integer");
  if (body?.quota !== undefined && body?.quota !== null) {
    const q = parseNonNegativeInt(body.quota);
    if (q === null) errors.push("quota must be a non-negative integer");
    else quota = q;
  }

  if (errors.length) throw new AffectationValidationError("Invalid link payload", errors);
  return { campagneId: campagneId!, specialiteId: specialiteId!, quota };
};

export const validateUpdateQuotaBody = (body: any) => {
  const errors: string[] = [];
  let quota: number | null = null;
  if (body?.quota === null || body?.quota === undefined) quota = null;
  else {
    const q = parseNonNegativeInt(body.quota);
    if (q === null) errors.push("quota must be a non-negative integer or null");
    else quota = q;
  }
  if (errors.length) throw new AffectationValidationError("Invalid quota payload", errors);
  return { quota };
};

export const validateSubmitVoeuxBody = (body: any) => {
  const errors: string[] = [];
  const campagneId = parsePositiveInt(body?.campagneId);
  if (!campagneId) errors.push("campagneId must be a positive integer");

  const rawChoices = body?.choices ?? body?.voeux;
  if (!Array.isArray(rawChoices) || rawChoices.length === 0) {
    errors.push("choices must be a non-empty array of { specialiteId, ordre }");
  }

  const choices: Array<{ specialiteId: number; ordre: number }> = [];
  const seenSpecs = new Set<number>();
  const seenOrdres = new Set<number>();

  if (Array.isArray(rawChoices)) {
    rawChoices.forEach((entry: any, idx: number) => {
      const sid = parsePositiveInt(entry?.specialiteId);
      const ordre = parsePositiveInt(entry?.ordre);
      if (!sid) errors.push(`choices[${idx}].specialiteId must be a positive integer`);
      if (!ordre) errors.push(`choices[${idx}].ordre must be a positive integer`);
      if (sid && seenSpecs.has(sid)) errors.push(`choices[${idx}].specialiteId is duplicated`);
      if (ordre && seenOrdres.has(ordre)) errors.push(`choices[${idx}].ordre is duplicated`);
      if (sid && ordre) {
        seenSpecs.add(sid);
        seenOrdres.add(ordre);
        choices.push({ specialiteId: sid, ordre });
      }
    });
  }

  if (errors.length) throw new AffectationValidationError("Invalid voeux payload", errors);
  choices.sort((a, b) => a.ordre - b.ordre);
  return { campagneId: campagneId!, choices };
};
