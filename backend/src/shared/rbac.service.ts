import prisma from "../config/database";

export type CoreRoleName = "etudiant" | "enseignant" | "admin";

type RoleTrack = "student" | "teacher" | "admin";

type RoleCatalogEntry = {
  name: string;
  label: string;
  description: string;
  core: boolean;
  extendsRole?: CoreRoleName;
  track: RoleTrack;
};

type PermissionCatalogEntry = {
  code: string;
  description: string;
  module: string;
  action: string;
};

type ValidateRoleOptions = {
  requireSingleCore: boolean;
  currentRoles?: string[];
  allowCoreChange?: boolean;
};

export type RoleProfile = {
  normalizedRoles: string[];
  coreRole: CoreRoleName | null;
  extensionRoles: string[];
  unknownRoles: string[];
  track: RoleTrack | null;
};

export type UserAuthorization = {
  userId: number;
  roles: string[];
  coreRole: CoreRoleName | null;
  extensions: string[];
  permissions: string[];
  track: RoleTrack | null;
};

export const CORE_ROLE_NAMES: CoreRoleName[] = ["etudiant", "enseignant", "admin"];

export const RBAC_ROLE_CATALOG: RoleCatalogEntry[] = [
  {
    name: "etudiant",
    label: "Student",
    description: "Core student role assigned at registration.",
    core: true,
    track: "student",
  },
  {
    name: "enseignant",
    label: "Teacher",
    description: "Core teacher role assigned at registration.",
    core: true,
    track: "teacher",
  },
  {
    name: "admin",
    label: "Admin",
    description: "Core administrator role assigned at registration.",
    core: true,
    track: "admin",
  },
];

const ROLE_ALIAS_MAP: Record<string, string> = {
  student: "etudiant",
  etudiant: "etudiant",
  etudiante: "etudiant",
  teacher: "enseignant",
  enseignant: "enseignant",
  enseignante: "enseignant",
  admin: "admin",
};

const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  etudiant: [
    "announcements:view",
    "announcements:download",
    "reclamations:create:self",
    "reclamations:view:self",
    "reclamations:track:self",
    "justifications:view:self",
    "documents:view:self",
    "documents:download:self",
    "profile:manage:self",
    "password:change:self",
  ],
  enseignant: [
    "announcements:manage:course",
    "documents:manage:course",
    "reclamations:view:course",
    "reclamations:respond:course",
    "reclamations:update-status:course",
    "students:view:course",
    "profile:manage:self",
    "password:change:self",
  ],
  admin: [
    "users:manage",
    "roles:assign",
    "roles:view",
    "announcements:manage:global",
    "reclamations:manage:global",
    "reports:view:global",
    "departments:manage",
    "specialites:manage",
  ],
};

const PERMISSION_DEFINITIONS: PermissionCatalogEntry[] = Array.from(
  new Set(Object.values(ROLE_PERMISSION_MATRIX).flat())
)
  .sort()
  .map((code) => {
    const [modulePart, actionPart] = code.split(":", 2);
    return {
      code,
      description: `Permission ${code}`,
      module: modulePart || "general",
      action: actionPart || "access",
    };
  });

const ROLE_BY_NAME = new Map(RBAC_ROLE_CATALOG.map((entry) => [entry.name, entry]));

let ensureCatalogPromise: Promise<void> | null = null;
let catalogInitialized = false;

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

export const normalizeRoleNames = (roleNames: string[]): { normalized: string[]; invalid: string[] } => {
  const normalized: string[] = [];
  const invalid: string[] = [];

  roleNames.forEach((rawRole) => {
    const key = String(rawRole || "").trim().toLowerCase();
    if (!key) {
      return;
    }

    const mapped = ROLE_ALIAS_MAP[key] || key;
    if (!ROLE_BY_NAME.has(mapped)) {
      invalid.push(rawRole);
      return;
    }

    normalized.push(mapped);
  });

  return {
    normalized: uniqueStrings(normalized),
    invalid: uniqueStrings(invalid),
  };
};

export const resolveRoleProfile = (roleNames: string[]): RoleProfile => {
  const { normalized } = normalizeRoleNames(roleNames);
  const unknownRoles = normalized.filter((roleName) => !ROLE_BY_NAME.has(roleName));
  const coreRole =
    CORE_ROLE_NAMES.find((roleName) => normalized.includes(roleName)) || null;

  const extensionRoles = normalized.filter((roleName) => {
    const role = ROLE_BY_NAME.get(roleName);
    return Boolean(role && !role.core);
  });

  const track = coreRole ? ROLE_BY_NAME.get(coreRole)?.track || null : null;

  return {
    normalizedRoles: normalized,
    coreRole,
    extensionRoles,
    unknownRoles,
    track,
  };
};

