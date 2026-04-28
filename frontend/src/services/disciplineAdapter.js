/*
  Discipline Adapter Layer
  ─────────────────────────────────────────────────────────────────
  Normalizes backend Prisma-shaped responses to the UI shape used
  by the discipline pages. All field fallbacks (FR/AR/EN) are
  resolved here so components stay free of field-hunting logic.

  Backend shape (from `/api/v1/disciplinary/*`):
    - DossierDisciplinaire: { id, status, etudiant{user,...}, infraction{nom_ar,nom_en,gravite},
        decision{nom_ar,nom_en,niveauSanction,description_*}, enseignantSignalantR,
        dateSignal, descriptionSignal_ar, descriptionSignal_en, remarqueDecision_*, dateDecision }
    - ConseilDisciplinaire: { id, dateReunion, heure, lieu, status, description_*,
        membres[{role,enseignantId,enseignant{user}}], dossiers[] }

  UI shape produced:
    - Case:    { id:"CASE-n", rawId, status:"pending"|"hearing"|"closed", studentName,
                 violationType, decision{verdict,details}, timeline[], ... }
    - Meeting: { id:"MEET-n", conseilId, status:"scheduled"|"finalized", memberEntries,
                 participants, presidentEnseignantId, caseIds, decision, ... }
*/

const CASE_STATUS_MAP = {
  signale: 'pending',
  en_instruction: 'hearing',
  jugement: 'hearing',
  traite: 'closed',
};

const MEETING_STATUS_MAP = {
  planifie: 'scheduled',
  en_cours: 'scheduled',
  termine: 'finalized',
};

const GRAVITE_LABEL = {
  faible: 'Faible',
  moyenne: 'Moyenne',
  grave: 'Grave',
  tres_grave: 'Très grave',
};

/**
 * Normalizes a DossierDisciplinaire record to the UI "case" shape.
 * Accepts partial data; all fields are tolerant of missing values.
 */
export function normalizeCase(rawCase) {
  if (!rawCase) return null;

  const etudiant = rawCase.etudiant || {};
  const user = etudiant.user || {};
  const caseId = rawCase.id;
  const normalizedId = typeof caseId === 'string' && caseId.startsWith('CASE-')
    ? caseId
    : `CASE-${caseId}`;

  const dateSignal = rawCase.dateSignal || rawCase.dateReported || rawCase.createdAt || new Date().toISOString();
  const description =
    rawCase.descriptionSignal_ar ||
    rawCase.descriptionSignal_en ||
    rawCase.descriptionSignal ||
    rawCase.description ||
    '';

  const infractionLabel =
    rawCase.infraction?.nom_en ||
    rawCase.infraction?.nom_ar ||
    rawCase.violationType ||
    'Misconduct';

  const graviteLabel = rawCase.infraction?.gravite
    ? GRAVITE_LABEL[rawCase.infraction.gravite] ||
      (rawCase.infraction.gravite.charAt(0).toUpperCase() + rawCase.infraction.gravite.slice(1))
    : '';

  const violationType = graviteLabel ? `${infractionLabel} (${graviteLabel})` : infractionLabel;

  const reporterName =
    rawCase.reporterName ||
    [rawCase.enseignantSignalantR?.user?.prenom, rawCase.enseignantSignalantR?.user?.nom]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    null;

  const reporterEnseignantId = Number(
    rawCase.reporterEnseignantId ?? rawCase.enseignantSignalant ?? rawCase.enseignantSignalantR?.id,
  );

  const remarqueDecision =
    rawCase.remarqueDecision_en ||
    rawCase.remarqueDecision_ar ||
    rawCase.remarqueDecision ||
    '';

  return {
    ...rawCase,
    rawId: typeof caseId === 'number' ? caseId : undefined,
    studentEtudiantId: etudiant.id || rawCase.studentEtudiantId || null,
    studentUserId: user.id || rawCase.studentUserId || null,
    id: normalizedId,
    status: CASE_STATUS_MAP[rawCase.status] || rawCase.status || 'pending',
    studentName:
      rawCase.studentName ||
      [user.prenom, user.nom].filter(Boolean).join(' ').trim() ||
      'Unknown student',
    studentId: rawCase.studentId || etudiant.matricule || '-',
    department: rawCase.department || '-',
    violationType,
    description,
    reporterName,
    reporterEnseignantId:
      Number.isInteger(reporterEnseignantId) && reporterEnseignantId > 0
        ? reporterEnseignantId
        : null,
    dateReported: dateSignal,
    dateOfIncident: rawCase.dateOfIncident || dateSignal,
    timeline:
      Array.isArray(rawCase.timeline) && rawCase.timeline.length > 0
        ? rawCase.timeline
        : [
            {
              event: 'Report Submitted',
              date: dateSignal,
              detail: description || `Case reported for ${violationType}.`,
              by: reporterName || 'Teacher',
            },
          ],
    evidenceFiles: Array.isArray(rawCase.evidenceFiles) ? rawCase.evidenceFiles : [],
    decision: rawCase.decision
      ? {
          verdict:
            rawCase.decision.verdict ||
            rawCase.decision.nom_en ||
            rawCase.decision.nom_ar ||
            rawCase.decision.nom ||
            '',
          details:
            remarqueDecision ||
            rawCase.decision.details ||
            rawCase.decision.description_en ||
            rawCase.decision.description_ar ||
            rawCase.decision.description ||
            '',
          niveauSanction: rawCase.decision.niveauSanction || null,
          date:
            rawCase.dateDecision ||
            rawCase.updatedAt ||
            rawCase.createdAt ||
            new Date().toISOString(),
          issuedBy: 'Disciplinary council',
        }
      : rawCase.decision || null,
  };
}

