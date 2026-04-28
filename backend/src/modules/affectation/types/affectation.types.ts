import type {
  CampagneAffectation,
  CampagneSpecialite,
  NiveauCible,
  NiveauSource,
  StatusCampagne,
  Voeu,
} from "@prisma/client";

export interface CreateCampaignInput {
  nom_ar: string;
  nom_en?: string | null;
  anneeUniversitaire: string;
  dateDebut: Date;
  dateFin: Date;
  niveauSource: NiveauSource;
  niveauCible: NiveauCible;
  specialites?: Array<{ specialiteId: number; quota?: number | null }>;
}

export interface UpdateCampaignInput {
  nom_ar?: string;
  nom_en?: string | null;
  anneeUniversitaire?: string;
  dateDebut?: Date;
  dateFin?: Date;
  niveauSource?: NiveauSource;
  niveauCible?: NiveauCible;
  status?: StatusCampagne;
}

export interface LinkSpecialiteInput {
  campagneId: number;
  specialiteId: number;
  quota?: number | null;
}

export interface UpdateSpecialiteQuotaInput {
  quota: number | null;
}

export interface SubmitVoeuxInput {
  etudiantId: number;
  campagneId: number;
  choices: Array<{ specialiteId: number; ordre: number }>;
}

export type CampaignWithSpecialites = CampagneAffectation & {
  campagneSpecialites: (CampagneSpecialite & {
    specialite: {
      id: number;
      nom_ar: string;
      nom_en: string | null;
    };
  })[];
};

export interface AffectationRunResult {
  campagneId: number;
  totalStudents: number;
  totalAffected: number;
  unaffectedStudents: number;
  perSpecialite: Array<{
    specialiteId: number;
    quota: number;
    placesOccupees: number;
  }>;
  completedAt: Date;
}

export interface VoeuWithRelations extends Voeu {
  specialite?: { id: number; nom_ar: string; nom_en: string | null } | null;
  campagne?: { id: number; nom_ar: string; status: StatusCampagne } | null;
}