export const validateRoleCombination = (
  roleNames: string[],
  options: ValidateRoleOptions
): { valid: boolean; error?: string; normalized?: string[] } => {
  const { normalized, invalid } = normalizeRoleNames(roleNames);

  if (invalid.length > 0) {
    return {
      valid: false,
      error: `Invalid role(s): ${invalid.join(", ")}`,
    };
  }

  if (!normalized.length) {
    return {
      valid: false,
      error: "At least one role is required.",
    };
  }

  const selectedCoreRoles = normalized.filter((roleName) => CORE_ROLE_NAMES.includes(roleName as CoreRoleName));

  if (options.requireSingleCore) {
    if (selectedCoreRoles.length !== 1 || normalized.length !== 1) {
      return {
        valid: false,
        error: "Registration requires exactly one core role: student, teacher, or admin.",
      };
    }

    return {
      valid: true,
      normalized,
    };
  }

  if (selectedCoreRoles.length !== 1) {
    return {
      valid: false,
      error: "A valid role set must contain exactly one core role (student, teacher, or admin).",
    };
  }

  const selectedCoreRole = selectedCoreRoles[0] as CoreRoleName;

  const incompatibleExtensions = normalized.filter((roleName) => {
    const role = ROLE_BY_NAME.get(roleName);
    if (!role || role.core || !role.extendsRole) {
      return false;
    }
    return role.extendsRole !== selectedCoreRole;
  });

  if (incompatibleExtensions.length > 0) {
    return {
      valid: false,
      error: `Incompatible extension role(s) for ${selectedCoreRole}: ${incompatibleExtensions.join(", ")}`,
    };
  }

  if (options.currentRoles?.length && !options.allowCoreChange) {
    const currentProfile = resolveRoleProfile(options.currentRoles);
    if (currentProfile.coreRole && currentProfile.coreRole !== selectedCoreRole) {
      return {
        valid: false,
        error: "Core role cannot be changed after registration. Only extension roles can be updated.",
      };
    }
  }

  return {
    valid: true,
    normalized,
  };
};

const getPermissionCodesForRoles = (roleNames: string[]): string[] => {
  const codes = roleNames.flatMap((roleName) => ROLE_PERMISSION_MATRIX[roleName] || []);
  return uniqueStrings(codes).sort();
};

export const ensureRbacCatalog = async (): Promise<void> => {
  if (catalogInitialized) {
    return;
  }

  if (ensureCatalogPromise) {
    return ensureCatalogPromise;
  }

  ensureCatalogPromise = (async () => {
    const roleIdByName = new Map<string, number>();
    for (const roleEntry of RBAC_ROLE_CATALOG) {
      let role = await prisma.role.findFirst({
        where: { nom: roleEntry.name },
        select: { id: true },
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            nom: roleEntry.name,
            description: roleEntry.description,
          },
          select: { id: true },
        });
      }

      roleIdByName.set(roleEntry.name, role.id);
    }

    const permissionIdByCode = new Map<string, number>();
    for (const permissionEntry of PERMISSION_DEFINITIONS) {
      let permission = await prisma.permission.findFirst({
        where: { nom: permissionEntry.code },
        select: { id: true },
      });

      if (!permission) {
        permission = await prisma.permission.create({
          data: {
            nom: permissionEntry.code,
            description: permissionEntry.description,
            module: permissionEntry.module,
            action: permissionEntry.action,
          },
          select: { id: true },
        });
      }

      permissionIdByCode.set(permissionEntry.code, permission.id);
    }

    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSION_MATRIX)) {
      const roleId = roleIdByName.get(roleName);
      if (!roleId) {
        continue;
      }

      const rows = permissions
        .map((permissionCode) => {
          const permissionId = permissionIdByCode.get(permissionCode);
          if (!permissionId) {
            return null;
          }

          return {
            roleId,
            permissionId,
          };
        })
        .filter((row): row is { roleId: number; permissionId: number } => Boolean(row));

      if (rows.length > 0) {
        await prisma.rolePermission.createMany({
          data: rows,
          skipDuplicates: true,
        });
      }
    }

    catalogInitialized = true;
  })();

  try {
    await ensureCatalogPromise;
  } finally {
    ensureCatalogPromise = null;
  }
};

export const getUserAuthorizations = async (userId: number): Promise<UserAuthorization> => {
  await ensureRbacCatalog();

  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: {
                  nom: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const roles = uniqueStrings(
    userRoles
      .map((entry) => entry.role.nom)
      .filter((value): value is string => Boolean(value))
  );

  const permissionSet = new Set<string>();
  userRoles.forEach((entry) => {
    entry.role.rolePermissions.forEach((rolePermission) => {
      if (rolePermission.permission.nom) {
        permissionSet.add(rolePermission.permission.nom);
      }
    });
  });

  if (permissionSet.size === 0) {
    getPermissionCodesForRoles(roles).forEach((permissionCode) => {
      permissionSet.add(permissionCode);
    });
  }

  const profile = resolveRoleProfile(roles);

  return {
    userId,
    roles: profile.normalizedRoles,
    coreRole: profile.coreRole,
    extensions: profile.extensionRoles,
    permissions: Array.from(permissionSet).sort(),
    track: profile.track,
  };
};

export const getRbacCatalog = () => {
  const roles = RBAC_ROLE_CATALOG.map((entry) => ({
    name: entry.name,
    label: entry.label,
    description: entry.description,
    core: entry.core,
    extendsRole: entry.extendsRole || null,
    track: entry.track,
    permissions: ROLE_PERMISSION_MATRIX[entry.name] || [],
  }));

  const permissions = PERMISSION_DEFINITIONS.map((entry) => ({
    code: entry.code,
    description: entry.description,
    module: entry.module,
    action: entry.action,
  }));

  return {
    roles,
    permissions,
  };
};

export const hasAnyRole = (roleNames: string[], requiredRoles: string[]): boolean => {
  const normalized = normalizeRoleNames(roleNames).normalized;
  return normalized.some((roleName) => requiredRoles.includes(roleName));
};

export const hasPermission = (permissions: string[], requiredPermission: string): boolean =>
  permissions.includes(requiredPermission);

export const hasAnyPermission = (permissions: string[], requiredPermissions: string[]): boolean =>
  requiredPermissions.some((permission) => permissions.includes(permission));