export function normalizeCases(list) {
  return Array.isArray(list) ? list.map(normalizeCase).filter(Boolean) : [];
}

/**
 * Normalizes a ConseilDisciplinaire record to the UI "meeting" shape.
 */
export function normalizeMeeting(rawMeeting) {
  if (!rawMeeting) return null;

  const meetingId = rawMeeting.id;
  const normalizedId =
    typeof meetingId === 'string' && meetingId.startsWith('MEET-') ? meetingId : `MEET-${meetingId}`;

  const rawConseilId =
    typeof meetingId === 'number'
      ? meetingId
      : Number(String(meetingId).replace('MEET-', ''));

  const memberEntries = Array.isArray(rawMeeting.membres)
    ? rawMeeting.membres
        .map((m) => {
          const enseignantId = Number(m.enseignant?.id ?? m.enseignantId);
          const name = [m.enseignant?.user?.prenom, m.enseignant?.user?.nom]
            .filter(Boolean)
            .join(' ')
            .trim();
          const hasEnseignantId = Number.isInteger(enseignantId) && enseignantId > 0;
          return {
            id: Number.isInteger(Number(m.id)) ? Number(m.id) : null,
            enseignantId: hasEnseignantId ? enseignantId : null,
            role: m.role || 'membre',
            name:
              name ||
              (hasEnseignantId
                ? `Teacher #${enseignantId}`
                : m.role === 'rapporteur'
                ? 'Reporter'
                : 'Member'),
          };
        })
        .filter((member) => Boolean(member.name))
    : [];

  const participants = Array.isArray(rawMeeting.participants)
    ? rawMeeting.participants
    : memberEntries.map((member) => member.name).filter(Boolean);

  const caseIds = Array.isArray(rawMeeting.caseIds)
    ? rawMeeting.caseIds
    : Array.isArray(rawMeeting.dossiers)
    ? rawMeeting.dossiers.map((d) => `CASE-${d.id}`)
    : [];

  const decisionsInMeeting = Array.isArray(rawMeeting.dossiers)
    ? rawMeeting.dossiers.map((d) => d.decision).filter(Boolean)
    : [];
  const firstDecision = decisionsInMeeting[0];
  const decisionText = firstDecision
    ? firstDecision.verdict || firstDecision.nom_en || firstDecision.nom_ar || ''
    : null;

  const presidentMember = memberEntries.find((m) => m.role === 'president') || null;
  const reporterMember = memberEntries.find((m) => m.role === 'rapporteur') || null;
  const membreIds = memberEntries.map((m) => String(m.enseignantId)).filter(Boolean);

  return {
    ...rawMeeting,
    id: normalizedId,
    conseilId: Number.isFinite(rawConseilId) ? rawConseilId : null,
    title: rawMeeting.title || 'Conseil disciplinaire',
    agenda:
      rawMeeting.agenda || rawMeeting.description_en || rawMeeting.description_ar || '',
    date: rawMeeting.date || rawMeeting.dateReunion || new Date().toISOString(),
    time:
      rawMeeting.time ||
      (rawMeeting.heure
        ? new Date(rawMeeting.heure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--'),
    location: rawMeeting.location || rawMeeting.lieu || 'TBD',
    status: MEETING_STATUS_MAP[rawMeeting.status] || rawMeeting.status || 'scheduled',
    participants,
    memberEntries,
    membres: memberEntries,
    membreIds,
    caseIds,
    decision: decisionText,
    dossiers: Array.isArray(rawMeeting.dossiers) ? rawMeeting.dossiers : [],
    presidentEnseignantId: presidentMember?.enseignantId ?? null,
    rapporteurEnseignantId: reporterMember?.enseignantId ?? null,
    reporterEnseignantId: reporterMember?.enseignantId ?? null,
  };
}

export function normalizeMeetings(list) {
  return Array.isArray(list) ? list.map(normalizeMeeting).filter(Boolean) : [];
}

/**
 * Reverse direction: map UI status -> backend status.
 * Used when posting updates back to the server.
 */
export function toBackendCaseStatus(uiStatus) {
  const reverseMap = {
    pending: 'signale',
    hearing: 'en_instruction',
    judgment: 'jugement',
    closed: 'traite',
  };
  return reverseMap[uiStatus] || uiStatus;
}

export function toBackendMeetingStatus(uiStatus) {
  const reverseMap = {
    scheduled: 'planifie',
    'in-progress': 'en_cours',
    finalized: 'termine',
  };
  return reverseMap[uiStatus] || uiStatus;
}

/**
 * Normalizes an Infraction catalog entry for display.
 */
export function normalizeInfraction(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.nom_en || raw.nom_ar || raw.nom || `Infraction #${raw.id}`,
    description: raw.description_en || raw.description_ar || raw.description || '',
    gravite: raw.gravite || null,
    graviteLabel: raw.gravite ? GRAVITE_LABEL[raw.gravite] || raw.gravite : null,
  };
}

/**
 * Normalizes a Decision catalog entry for display.
 */
export function normalizeDecision(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.nom_en || raw.nom_ar || raw.nom || `Decision #${raw.id}`,
    description: raw.description_en || raw.description_ar || raw.description || '',
    niveauSanction: raw.niveauSanction || null,
  };
}
