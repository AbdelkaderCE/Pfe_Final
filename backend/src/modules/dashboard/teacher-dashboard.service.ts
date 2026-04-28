import { Prisma } from "@prisma/client";
import prisma from "../../config/database";

type TeacherProfileRow = {
  enseignantId: number;
  nom: string;
  prenom: string;
  email: string;
  photo: string | null;
  grade: string | null;
  bureau: string | null;
};

type EnseignementRow = {
  id: number;
  type: string | null;
  anneeUniversitaire: string | null;
  moduleNom: string | null;
  moduleCode: string | null;
  moduleSemestre: number | null;
  promoNom: string | null;
};

type PfeSujetRow = {
  id: number;
  titre: string;
  status: string;
  anneeUniversitaire: string;
  promoNom: string | null;
};

type CountRow = {
  count: bigint;
};

type DashboardStudentRow = {
  etudiantId: number;
  matricule: string | null;
  nom: string;
  prenom: string;
  volumeTd: number | null;
  volumeTp: number | null;
};

type StudentMembershipRow = {
  count: bigint;
};

type StudentNotesPayload = {
  etudiantId: number;
  enseignementId: number;
  note_exam: number | null;
  note_td: number | null;
  note_tp: number | null;
};

type StudentAttendancePayload = {
  etudiantId: number;
  enseignementId: number;
  date: string;
  present: boolean;
  justifie: boolean;
  unmark?: boolean;
};

type StudentExclusionPayload = {
  etudiantId: number;
  enseignementId: number;
  overridden: boolean;
};

type AttendanceEntry = {
  date: string;
  present: boolean;
  justifie: boolean;
};

const AUTO_EXCLUSION_THRESHOLD = 3;
const notesStore = new Map<string, { note_exam: number | null; note_td: number | null; note_tp: number | null }>();
const attendanceStore = new Map<string, AttendanceEntry[]>();
const exclusionOverrideStore = new Map<string, boolean>();

const studentStateKey = (enseignementId: number, etudiantId: number): string => `${enseignementId}:${etudiantId}`;

export type TeacherDashboardData = {
  profile: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photo: string | null;
    grade: string;
    bureau: string | null;
  };
  enseignements: Array<{
    id: number;
    type: string | null;
    annee_universitaire: string | null;
    module: { nom: string | null; code: string | null; semestre: number | null };
    promo: { nom: string | null };
  }>;
  pfeSujets: Array<{
    id: number;
    titre: string;
    status: string;
    annee_universitaire: string;
    promo: { nom: string | null };
  }>;
  copiesRemise: Array<{ id: number }>;
  documentRequests: Array<{ id: number }>;
  juryGroups: number;
};

const toNumber = (value: bigint): number => Number(value);

const ensureTeacherOwnsEnseignement = async (userId: number, enseignementId: number): Promise<void> => {
  const ownershipRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM enseignements en
    INNER JOIN enseignants e ON e.id = en.enseignant_id
    WHERE en.id = ${enseignementId}
      AND e.user_id = ${userId}
  `);

  const ownsEnseignement = ownershipRows.length ? toNumber(ownershipRows[0].count) > 0 : false;
  if (!ownsEnseignement) {
    throw new Error("Enseignement not found for this teacher");
  }
};

const ensureStudentBelongsToEnseignement = async (
  enseignementId: number,
  etudiantId: number
): Promise<void> => {
  const membershipRows = await prisma.$queryRaw<StudentMembershipRow[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM enseignements en
    INNER JOIN etudiants et ON et.promo_id = en.promo_id
    WHERE en.id = ${enseignementId}
      AND et.id = ${etudiantId}
  `);

  const isMember = membershipRows.length ? toNumber(membershipRows[0].count) > 0 : false;
  if (!isMember) {
    throw new Error("Student not found in this enseignement");
  }
};

