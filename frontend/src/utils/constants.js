/*
  Application-wide constants — Ibn Khaldoun University Platform.
  Roles, labels, pagination defaults, regex patterns, HTTP status codes.
*/

export const APP_NAME = 'Ibn Khaldoun University Platform';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

/* ── Roles ──────────────────────────────────────────────────── */

export const ROLES = {
  STUDENT: 'etudiant',
  TEACHER: 'enseignant',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.ADMIN]: 'Admin',
};

/* ── Validation ─────────────────────────────────────────────── */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

/* ── Storage Keys ───────────────────────────────────────────── */

export const TOKEN_STORAGE_KEY = 'accessToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

/* ── Date Formats ───────────────────────────────────────────── */

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIME_FORMAT = 'HH:mm';

/* ── Pagination ─────────────────────────────────────────────── */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZES: [10, 25, 50, 100],
};

/* ── HTTP Status Codes ──────────────────────────────────────── */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
};
