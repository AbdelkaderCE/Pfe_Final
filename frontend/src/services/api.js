/*
  Centralized API client for the University Platform.
  Base URL defaults to http://localhost:5000 in development.
  Credentials: 'include' sends httpOnly cookies (JWT access + refresh tokens).
  Auto-refresh: on 401, tries /refresh-token once then retries the original request.
*/

const DEFAULT_API_HOST =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';

const API_BASE = process.env.REACT_APP_API_URL || `http://${DEFAULT_API_HOST}:5000`;
const ACCESS_TOKEN_STORAGE_KEY = 'pfe_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'pfe_refresh_token';

function readSessionToken(storageKey) {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.sessionStorage.getItem(storageKey) || '';
  } catch {
    return '';
  }
}

function writeSessionToken(storageKey, tokenValue) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (tokenValue) {
      window.sessionStorage.setItem(storageKey, tokenValue);
    } else {
      window.sessionStorage.removeItem(storageKey);
    }
  } catch {
    // storage can be unavailable in private mode; keep in-memory fallback
  }
}

let accessToken = readSessionToken(ACCESS_TOKEN_STORAGE_KEY);
let refreshToken = readSessionToken(REFRESH_TOKEN_STORAGE_KEY);

export function setAccessToken(token) {
  accessToken = String(token || '');
  writeSessionToken(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function setRefreshToken(token) {
  refreshToken = String(token || '');
  writeSessionToken(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearRefreshToken() {
  setRefreshToken('');
}

export function clearAccessToken() {
  setAccessToken('');
}

function clearStoredTokens() {
  clearAccessToken();
  clearRefreshToken();
}

export function resolveMediaUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${API_BASE}${normalized}`;
}

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error) {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  refreshQueue = [];
}

function createNetworkError() {
  const error = new Error('Unable to reach the server. Please make sure the backend is running on http://localhost:5000.');
  error.status = 0;
  error.code = 'NETWORK_ERROR';
  return error;
}

async function request(endpoint, options = {}, _isRetry = false) {
  const url = `${API_BASE}${endpoint}`;
  const isFormDataBody = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  const providedHeaders = options.headers || {};
  const authHeader = accessToken && !providedHeaders.Authorization
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  let res;
  try {
    res = await fetch(url, {
      headers: {
        ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
        ...authHeader,
        ...providedHeaders,
      },
      credentials: 'include', // send httpOnly cookies
      ...options,
    });
  } catch {
    throw createNetworkError();
  }

  // Rate limiter returns HTML, not JSON
  if (res.status === 429) {
    const error = new Error('Too many attempts. Please wait a few minutes and try again.');
    error.status = 429;
    error.code = 'RATE_LIMITED';
    throw error;
  }

  // Auto-refresh on 401 (skip if this IS the refresh call or a retry)
  const hasExplicitAuthHeader = Boolean(providedHeaders.Authorization);
  const hasTokenHint = Boolean(accessToken || hasExplicitAuthHeader);
  const isSessionProbeEndpoint = endpoint === '/api/v1/auth/me';

  if (
    res.status === 401
    && !_isRetry
    && !endpoint.includes('/refresh-token')
    && !endpoint.includes('/login')
    && !(isSessionProbeEndpoint && !hasTokenHint)
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: refreshToken
            ? { 'x-refresh-token': refreshToken }
            : undefined,
        });
        if (!refreshRes.ok) {
          clearStoredTokens();
          const refreshError = new Error('Session expired. Please sign in again.');
          refreshError.status = refreshRes.status;
          throw refreshError;
        }

        let refreshPayload = null;
        try {
          refreshPayload = await refreshRes.json();
        } catch {
          refreshPayload = null;
        }

        const refreshedToken = refreshPayload?.data?.accessToken || refreshPayload?.accessToken;
        if (typeof refreshedToken === 'string' && refreshedToken.trim()) {
          setAccessToken(refreshedToken);
        }

        const refreshedRefreshToken = refreshPayload?.data?.refreshToken || refreshPayload?.refreshToken;
        if (typeof refreshedRefreshToken === 'string' && refreshedRefreshToken.trim()) {
          setRefreshToken(refreshedRefreshToken);
        }

        processQueue(null);
      } catch (refreshErr) {
        clearStoredTokens();
        processQueue(refreshErr);
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Another refresh is in-flight — wait for it
      await new Promise((resolve, reject) => refreshQueue.push({ resolve, reject }));
    }
    // Retry the original request once
    return request(endpoint, options, true);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    const error = new Error('Server error. Please try again later.');
    error.status = res.status;
    throw error;
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.message || 'Something went wrong';
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data;
}

function buildQueryString(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) {
    return '';
  }

  const query = new URLSearchParams();
  entries.forEach(([key, value]) => query.set(key, String(value)));
  return `?${query.toString()}`;
}

async function downloadFile(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'Failed to download file';
    try {
      const payload = await res.json();
      message = payload?.error?.message || payload?.message || message;
    } catch {
      // ignore JSON parse errors for binary responses
    }

    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  const disposition = res.headers.get('content-disposition') || '';
  const utf8NameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const simpleNameMatch = disposition.match(/filename="?([^";]+)"?/i);

  const rawFileName = utf8NameMatch?.[1] || simpleNameMatch?.[1] || 'download';
  const fileName = decodeURIComponent(rawFileName);
  const blob = await res.blob();

  return { blob, fileName };
}

/* ── Auth API ───────────────────────────────────────────────── */

export const authAPI = {
  login: (email, password) =>
    request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () =>
    request('/api/v1/auth/logout', {
      method: 'POST',
      headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
    }),

  refreshToken: () =>
    request('/api/v1/auth/refresh-token', {
      method: 'POST',
      headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
    }),

  getMe: () =>
    request('/api/v1/auth/me'),

  getRbacCatalog: () =>
    request('/api/v1/auth/rbac/catalog'),

  verifyEmail: (token) =>
    request(`/api/v1/auth/verify-email/${token}`),

  resendVerification: (email) =>
    request('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    return request('/api/v1/auth/profile/photo', {
      method: 'POST',
      body: formData,
    });
  },

  removeProfilePhoto: () =>
    request('/api/v1/auth/profile/photo', {
      method: 'DELETE',
    }),


  forgotPassword: (email) =>
    request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, newPassword) =>
    request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  /* Admin-only endpoints */
  adminCreateUser: (userData) =>
    request('/api/v1/auth/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  adminImportUsersExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/api/v1/auth/admin/import-users-excel', {
      method: 'POST',
      body: formData,
    });
  },

  adminResetPassword: (userId) =>
    request(`/api/v1/auth/admin/reset-password/${userId}`, {
      method: 'POST',
    }),

  adminGetUsers: () =>
    request('/api/v1/auth/admin/users'),

  adminGetRoles: () =>
    request('/api/v1/auth/admin/roles'),

  adminGetAcademicOptions: () =>
    request('/api/v1/auth/admin/academic/options'),

  adminCreateSpecialite: (payload) =>
    request('/api/v1/auth/admin/academic/specialites', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminCreatePromo: (payload) =>
    request('/api/v1/auth/admin/academic/promos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminCreateModule: (payload) =>
    request('/api/v1/auth/admin/academic/modules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminGetAcademicAssignments: () =>
    request('/api/v1/auth/admin/academic/assignments'),

  adminAssignStudentPromo: (userId, promoId) =>
    request(`/api/v1/auth/admin/academic/assignments/students/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ promoId }),
    }),

  adminAssignTeacherModules: (userId, payload) =>
    request(`/api/v1/auth/admin/academic/assignments/teachers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminUpdateUserRoles: (userId, roleNames) =>
    request(`/api/v1/auth/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleNames }),
    }),

  adminUpdateUserStatus: (userId, status) =>
    request(`/api/v1/auth/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  adminExportUsersPdf: (scope = 'all') =>
    downloadFile(`/api/v1/auth/admin/users/export/pdf${buildQueryString({ scope })}`),
};

// ── Academic structure (years / modules / enseignements) ───────
// Separate from authAPI.adminCreate* (which targets the legacy
// /api/v1/auth/admin/academic/* endpoints). The new endpoints live at
// /api/v1/{academic-years|modules|enseignements} per the academic spec.
export const academicAPI = {
  // Academic years
  listYears: () => request('/api/v1/academic-years'),
  getActiveYear: () => request('/api/v1/academic-years/active'),
  createYear: (payload) =>
    request('/api/v1/academic-years', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateYear: (id, payload) =>
    request(`/api/v1/academic-years/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  activateYear: (id) =>
    request(`/api/v1/academic-years/${id}/activate`, { method: 'POST' }),
  deleteYear: (id) =>
    request(`/api/v1/academic-years/${id}`, { method: 'DELETE' }),

  // Modules CRUD
  listModules: (filter = {}) =>
    request(`/api/v1/modules${buildQueryString(filter)}`),
  getModule: (id) => request(`/api/v1/modules/${id}`),
  createModule: (payload) =>
    request('/api/v1/modules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateModule: (id, payload) =>
    request(`/api/v1/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteModule: (id) =>
    request(`/api/v1/modules/${id}`, { method: 'DELETE' }),

  // Enseignements (teaching assignments)
  listEnseignements: (filter = {}) =>
    request(`/api/v1/enseignements${buildQueryString(filter)}`),
  createEnseignement: (payload) =>
    request('/api/v1/enseignements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEnseignement: (id, payload) =>
    request(`/api/v1/enseignements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteEnseignement: (id) =>
    request(`/api/v1/enseignements/${id}`, { method: 'DELETE' }),

  // Role-scoped reads
  myTeacherEnseignements: (filter = {}) =>
    request(`/api/v1/enseignements/mine${buildQueryString(filter)}`),
  myStudentEnseignements: (filter = {}) =>
    request(`/api/v1/enseignements/me${buildQueryString(filter)}`),

  // Hierarchical tree (Year → Promo → Module → Enseignement) used by the
  // refactored Academic Structure UI. Pass `{ yearId }` to scope to one year.
  hierarchy: (filter = {}) =>
    request(`/api/v1/academic-years/hierarchy${buildQueryString(filter)}`),
};

export const adminPanelAPI = {
  getOverview: () =>
    request('/api/v1/admin/dashboard/overview'),

  getAnalytics: () =>
    request('/api/v1/admin/analytics'),

  getUserStats: (userId) =>
    request(`/api/v1/admin/user/${userId}/stats`),

  getAuditLogs: (params = {}) =>
    request(`/api/v1/admin/audit-logs${buildQueryString(params)}`),

  getUsers: (params = {}) =>
    request(`/api/v1/admin/users${buildQueryString(params)}`),

  updateUserRole: (userId, role) =>
    request(`/api/v1/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (userId) =>
    request(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
    }),

  getAnnouncements: (params = {}) =>
    request(`/api/v1/admin/announcements${buildQueryString(params)}`),

  createAnnouncement: (formData) =>
    request('/api/v1/admin/announcements', {
      method: 'POST',
      body: formData,
    }),

  updateAnnouncement: (announcementId, formData) =>
    request(`/api/v1/admin/announcements/${announcementId}`, {
      method: 'PATCH',
      body: formData,
    }),

  deleteAnnouncement: (announcementId) =>
    request(`/api/v1/admin/announcements/${announcementId}`, {
      method: 'DELETE',
    }),

  getReclamations: (params = {}) =>
    request(`/api/v1/admin/reclamations${buildQueryString(params)}`),

  updateReclamationStatus: (reclamationId, payload) =>
    request(`/api/v1/admin/reclamations/${reclamationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getDocuments: (params = {}) =>
    request(`/api/v1/admin/documents${buildQueryString(params)}`),

  deleteDocument: (kind, documentId) =>
    request(`/api/v1/admin/documents/${kind}/${documentId}`, {
      method: 'DELETE',
    }),

  getRequestWorkflowHistory: (category, requestId) =>
    request(`/api/v1/requests/admin/${category}/${requestId}/workflow`),

  downloadDocument: (kind, documentId) =>
    downloadFile(`/api/v1/admin/documents/${kind}/${documentId}/download`),
};

export const teacherPanelAPI = {
  getDashboard: () =>
    request('/api/v1/teacher/dashboard'),

  getAnnouncements: (params = {}) =>
    request(`/api/v1/teacher/announcements${buildQueryString(params)}`),

  createAnnouncement: (formData) =>
    request('/api/v1/teacher/announcements', {
      method: 'POST',
      body: formData,
    }),

  updateAnnouncement: (announcementId, formData) =>
    request(`/api/v1/teacher/announcements/${announcementId}`, {
      method: 'PATCH',
      body: formData,
    }),

  deleteAnnouncement: (announcementId) =>
    request(`/api/v1/teacher/announcements/${announcementId}`, {
      method: 'DELETE',
    }),

  getReclamations: (params = {}) =>
    request(`/api/v1/teacher/reclamations${buildQueryString(params)}`),

  updateReclamationStatus: (reclamationId, payload) =>
    request(`/api/v1/teacher/reclamations/${reclamationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getStudents: (params = {}) =>
    request(`/api/v1/teacher/students${buildQueryString(params)}`),

  getStudentReclamationHistory: (studentId) =>
    request(`/api/v1/teacher/students/${studentId}/reclamations`),

  getDocuments: (params = {}) =>
    request(`/api/v1/teacher/documents${buildQueryString(params)}`),

  createDocument: (formData) =>
    request('/api/v1/teacher/documents', {
      method: 'POST',
      body: formData,
    }),

  updateDocument: (documentId, formData) =>
    request(`/api/v1/teacher/documents/${documentId}`, {
      method: 'PATCH',
      body: formData,
    }),

  deleteDocument: (documentId) =>
    request(`/api/v1/teacher/documents/${documentId}`, {
      method: 'DELETE',
    }),

  downloadDocument: (documentId) =>
    downloadFile(`/api/v1/teacher/documents/${documentId}/download`),

  getProfile: () =>
    request('/api/v1/teacher/profile'),

  updateProfile: (payload) =>
    request('/api/v1/teacher/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/v1/teacher/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const studentPanelAPI = {
  getDashboard: () =>
    request('/api/v1/student/panel/dashboard'),

  getAnnouncements: (params = {}) =>
    request(`/api/v1/student/panel/announcements${buildQueryString(params)}`),

  getAnnouncementDetails: (announcementId) =>
    request(`/api/v1/student/panel/announcements/${announcementId}`),

  downloadAnnouncementDocument: (announcementId, documentId) =>
    downloadFile(`/api/v1/student/panel/announcements/${announcementId}/documents/${documentId}/download`),

  getReclamationTypes: () =>
    request('/api/v1/student/panel/reclamation-types'),

  createReclamation: (formData) =>
    request('/api/v1/student/panel/reclamations', {
      method: 'POST',
      body: formData,
    }),

  getReclamations: (params = {}) =>
    request(`/api/v1/student/panel/reclamations${buildQueryString(params)}`),

  getReclamationDetails: (reclamationId) =>
    request(`/api/v1/student/panel/reclamations/${reclamationId}`),

  downloadReclamationDocument: (reclamationId, documentId) =>
    downloadFile(`/api/v1/student/panel/reclamations/${reclamationId}/documents/${documentId}/download`),

  getDocuments: (params = {}) =>
    request(`/api/v1/student/panel/documents${buildQueryString(params)}`),

  downloadDocument: (kind, documentId) =>
    downloadFile(`/api/v1/student/panel/documents/${kind}/${documentId}/download`),

  getProfile: () =>
    request('/api/v1/student/panel/profile'),

  updateProfile: (payload) =>
    request('/api/v1/student/panel/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/v1/student/panel/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const siteSettingsAPI = {
  getPublic: () =>
    request('/api/v1/site-settings'),

  update: (payload) =>
    request('/api/v1/site-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  uploadMedia: (kind, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request(`/api/v1/site-settings/media/${kind}`, {
      method: 'POST',
      body: formData,
    });
  },
};

export const alertsAPI = {
  getActive: () =>
    request('/api/v1/alerts?limit=12'),

  getMine: (params = {}) =>
    request(`/api/v1/alerts${buildQueryString(params)}`),

  markAsRead: (id) =>
    request(`/api/v1/alerts/${id}/read`, {
      method: 'PATCH',
    }),
};

export const disciplinaryCatalogAPI = {
  listInfractions: () =>
    request('/api/v1/disciplinary/infractions'),

  createInfraction: (payload) =>
    request('/api/v1/disciplinary/infractions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateInfraction: (id, payload) =>
    request(`/api/v1/disciplinary/infractions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteInfraction: (id) =>
    request(`/api/v1/disciplinary/infractions/${id}`, {
      method: 'DELETE',
    }),

  listDecisions: () =>
    request('/api/v1/disciplinary/decisions'),

  createDecision: (payload) =>
    request('/api/v1/disciplinary/decisions/catalog', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDecision: (id, payload) =>
    request(`/api/v1/disciplinary/decisions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteDecision: (id) =>
    request(`/api/v1/disciplinary/decisions/${id}`, {
      method: 'DELETE',
    }),
};

/* ── Affectation API ────────────────────────────────────────── */

export const affectationAPI = {
  // ── Campaigns ──────────────────────────────────────────────
  listCampaigns: (filters = {}) =>
    request(`/api/v1/affectation/campaigns${buildQueryString(filters)}`),

  getCampaign: (id) =>
    request(`/api/v1/affectation/campaigns/${id}`),

  createCampaign: (payload) =>
    request('/api/v1/affectation/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCampaign: (id, payload) =>
    request(`/api/v1/affectation/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCampaign: (id) =>
    request(`/api/v1/affectation/campaigns/${id}`, {
      method: 'DELETE',
    }),

  openCampaign: (id) =>
    request(`/api/v1/affectation/campaigns/${id}/open`, {
      method: 'PATCH',
    }),

  closeCampaign: (id) =>
    request(`/api/v1/affectation/campaigns/${id}/close`, {
      method: 'PATCH',
    }),

  runAlgorithm: (id) =>
    request(`/api/v1/affectation/campaigns/${id}/run`, {
      method: 'POST',
    }),

  getCampaignVoeux: (id) =>
    request(`/api/v1/affectation/campaigns/${id}/voeux`),

  getCampaignResults: (id) => request(`/api/v1/affectation/campaigns/${id}/results`),
  getCampaignStats: (id) => request(`/api/v1/affectation/campaigns/${id}/stats`),

  exportCampaignResultsPdf: (id) => {
    // Return the URL directly for browser download
    return `${API_BASE}/api/v1/affectation/campaigns/${id}/export/pdf`;
  },

  // ── Specialite-campaign links ──────────────────────────────
  linkSpecialite: (campaignId, payload) =>
    request(`/api/v1/affectation/campaigns/${campaignId}/specialites`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSpecialiteQuota: (linkId, quota) =>
    request(`/api/v1/affectation/specialites/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quota }),
    }),

  unlinkSpecialite: (linkId) =>
    request(`/api/v1/affectation/specialites/${linkId}`, {
      method: 'DELETE',
    }),

  // ── Student endpoints ──────────────────────────────────────
  listOpenCampaignsForStudent: () =>
    request('/api/v1/affectation/campaigns/open'),

  submitVoeux: (payload) =>
    request('/api/v1/affectation/voeux', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyVoeux: (campagneId) =>
    request(`/api/v1/affectation/voeux/me${buildQueryString({ campagneId })}`),

  getMyAffectation: () =>
    request('/api/v1/affectation/voeux/me/affectation'),

  // ── Bulk admin operations (CSV import + mass assignment) ───
  // The admin UI uses these to import students from a CSV, mass-assign a
  // batch of students to one promo, and bulk-create teacher enseignements.
  importStudentsCsv: (payload) =>
    request('/api/v1/affectation/bulk/students/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bulkAssignStudentsPromo: (payload) =>
    request('/api/v1/affectation/bulk/students/assign-promo', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bulkAssignTeacherEnseignements: (payload) =>
    request('/api/v1/affectation/bulk/teachers/assign', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  importAverages: (payload) =>
    request('/api/v1/affectation/bulk/import-averages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export default request;