export const getTeacherDashboardData = async (userId: number): Promise<TeacherDashboardData> => {
  const profileRows = await prisma.$queryRaw<TeacherProfileRow[]>(Prisma.sql`
    SELECT
      e.id AS "enseignantId",
      u.nom,
      u.prenom,
      u.email,
      u.photo,
      g.nom AS grade,
      e.bureau
    FROM enseignants e
    INNER JOIN users u ON u.id = e.user_id
    LEFT JOIN grades g ON g.id = e.grade_id
    WHERE e.user_id = ${userId}
    LIMIT 1
  `);

  if (!profileRows.length) {
    throw new Error("Teacher profile not found");
  }

  const profile = profileRows[0];

  const enseignements = await prisma.$queryRaw<EnseignementRow[]>(Prisma.sql`
    SELECT
      en.id,
      en.type::text AS type,
      en.annee_universitaire AS "anneeUniversitaire",
      m.nom AS "moduleNom",
      m.code AS "moduleCode",
      m.semestre AS "moduleSemestre",
      p.nom AS "promoNom"
    FROM enseignements en
    LEFT JOIN modules m ON m.id = en.module_id
    LEFT JOIN promos p ON p.id = en.promo_id
    WHERE en.enseignant_id = ${profile.enseignantId}
    ORDER BY en.annee_universitaire DESC NULLS LAST
    LIMIT 30
  `);

  const pfeSujets = await prisma.$queryRaw<PfeSujetRow[]>(Prisma.sql`
    SELECT
      s.id,
      s.titre,
      s.status::text AS status,
      s.annee_universitaire AS "anneeUniversitaire",
      p.nom AS "promoNom"
    FROM pfe_sujets s
    LEFT JOIN promos p ON p.id = s.promo_id
    WHERE s.enseignant_id = ${profile.enseignantId}
    ORDER BY s.created_at DESC
    LIMIT 20
  `);

  const copiesCountRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM copies_remise cr
    INNER JOIN enseignements en ON en.id = cr.enseignement_id
    WHERE en.enseignant_id = ${profile.enseignantId}
  `);

  const documentCountRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM document_requests dr
    WHERE dr.enseignant_id = ${profile.enseignantId}
  `);

  const juryCountRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM pfe_jury pj
    WHERE pj.enseignant_id = ${profile.enseignantId}
  `);

  const copiesCount = copiesCountRows.length ? toNumber(copiesCountRows[0].count) : 0;
  const documentCount = documentCountRows.length ? toNumber(documentCountRows[0].count) : 0;
  const juryCount = juryCountRows.length ? toNumber(juryCountRows[0].count) : 0;

  return {
    profile: {
      id: profile.enseignantId,
      nom: profile.nom,
      prenom: profile.prenom,
      email: profile.email,
      photo: profile.photo,
      grade: profile.grade || "N/A",
      bureau: profile.bureau,
    },
    enseignements: enseignements.map((en) => ({
      id: en.id,
      type: en.type,
      annee_universitaire: en.anneeUniversitaire,
      module: {
        nom: en.moduleNom || `Module #${en.id}`,
        code: en.moduleCode || "N/A",
        semestre: en.moduleSemestre,
      },
      promo: { nom: en.promoNom || "Promo non assignee" },
    })),
    pfeSujets: pfeSujets.map((s) => ({
      id: s.id,
      titre: s.titre,
      status: s.status,
      annee_universitaire: s.anneeUniversitaire,
      promo: { nom: s.promoNom },
    })),
    copiesRemise: Array.from({ length: copiesCount }, (_value, index) => ({ id: index + 1 })),
    documentRequests: Array.from({ length: documentCount }, (_value, index) => ({ id: index + 1 })),
    juryGroups: juryCount,
  };
};

