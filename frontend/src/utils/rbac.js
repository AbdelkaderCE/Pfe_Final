const CORE_ROLE_NAMES = new Set(['etudiant', 'enseignant', 'admin']);

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function normalizeRoleName(roleName) {
  if (!roleName) return '';
  return String(roleName).trim().toLowerCase();
}

export function normalizeRoleList(roleNames) {
  const result = [];
  const seen = new Set();

  toArray(roleNames).forEach((roleName) => {
    const normalized = normalizeRoleName(roleName);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function getUserRoles(user) {
  return normalizeRoleList(user?.roles || []);
}

export function getUserPermissions(user) {
  const result = [];
  const seen = new Set();

  toArray(user?.permissions || []).forEach((permissionCode) => {
    const normalized = String(permissionCode || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function hasAnyRole(user, allowedRoles = []) {
  const userRoles = getUserRoles(user);
  if (!allowedRoles?.length) return true;

  const allowed = new Set(normalizeRoleList(allowedRoles));
  return userRoles.some((roleName) => allowed.has(roleName));
}

export function hasPermission(user, requiredPermission) {
  if (!requiredPermission) return true;
  return getUserPermissions(user).includes(String(requiredPermission).trim());
}

export function hasAnyPermission(user, requiredPermissions = []) {
  if (!requiredPermissions?.length) return true;
  const permissionSet = new Set(getUserPermissions(user));
  return requiredPermissions.some((permissionCode) => permissionSet.has(String(permissionCode || '').trim()));
}

export function hasAllPermissions(user, requiredPermissions = []) {
  if (!requiredPermissions?.length) return true;
  const permissionSet = new Set(getUserPermissions(user));
  return requiredPermissions.every((permissionCode) => permissionSet.has(String(permissionCode || '').trim()));
}

export function resolveCoreRole(user) {
  if (user?.coreRole) {
    return normalizeRoleName(user.coreRole);
  }

  const normalizedRoles = getUserRoles(user);
  if (normalizedRoles.includes('etudiant')) return 'etudiant';
  if (normalizedRoles.includes('enseignant')) return 'enseignant';
  if (normalizedRoles.includes('admin')) return 'admin';
  return null;
}

export function getExtensionRoles(user) {
  const normalizedRoles = getUserRoles(user);

  if (Array.isArray(user?.extensions) && user.extensions.length > 0) {
    return normalizeRoleList(user.extensions);
  }

  return normalizedRoles.filter((roleName) => !CORE_ROLE_NAMES.has(roleName));
}

export function canAccess(user, options = {}) {
  const {
    allowedRoles = [],
    requiredPermissions = [],
    requireAllPermissions = false,
    mode = 'all',
  } = options;

  const roleAllowed = allowedRoles.length > 0 ? hasAnyRole(user, allowedRoles) : true;
  const permissionAllowed = requiredPermissions.length > 0
    ? (requireAllPermissions ? hasAllPermissions(user, requiredPermissions) : hasAnyPermission(user, requiredPermissions))
    : true;

  if (allowedRoles.length > 0 && requiredPermissions.length > 0 && mode === 'any') {
    return roleAllowed || permissionAllowed;
  }

  return roleAllowed && permissionAllowed;
}
