/*
  Discipline API Service
  ─────────────────────────────────────────────────────────────────
  Single entry-point for all discipline endpoints. Every call goes
  through the adapter layer so components receive UI-shaped data,
  not raw Prisma shapes.

  Backend mount points (see backend/src/app.ts):
    /api/v1/cd           → discipline routes
    /api/v1/disciplinary → discipline routes (alias)
    /api/v1/discipline   → discipline routes (alias, added for this integration)

  This file uses the /api/v1/disciplinary prefix since it's the most
  consistent with the existing catalog API and has been stable.
*/

import request from './api';
import {
  normalizeCase,
  normalizeCases,
  normalizeMeeting,
  normalizeMeetings,
  normalizeInfraction,
  normalizeDecision,
} from './disciplineAdapter';

const BASE = '/api/v1/disciplinary';

const unwrap = (response) => response?.data ?? response;
const unwrapList = (response) => {
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
};

const buildQuery = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (!entries.length) return '';
  const usp = new URLSearchParams();
  entries.forEach(([k, v]) => usp.set(k, String(v)));
  return `?${usp.toString()}`;
};

/* ── Dossiers (cases) ─────────────────────────────────────── */

export const casesAPI = {
  list: async (filters = {}) => {
    const response = await request(`${BASE}/dossiers-disciplinaires${buildQuery(filters)}`);
    return normalizeCases(unwrapList(response));
  },

  get: async (id) => {
    const rawId = String(id).replace('CASE-', '');
    const response = await request(`${BASE}/dossiers-disciplinaires/${rawId}`);
    return normalizeCase(unwrap(response));
  },

  create: async (payload) => {
    const response = await request(`${BASE}/dossiers-disciplinaires`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = unwrap(response);
    return Array.isArray(data) ? normalizeCases(data) : normalizeCase(data);
  },

  update: async (id, payload) => {
    const rawId = String(id).replace('CASE-', '');
    const response = await request(`${BASE}/dossiers-disciplinaires/${rawId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeCase(unwrap(response));
  },

  remove: async (id) => {
    const rawId = String(id).replace('CASE-', '');
    return request(`${BASE}/dossiers-disciplinaires/${rawId}`, { method: 'DELETE' });
  },
};

/* ── Conseils (meetings) ──────────────────────────────────── */

export const meetingsAPI = {
  list: async (filters = {}) => {
    const response = await request(`${BASE}/conseils${buildQuery(filters)}`);
    return normalizeMeetings(unwrapList(response));
  },

  get: async (id) => {
    const rawId = String(id).replace('MEET-', '');
    const response = await request(`${BASE}/conseils/${rawId}`);
    return normalizeMeeting(unwrap(response));
  },

  create: async (payload) => {
    const response = await request(`${BASE}/conseils`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeMeeting(unwrap(response));
  },

  update: async (id, payload) => {
    const rawId = String(id).replace('MEET-', '');
    const response = await request(`${BASE}/conseils/${rawId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeMeeting(unwrap(response));
  },

  remove: async (id) => {
    const rawId = String(id).replace('MEET-', '');
    return request(`${BASE}/conseils/${rawId}`, { method: 'DELETE' });
  },

  finalize: async (id, drafts) => {
    const rawId = String(id).replace('MEET-', '');
    return request(`${BASE}/conseils/${rawId}/finaliser`, {
      method: 'PATCH',
      body: JSON.stringify({ drafts }),
    });
  },

  addMember: async (conseilId, { enseignantId, role = 'membre' }) => {
    const rawId = String(conseilId).replace('MEET-', '');
    return request(`${BASE}/conseils/${rawId}/membres`, {
      method: 'POST',
      body: JSON.stringify({ enseignantId, role }),
    });
  },

  removeMember: async (conseilId, membreId) => {
    const rawId = String(conseilId).replace('MEET-', '');
    return request(`${BASE}/conseils/${rawId}/membres/${membreId}`, {
      method: 'DELETE',
    });
  },

  /** List teachers NOT currently in this conseil (for add-member modal). */
  availableMembers: async (conseilId, q = '') => {
    const rawId = String(conseilId).replace('MEET-', '');
    const response = await request(
      `${BASE}/conseils/${rawId}/available-members${buildQuery({ q })}`,
    );
    return unwrapList(response);
  },
};

/* ── Catalogs ─────────────────────────────────────────────── */

export const catalogAPI = {
  listInfractions: async () => {
    const response = await request(`${BASE}/infractions`);
    return unwrapList(response).map(normalizeInfraction).filter(Boolean);
  },

  listDecisions: async () => {
    const response = await request(`${BASE}/decisions`);
    return unwrapList(response).map(normalizeDecision).filter(Boolean);
  },

  listStaff: async () => {
    const response = await request(`${BASE}/staff`);
    return unwrapList(response);
  },

  searchStaff: async (q) => {
    const response = await request(`${BASE}/staff/search${buildQuery({ q })}`);
    return unwrapList(response);
  },

  listStudents: async (q = '') => {
    const response = await request(`${BASE}/students${buildQuery({ q })}`);
    return unwrapList(response);
  },

  getStudentProfile: async (id) => {
    const response = await request(`${BASE}/students/${id}/profile`);
    return unwrap(response);
  },

  getStats: async () => {
    const response = await request(`${BASE}/stats`);
    return unwrap(response);
  },
};

/* ── Student self-access ──────────────────────────────────── */

export const studentAPI = {
  /** Discipline notifications for the logged-in student */
  notifications: async () => {
    const response = await request(`${BASE}/notifications`);
    return Array.isArray(response?.data) ? response.data : [];
  },

  /** The logged-in student's own dossiers */
  myDossiers: async () => {
    const response = await request(`${BASE}/my-dossiers`);
    return unwrapList(response);
  },
};

/* ── Convenience default export ──────────────────────────── */

export default {
  cases: casesAPI,
  meetings: meetingsAPI,
  catalog: catalogAPI,
  student: studentAPI,
};