export const getTeacherStudentsByEnseignement = async (userId: number, enseignementId: number) => {
  await ensureTeacherOwnsEnseignement(userId, enseignementId);

  const studentRows = await prisma.$queryRaw<DashboardStudentRow[]>(Prisma.sql`
    SELECT
      et.id AS "etudiantId",
      et.matricule,
      u.nom,
      u.prenom,
      m.volume_td AS "volumeTd",
      m.volume_tp AS "volumeTp"
    FROM enseignements en
    INNER JOIN etudiants et ON et.promo_id = en.promo_id
    INNER JOIN users u ON u.id = et.user_id
    LEFT JOIN modules m ON m.id = en.module_id
    WHERE en.id = ${enseignementId}
    ORDER BY u.nom ASC, u.prenom ASC
  `);

  return studentRows.map((row) => {
    const key = studentStateKey(enseignementId, row.etudiantId);
    const notes = notesStore.get(key) || { note_exam: null, note_td: null, note_tp: null };
    const history = attendanceStore.get(key) || [];

    const justified = history.filter((entry) => !entry.present && entry.justifie).length;
    const unjustified = history.filter((entry) => !entry.present && !entry.justifie).length;
    const total = justified + unjustified;

    const isAutomaticallyExcluded = unjustified >= AUTO_EXCLUSION_THRESHOLD;
    const isOverridden = exclusionOverrideStore.get(key) === true;

    let status = "Active";
    if (isAutomaticallyExcluded && !isOverridden) {
      status = "Excluded";
    } else if (isAutomaticallyExcluded && isOverridden) {
      status = "Active (Override)";
    }

    return {
      id: row.etudiantId,
      matricule: row.matricule,
      nom: row.nom,
      prenom: row.prenom,
      absences: {
        total,
        unjustified,
        justified,
        history,
      },
      notes,
      moduleMetrics: {
        hasTd: (row.volumeTd || 0) > 0,
        hasTp: (row.volumeTp || 0) > 0,
      },
      isAutomaticallyExcluded,
      isOverridden,
      status,
    };
  });
};

export const saveTeacherStudentNotes = async (userId: number, payload: StudentNotesPayload) => {
  await ensureTeacherOwnsEnseignement(userId, payload.enseignementId);
  await ensureStudentBelongsToEnseignement(payload.enseignementId, payload.etudiantId);

  const key = studentStateKey(payload.enseignementId, payload.etudiantId);
  notesStore.set(key, {
    note_exam: payload.note_exam,
    note_td: payload.note_td,
    note_tp: payload.note_tp,
  });

  return notesStore.get(key);
};

export const markTeacherStudentAttendance = async (userId: number, payload: StudentAttendancePayload) => {
  await ensureTeacherOwnsEnseignement(userId, payload.enseignementId);
  await ensureStudentBelongsToEnseignement(payload.enseignementId, payload.etudiantId);

  const key = studentStateKey(payload.enseignementId, payload.etudiantId);
  const existingHistory = attendanceStore.get(key) || [];
  const targetDate = new Date(payload.date).toISOString().split("T")[0];

  const withoutTargetDate = existingHistory.filter(
    (entry) => new Date(entry.date).toISOString().split("T")[0] !== targetDate
  );

  if (!payload.unmark) {
    withoutTargetDate.push({
      date: new Date(payload.date).toISOString(),
      present: payload.present,
      justifie: payload.justifie,
    });
  }

  attendanceStore.set(key, withoutTargetDate);
  return attendanceStore.get(key) || [];
};

export const setTeacherStudentExclusionOverride = async (
  userId: number,
  payload: StudentExclusionPayload
) => {
  await ensureTeacherOwnsEnseignement(userId, payload.enseignementId);
  await ensureStudentBelongsToEnseignement(payload.enseignementId, payload.etudiantId);

  const key = studentStateKey(payload.enseignementId, payload.etudiantId);
  if (payload.overridden) {
    exclusionOverrideStore.set(key, true);
  } else {
    exclusionOverrideStore.delete(key);
  }

  return exclusionOverrideStore.get(key) === true;
};
