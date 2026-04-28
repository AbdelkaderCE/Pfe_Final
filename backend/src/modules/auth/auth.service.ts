import prisma from "../../config/database";
import type { Niveau, Prisma } from "@prisma/client";
import {
  hashPassword,
  comparePasswords,
  isStrongPassword,
  generateRandomPassword,
} from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  generateRawToken,
} from "../../utils/tokens";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET } from "../../config/auth";
import {
  RBAC_ROLE_CATALOG,
  ensureRbacCatalog,
  getRbacCatalog,
  getUserAuthorizations,
  validateRoleCombination,
} from "../../shared/rbac.service";

// ── Interfaces ──────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  nom: string;
  prenom: string;
}

export interface UserPayload {
  sub: number;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    photo: string | null;
    roles: string[];
    coreRole: string | null;
    extensions: string[];
    permissions: string[];
    firstUse?: boolean;
  };
  accessToken: string;
  refreshToken: string;
  requiresPasswordChange: boolean;
}

export class AuthServiceError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
  }
}

type RoleNameRecord = { nom: string | null };
type UserRoleWithRoleName = { role: RoleNameRecord };
type RoleRecord = { id: number; nom: string | null; description: string | null };

type AdminListUserRecord = {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  photo: string | null;
  sexe: "H" | "F" | null;
  telephone: string | null;
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
  lastLogin: Date | null;
  userRoles: UserRoleWithRoleName[];
};

export type AdminUserPdfExportScope = "all" | "teachers" | "students";

// ── Helpers ─────────────────────────────────────────────────────

/** Fetch the role names for a given userId from user_roles + roles tables */
const getUserRoles = async (userId: number): Promise<string[]> => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur: UserRoleWithRoleName) => ur.role.nom ?? "unknown");
};

/** Build the JWT payload for a user */
const buildPayload = (user: { id: number; email: string }, roles: string[]): UserPayload => ({
  sub: user.id,
  email: user.email,
  roles,
});

const ASSIGNABLE_ROLE_NAMES = RBAC_ROLE_CATALOG.map((entry) => entry.name);

const validateCreateRoles = (roleNames: string[]): { valid: boolean; error?: string; normalized?: string[] } =>
  validateRoleCombination(roleNames, { requireSingleCore: true });

const validateAssignableRoles = (
  roleNames: string[],
  currentRoleNames?: string[]
): { valid: boolean; error?: string; normalized?: string[] } =>
  validateRoleCombination(roleNames, {
    requireSingleCore: false,
    currentRoles: currentRoleNames,
  });

// ── Register ────────────────────────────────────────────────────

export const registerUser = async (data: RegisterInput): Promise<LoginResponse> => {
  await ensureRbacCatalog();

  if (!isStrongPassword(data.password)) {
    throw new AuthServiceError(
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AuthServiceError("Email already exists");
  }

  const hashedPassword = await hashPassword(data.password);

  // Create user + assign default role "etudiant" in a transaction
  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nom: data.nom,
        prenom: data.prenom,
        firstUse: false,
      },
    });

    // The RBAC catalog bootstrap guarantees the default student role exists.
    const role = await tx.role.findFirst({ where: { nom: "etudiant" }, select: { id: true } });
    if (!role) {
      throw new AuthServiceError("Default role configuration is missing");
    }

    await tx.userRole.create({
      data: { userId: newUser.id, roleId: role.id },
    });

    return newUser;
  });

  const authorization = await getUserAuthorizations(user.id);

  // Email verification token (stored on the user row itself)
  const rawToken = generateRawToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashToken(rawToken),
      resetTokenExpire: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
    },
  });

  console.log(`📧 Verification link: ${process.env.APP_BASE_URL}/api/v1/auth/verify-email/${rawToken}`);

  // Generate JWT tokens
  const payload = buildPayload(user, authorization.roles);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      photo: null,
      roles: authorization.roles,
      coreRole: authorization.coreRole,
      extensions: authorization.extensions,
      permissions: authorization.permissions,
    },
    accessToken,
    refreshToken,
    requiresPasswordChange: false,
  };
};

// ── Login ───────────────────────────────────────────────────────

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const isDev = process.env.NODE_ENV !== "production";

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthServiceError("Invalid email or password");
  }

  // Temporary brute-force lockout check (bypassed in development)
  if (!isDev && user.lockUntil && user.lockUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new AuthServiceError(
      `Account temporarily locked due to failed login attempts. Try again in ${minutesLeft} minute(s).`,
      "ACCOUNT_LOCKED"
    );
  }

  // Manual suspension / inactive — separate from brute-force lockout
  if (user.status !== "active") {
    const message =
      user.status === "suspended"
        ? "Account has been suspended. Please contact an administrator."
        : "Account is inactive.";
    throw new AuthServiceError(message);
  }

  // Verify password
  const isValidPassword = await comparePasswords(password, user.password);

  if (!isValidPassword) {
    const attempts = user.loginAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: attempts,
        // Temporary lock — never permanently suspend via brute force
        ...(attempts >= LOCK_THRESHOLD && {
          lockUntil: new Date(Date.now() + LOCK_DURATION_MS),
        }),
      },
    });
    throw new AuthServiceError("Invalid email or password");
  }

  // Successful login — clear lock state
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
    },
  });

  const authorization = await getUserAuthorizations(user.id);

  const payload = buildPayload(user, authorization.roles);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      photo: user.photo,
      roles: authorization.roles,
      coreRole: authorization.coreRole,
      extensions: authorization.extensions,
      permissions: authorization.permissions,
      firstUse: user.firstUse,
    },
    accessToken,
    refreshToken,
    requiresPasswordChange: user.firstUse,
  };
};

// ── Change password ─────────────────────────────────────────────

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AuthServiceError("User not found");
  }

  const isValid = await comparePasswords(currentPassword, user.password);
  if (!isValid) {
    throw new AuthServiceError("Current password is incorrect");
  }

  if (!isStrongPassword(newPassword)) {
    throw new AuthServiceError(
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      firstUse: false,
    },
  });
};

// ── Create user by admin ────────────────────────────────────────

export const createUserByAdmin = async (data: {
  email: string;
  nom: string;
  prenom: string;
  roleName?: string;
  roleNames?: string[];
  sexe?: "H" | "F";
  telephone?: string;
  promoId?: number;
  specialiteId?: number;
  moduleIds?: number[];
  anneeUniversitaire?: string;
}): Promise<{
  user: { id: number; email: string; nom: string; prenom: string; roles: string[] };
  tempPassword: string;
}> => {
  await ensureRbacCatalog();

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AuthServiceError("User with this email already exists");
  }

  const tempPassword = generateRandomPassword(12);
  const hashedPassword = await hashPassword(tempPassword);

  const requestedRoleNames = Array.from(
    new Set(
      (data.roleNames?.length ? data.roleNames : (data.roleName ? [data.roleName] : []))
        .map((role) => role?.trim())
        .filter((role): role is string => !!role)
    )
  );

  const roleValidation = validateCreateRoles(requestedRoleNames);
  if (!roleValidation.valid) {
    throw new AuthServiceError(roleValidation.error || "Invalid role combination");
  }
  const normalizedCreateRoles = roleValidation.normalized || [];

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nom: data.nom,
        prenom: data.prenom,
        sexe: data.sexe as any,
        telephone: data.telephone,
        firstUse: true, // force password change on first login
      },
    });

    const roles = await tx.role.findMany({ where: { nom: { in: normalizedCreateRoles } } });
    if (roles.length !== normalizedCreateRoles.length) {
      const found = new Set(roles.map((role: RoleNameRecord) => role.nom).filter((name: string | null): name is string => !!name));
      const missing = normalizedCreateRoles.filter((name) => !found.has(name));
      throw new AuthServiceError(`Role(s) not found: ${missing.join(", ")}`);
    }

    await tx.userRole.createMany({
      data: roles.map((role: { id: number }) => ({ userId: newUser.id, roleId: role.id })),
      skipDuplicates: true,
    });

    const baseRole = normalizedCreateRoles[0];

    if (baseRole === "etudiant") {
      let resolvedPromoId: number | null = null;
      if (Number.isInteger(data.promoId) && (data.promoId as number) > 0) {
        const promo = await tx.promo.findUnique({ where: { id: data.promoId as number }, select: { id: true } });
        if (!promo) {
          throw new AuthServiceError("Selected promo was not found");
        }
        resolvedPromoId = promo.id;
      }

      await tx.etudiant.create({
        data: {
          userId: newUser.id,
          promoId: resolvedPromoId,
          anneeInscription: new Date().getFullYear(),
          // Matricule is NOT NULL since the academic-year migration. Admin
          // can overwrite this placeholder later via the student-update flow.
          matricule: `TMP-${newUser.id}`,
        },
      });
    }

    if (baseRole === "enseignant") {
      const enseignant = await tx.enseignant.create({
        data: {
          userId: newUser.id,
        },
      });

      const normalizedModuleIds = Array.from(
        new Set(
          (Array.isArray(data.moduleIds) ? data.moduleIds : [])
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        )
      );

      if (normalizedModuleIds.length > 0) {
        const modules = await tx.module.findMany({
          where: { id: { in: normalizedModuleIds } },
          select: { id: true, specialiteId: true },
        });

        if (modules.length !== normalizedModuleIds.length) {
          throw new AuthServiceError("One or more selected modules were not found");
        }

        if (Number.isInteger(data.specialiteId) && (data.specialiteId as number) > 0) {
          const invalidSpecialiteModules = modules.filter((module) => module.specialiteId !== data.specialiteId);
          if (invalidSpecialiteModules.length > 0) {
            throw new AuthServiceError("Selected modules must belong to the selected specialite");
          }
        }

        await tx.enseignement.createMany({
          data: modules.map((module) => ({
            enseignantId: enseignant.id,
            moduleId: module.id,
            anneeUniversitaire: data.anneeUniversitaire?.trim() || undefined,
          })),
          skipDuplicates: true,
        });
      }
    }

    return newUser;
  });

  const roles = await getUserRoles(result.id);

  return {
    user: {
      id: result.id,
      email: result.email,
      nom: result.nom,
      prenom: result.prenom,
      roles,
    },
    tempPassword,
  };
};

export const getAcademicManagementOptions = async (): Promise<{
  specialites: Array<{ id: number; nom: string; niveau: string | null }>;
  promos: Array<{ id: number; nom: string | null; section: string | null; anneeUniversitaire: string | null; specialiteId: number | null; specialiteNom: string | null }>;
  modules: Array<{ id: number; nom: string; code: string; semestre: number | null; specialiteId: number; specialiteNom: string | null }>;
}> => {
  const [specialites, promos, modules] = await Promise.all([
    prisma.specialite.findMany({
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        niveau: true,
      },
      orderBy: { nom_ar: "asc" },
    }),
    prisma.promo.findMany({
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        section: true,
        anneeUniversitaire: true,
        specialiteId: true,
        specialite: {
          select: { nom_ar: true, nom_en: true },
        },
      },
      orderBy: [{ anneeUniversitaire: "desc" }, { nom_ar: "asc" }],
    }),
    prisma.module.findMany({
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        code: true,
        semestre: true,
        specialiteId: true,
        specialite: {
          select: { nom_ar: true, nom_en: true },
        },
      },
      orderBy: [{ specialiteId: "asc" }, { semestre: "asc" }, { nom_ar: "asc" }],
    }),
  ]);

  return {
    specialites: specialites.map((item) => ({
      id: item.id,
      nom: item.nom_ar || item.nom_en || `Specialite ${item.id}`,
      niveau: item.niveau ?? null,
    })),
    promos: promos.map((item) => ({
      id: item.id,
      nom: item.nom_ar || item.nom_en,
      section: item.section,
      anneeUniversitaire: item.anneeUniversitaire,
      specialiteId: item.specialiteId,
      specialiteNom: item.specialite ? (item.specialite.nom_ar || item.specialite.nom_en) : null,
    })),
    modules: modules.map((item) => ({
      id: item.id,
      nom: item.nom_ar || item.nom_en || `Module ${item.id}`,
      code: item.code,
      semestre: item.semestre,
      specialiteId: item.specialiteId,
      specialiteNom: item.specialite ? (item.specialite.nom_ar || item.specialite.nom_en) : null,
    })),
  };
};

export const createSpecialiteForManagement = async (input: {
  nom: string;
  niveau?: string;
  filiereId?: number;
}) => {
  const nom = String(input.nom || "").trim();
  if (!nom) {
    throw new AuthServiceError("Specialite name is required");
  }

  const normalizedNiveau = String(input.niveau || "").trim().toUpperCase();
  const allowedNiveaux: Niveau[] = ["L1", "L2", "L3", "M1", "M2"];
  const niveau = normalizedNiveau && allowedNiveaux.includes(normalizedNiveau as Niveau)
    ? (normalizedNiveau as Niveau)
    : undefined;

  if (input.niveau && !niveau) {
    throw new AuthServiceError("Invalid niveau. Use one of: L1, L2, L3, M1, M2");
  }

  const created = await prisma.specialite.create({
    data: {
      nom_ar: nom,
      nom_en: null,
      niveau,
      filiereId: Number.isInteger(input.filiereId) && (input.filiereId as number) > 0
        ? input.filiereId
        : undefined,
    },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      niveau: true,
      filiereId: true,
    },
  });

  return {
    id: created.id,
    nom: created.nom_ar || created.nom_en || `Specialite ${created.id}`,
    niveau: created.niveau,
    filiereId: created.filiereId,
  };
};

export const createPromoForManagement = async (input: {
  nom?: string;
  section?: string;
  anneeUniversitaire?: string;
  specialiteId?: number;
}) => {
  const specialiteId = Number(input.specialiteId);
  if (!Number.isInteger(specialiteId) || specialiteId <= 0) {
    throw new AuthServiceError("specialiteId is required");
  }

  const specialite = await prisma.specialite.findUnique({ where: { id: specialiteId }, select: { id: true } });
  if (!specialite) {
    throw new AuthServiceError("Selected specialite was not found");
  }

  const created = await prisma.promo.create({
    data: {
      nom_ar: String(input.nom || "").trim() || undefined,
      nom_en: undefined,
      section: String(input.section || "").trim() || undefined,
      anneeUniversitaire: String(input.anneeUniversitaire || "").trim() || undefined,
      specialiteId,
    },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      section: true,
      anneeUniversitaire: true,
      specialiteId: true,
    },
  });

  return {
    id: created.id,
    nom: created.nom_ar || created.nom_en,
    section: created.section,
    anneeUniversitaire: created.anneeUniversitaire,
    specialiteId: created.specialiteId,
  };
};

export const createModuleForManagement = async (input: {
  nom: string;
  code: string;
  specialiteId: number;
  semestre?: number;
  credit?: number;
  coef?: number;
  volumeCours?: number;
  volumeTd?: number;
  volumeTp?: number;
}) => {
  const nom = String(input.nom || "").trim();
  const code = String(input.code || "").trim();
  const specialiteId = Number(input.specialiteId);

  if (!nom || !code || !Number.isInteger(specialiteId) || specialiteId <= 0) {
    throw new AuthServiceError("nom, code, and specialiteId are required");
  }

  const specialite = await prisma.specialite.findUnique({ where: { id: specialiteId }, select: { id: true } });
  if (!specialite) {
    throw new AuthServiceError("Selected specialite was not found");
  }

  const existingCode = await prisma.module.findUnique({ where: { code }, select: { id: true } });
  if (existingCode) {
    throw new AuthServiceError("Module code already exists");
  }

  const created = await prisma.module.create({
    data: {
      nom_ar: nom,
      nom_en: null,
      code,
      specialiteId,
      semestre: Number.isInteger(input.semestre) ? input.semestre : undefined,
      credit: Number.isInteger(input.credit) ? input.credit : undefined,
      coef: typeof input.coef === "number" ? input.coef : undefined,
      volumeCours: Number.isInteger(input.volumeCours) ? input.volumeCours : undefined,
      volumeTd: Number.isInteger(input.volumeTd) ? input.volumeTd : undefined,
      volumeTp: Number.isInteger(input.volumeTp) ? input.volumeTp : undefined,
    },
    select: {
      id: true,
      nom_ar: true,
      nom_en: true,
      code: true,
      specialiteId: true,
      semestre: true,
    },
  });

  return {
    id: created.id,
    nom: created.nom_ar || created.nom_en || `Module ${created.id}`,
    code: created.code,
    specialiteId: created.specialiteId,
    semestre: created.semestre,
  };
};

export const getAcademicAssignmentsData = async (): Promise<{
  promos: Array<{ id: number; nom: string | null; section: string | null; anneeUniversitaire: string | null; specialiteNom: string | null }>;
  modules: Array<{ id: number; nom: string; code: string; semestre: number | null; specialiteId: number; specialiteNom: string | null }>;
  students: Array<{ id: number; userId: number; nom: string; prenom: string; email: string; promoId: number | null; promoLabel: string | null }>;
  teachers: Array<{ id: number; userId: number; nom: string; prenom: string; email: string; moduleIds: number[]; promoIds: number[]; anneeUniversitaire: string | null }>;
}> => {
  const [promos, modules, students, teacherUsers] = await Promise.all([
    prisma.promo.findMany({
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        section: true,
        anneeUniversitaire: true,
        specialite: { select: { nom_ar: true, nom_en: true } },
      },
      orderBy: [{ anneeUniversitaire: "desc" }, { nom_ar: "asc" }],
    }),
    prisma.module.findMany({
      select: {
        id: true,
        nom_ar: true,
        nom_en: true,
        code: true,
        semestre: true,
        specialiteId: true,
        specialite: { select: { nom_ar: true, nom_en: true } },
      },
      orderBy: [{ specialiteId: "asc" }, { semestre: "asc" }, { nom_ar: "asc" }],
    }),
    prisma.etudiant.findMany({
      select: {
        id: true,
        userId: true,
        promoId: true,
        user: { select: { nom: true, prenom: true, email: true } },
        promo: { select: { nom_ar: true, nom_en: true, section: true, anneeUniversitaire: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              OR: [
                { nom: { equals: "enseignant", mode: "insensitive" } },
                { nom: { equals: "teacher", mode: "insensitive" } },
              ],
            },
          },
        },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        enseignant: {
          select: {
            id: true,
            enseignements: {
              select: {
                moduleId: true,
                promoId: true,
                anneeUniversitaire: true,
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    }),
  ]);

  return {
    promos: promos.map((promo) => ({
      id: promo.id,
      nom: promo.nom_ar || promo.nom_en,
      section: promo.section,
      anneeUniversitaire: promo.anneeUniversitaire,
      specialiteNom: promo.specialite ? (promo.specialite.nom_ar || promo.specialite.nom_en) : null,
    })),
    modules: modules.map((module) => ({
      id: module.id,
      nom: module.nom_ar || module.nom_en || `Module ${module.id}`,
      code: module.code,
      semestre: module.semestre,
      specialiteId: module.specialiteId,
      specialiteNom: module.specialite ? (module.specialite.nom_ar || module.specialite.nom_en) : null,
    })),
    students: students.map((student) => ({
      id: student.id,
      userId: student.userId,
      nom: student.user.nom,
      prenom: student.user.prenom,
      email: student.user.email,
      promoId: student.promoId,
      promoLabel: student.promo
        ? `${student.promo.nom_ar || student.promo.nom_en || `Promo ${student.promoId}`} | ${student.promo.section || "-"} | ${student.promo.anneeUniversitaire || "-"}`
        : null,
    })),
    teachers: teacherUsers.map((teacherUser) => {
      const enseignements = teacherUser.enseignant?.enseignements || [];

      return {
        // Keep a numeric identifier for compatibility; userId is the source of truth for updates.
        id: teacherUser.enseignant?.id || teacherUser.id,
        userId: teacherUser.id,
        nom: teacherUser.nom,
        prenom: teacherUser.prenom,
        email: teacherUser.email,
        moduleIds: Array.from(new Set(enseignements.map((item: any) => item.moduleId).filter((value: any): value is number => Number.isInteger(value)))),
        promoIds: Array.from(new Set(enseignements.map((item: any) => item.promoId).filter((value: any): value is number => Number.isInteger(value)))),
        anneeUniversitaire: enseignements.find((item: any) => !!item.anneeUniversitaire)?.anneeUniversitaire || null,
      };
    }),
  };
};

export const assignStudentPromoByAdmin = async (
  requesterUserId: number,
  targetUserId: number,
  promoId: number
) => {
  if (!requesterUserId) {
    throw new AuthServiceError("Unauthorized request");
  }

  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw new AuthServiceError("Invalid target user id");
  }

  if (!Number.isInteger(promoId) || promoId <= 0) {
    throw new AuthServiceError("Valid promoId is required");
  }

  const [targetUser, promo] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true, nom: true, prenom: true } }),
    prisma.promo.findUnique({ where: { id: promoId }, select: { id: true } }),
  ]);

  if (!targetUser) {
    throw new AuthServiceError("Target user not found");
  }
  if (!promo) {
    throw new AuthServiceError("Selected promo not found");
  }

  const updated = await prisma.etudiant.upsert({
    where: { userId: targetUserId },
    update: { promoId },
    create: {
      userId: targetUserId,
      promoId,
      anneeInscription: new Date().getFullYear(),
      // Matricule is NOT NULL since the academic-year migration; placeholder
      // for first-touch creation, overwritten later via student-update flow.
      matricule: `TMP-${targetUserId}`,
    },
    select: {
      id: true,
      promoId: true,
    },
  });

  return {
    userId: targetUserId,
    etudiantId: updated.id,
    promoId: updated.promoId,
  };
};

export const assignTeacherModulesByAdmin = async (
  requesterUserId: number,
  targetUserId: number,
  input: {
    moduleIds: number[];
    promoId?: number;
    anneeUniversitaire?: string;
  }
) => {
  if (!requesterUserId) {
    throw new AuthServiceError("Unauthorized request");
  }

  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw new AuthServiceError("Invalid target user id");
  }

  const normalizedModuleIds = Array.from(
    new Set(
      (Array.isArray(input.moduleIds) ? input.moduleIds : [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (normalizedModuleIds.length === 0) {
    throw new AuthServiceError("Select at least one module");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!targetUser) {
    throw new AuthServiceError("Target user not found");
  }

  const modules = await prisma.module.findMany({ where: { id: { in: normalizedModuleIds } }, select: { id: true } });
  if (modules.length !== normalizedModuleIds.length) {
    throw new AuthServiceError("One or more selected modules were not found");
  }

  let promoId: number | undefined;
  if (Number.isInteger(input.promoId) && (input.promoId as number) > 0) {
    const promo = await prisma.promo.findUnique({ where: { id: input.promoId as number }, select: { id: true } });
    if (!promo) {
      throw new AuthServiceError("Selected promo not found");
    }
    promoId = promo.id;
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const enseignant = await tx.enseignant.upsert({
      where: { userId: targetUserId },
      update: {},
      create: { userId: targetUserId },
      select: { id: true },
    });

    await tx.enseignement.deleteMany({ where: { enseignantId: enseignant.id } });

    await tx.enseignement.createMany({
      data: normalizedModuleIds.map((moduleId) => ({
        enseignantId: enseignant.id,
        moduleId,
        promoId,
        anneeUniversitaire: input.anneeUniversitaire?.trim() || undefined,
      })),
    });

    return enseignant;
  });

  return {
    userId: targetUserId,
    enseignantId: result.id,
    moduleIds: normalizedModuleIds,
    promoId: promoId ?? null,
    anneeUniversitaire: input.anneeUniversitaire?.trim() || null,
  };
};

export const listRolesForAdmin = async (): Promise<Array<{ id: number; nom: string; description: string | null }>> => {
  await ensureRbacCatalog();

  const roles = await prisma.role.findMany({
    where: {
      nom: {
        in: ASSIGNABLE_ROLE_NAMES,
      },
    },
    select: {
      id: true,
      nom: true,
      description: true,
    },
    orderBy: { nom: "asc" },
  });

  return roles.map((role: RoleRecord) => ({
    id: role.id,
    nom: role.nom ?? "unknown",
    description: role.description,
  }));
};

export const getRbacCatalogForClient = async () => {
  await ensureRbacCatalog();
  return getRbacCatalog();
};

export const listUsersForAdmin = async (): Promise<Array<{
  id: number;
  email: string;
  nom: string;
  prenom: string;
  photo: string | null;
  sexe: "H" | "F" | null;
  telephone: string | null;
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
  lastLogin: Date | null;
  roles: string[];
}>> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      photo: true,
      sexe: true,
      telephone: true,
      status: true,
      createdAt: true,
      lastLogin: true,
      userRoles: {
        include: {
          role: {
            select: {
              nom: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user: AdminListUserRecord) => ({
    ...user,
    roles: user.userRoles
      .map((userRole: UserRoleWithRoleName) => userRole.role.nom)
      .filter((name: string | null): name is string => !!name),
  }));
};

export const listUsersForAdminPdfExport = async (
  scope: AdminUserPdfExportScope
): Promise<Array<{ id: number; fullName: string; department: string }>> => {
  const roleNameFilter =
    scope === "teachers" ? "enseignant" : scope === "students" ? "etudiant" : null;

  const users = await prisma.user.findMany({
    where: roleNameFilter
      ? {
          userRoles: {
            some: {
              role: {
                nom: roleNameFilter,
              },
            },
          },
        }
      : undefined,
    select: {
      id: true,
      nom: true,
      prenom: true,
      etudiant: {
        select: {
          promo: {
            select: {
              specialite: {
                select: {
                  filiere: {
                    select: {
                      departement: {
                        select: {
                          nom_en: true,
                          nom_ar: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      enseignant: {
        select: {
          enseignements: {
            orderBy: {
              id: "desc",
            },
            take: 1,
            select: {
              promo: {
                select: {
                  specialite: {
                    select: {
                      filiere: {
                        select: {
                          departement: {
                            select: {
                              nom_en: true,
                              nom_ar: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return users.map((user: any) => {
    const studentDepartment =
      user.etudiant?.promo?.specialite?.filiere?.departement?.nom_en ||
      user.etudiant?.promo?.specialite?.filiere?.departement?.nom_ar ||
      null;

    const teacherDepartment =
      user.enseignant?.enseignements[0]?.promo?.specialite?.filiere?.departement?.nom_en ||
      user.enseignant?.enseignements[0]?.promo?.specialite?.filiere?.departement?.nom_ar ||
      null;

    const fullName = `${user.prenom || ""} ${user.nom || ""}`.trim() || "Unnamed User";

    return {
      id: user.id,
      fullName,
      department: studentDepartment || teacherDepartment || "N/A",
    };
  });
};

export const updateUserRolesByAdmin = async (
  requesterUserId: number,
  targetUserId: number,
  roleNames: string[]
): Promise<{
  id: number;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
}> => {
  if (!requesterUserId) {
    throw new AuthServiceError("Unauthorized request");
  }

  await ensureRbacCatalog();

  const normalizedRoleNames = Array.from(
    new Set(
      roleNames
        .map((role) => role?.trim())
        .filter((role): role is string => !!role)
    )
  );

  const currentRoles = await getUserRoles(targetUserId);
  const roleValidation = validateAssignableRoles(normalizedRoleNames, currentRoles);
  if (!roleValidation.valid) {
    throw new AuthServiceError(roleValidation.error || "Invalid role combination");
  }

  const normalizedAssignableRoles = roleValidation.normalized || [];

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new AuthServiceError("User not found");
  }

  const roles = await prisma.role.findMany({ where: { nom: { in: normalizedAssignableRoles } } });
  if (roles.length !== normalizedAssignableRoles.length) {
    const found = new Set(roles.map((role: RoleNameRecord) => role.nom).filter((name: string | null): name is string => !!name));
    const missing = normalizedAssignableRoles.filter((name) => !found.has(name));
    throw new AuthServiceError(`Role(s) not found: ${missing.join(", ")}`);
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.userRole.deleteMany({ where: { userId: targetUserId } });
    await tx.userRole.createMany({
      data: roles.map((role: { id: number }) => ({ userId: targetUserId, roleId: role.id })),
      skipDuplicates: true,
    });
  });

  const updatedRoles = await getUserRoles(targetUserId);

  return {
    id: targetUser.id,
    email: targetUser.email,
    nom: targetUser.nom,
    prenom: targetUser.prenom,
    roles: updatedRoles,
  };
};

export const updateUserStatusByAdmin = async (
  requesterUserId: number,
  targetUserId: number,
  status: "active" | "inactive" | "suspended"
): Promise<{
  id: number;
  email: string;
  nom: string;
  prenom: string;
  status: "active" | "inactive" | "suspended";
  roles: string[];
}> => {
  if (!requesterUserId) {
    throw new AuthServiceError("Unauthorized request");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new AuthServiceError("User not found");
  }

  const nextStatus = ["active", "inactive", "suspended"].includes(status)
    ? status
    : null;
  if (!nextStatus) {
    throw new AuthServiceError("Invalid status value");
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: nextStatus },
  });

  const updatedRoles = await getUserRoles(targetUserId);

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    nom: updatedUser.nom,
    prenom: updatedUser.prenom,
    status: updatedUser.status,
    roles: updatedRoles,
  };
};

// ── Admin reset password ────────────────────────────────────────

export const adminResetPassword = async (
  requesterUserId: number,
  targetUserId: number
): Promise<string> => {
  if (!requesterUserId) {
    throw new AuthServiceError("Unauthorized request");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new AuthServiceError("User not found");
  }

  const tempPassword = generateRandomPassword(12);
  const hashedPassword = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      password: hashedPassword,
      firstUse: true, // force password change
    },
  });

  return tempPassword;
};

// ── Refresh tokens ──────────────────────────────────────────────

export const refreshTokens = async (
  oldRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET) as unknown as UserPayload;

    // Re-fetch roles in case they changed
    const authorization = await getUserAuthorizations(decoded.sub);

    const payload: UserPayload = {
      sub: decoded.sub,
      email: decoded.email,
      roles: authorization.roles,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return { accessToken, refreshToken };
  } catch {
    throw new AuthServiceError("Invalid refresh token");
  }
};

// ── Forgot / reset password (public token flow) ─────────────────

/**
 * Generates a password-reset token for the given email.
 * In production this token would be emailed; for now it is returned
 * in the response (development / intranet mode).
 * Returns the raw token, or empty string if the email is not found
 * (caller should still return 200 to prevent user enumeration).
 */
export const requestPasswordReset = async (email: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || user.status !== "active") {
    // Silently succeed to prevent user enumeration
    return "";
  }

  const rawToken = generateRawToken(); // 32-byte hex string
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: tokenHash,
      resetTokenExpire: expires,
    },
  });

  // In a production setup you would send an email here.
  console.log(
    `🔑 Password reset token for ${email}: ${rawToken}`
  );

  return rawToken;
};

/**
 * Validates the reset token and updates the user's password.
 */
export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
): Promise<void> => {
  const tokenHash = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpire: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthServiceError("Invalid or expired reset token");
  }

  if (!isStrongPassword(newPassword)) {
    throw new AuthServiceError(
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpire: null,
      firstUse: false,
    },
  });
};

// ── Logout ──────────────────────────────────────────────────────

export const logoutUser = async (_refreshToken: string): Promise<void> => {
  // With stateless JWT (no RefreshToken table) clearing the cookie is enough.
};

// ── Email verification ──────────────────────────────────────────

export const verifyEmail = async (token: string): Promise<void> => {
  const tokenHash = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpire: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthServiceError("Invalid or expired verification token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      resetToken: null,
      resetTokenExpire: null,
    },
  });
};

// ── Resend verification ─────────────────────────────────────────

export const resendVerification = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Silently succeed when email not found to prevent user enumeration.
  if (!user) return;

  if (user.emailVerified) {
    throw new AuthServiceError("Email already verified");
  }

  const rawToken = generateRawToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashToken(rawToken),
      resetTokenExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  console.log(`📧 New verification link: ${process.env.APP_BASE_URL}/api/v1/auth/verify-email/${rawToken}`);
};

// ── Get user by ID (for /me endpoint) ───────────────────────────

export const getUserById = async (userId: number) => {
  await ensureRbacCatalog();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      sexe: true,
      telephone: true,
      photo: true,
      emailVerified: true,
      firstUse: true,
      status: true,
      lastLogin: true,
      createdAt: true,
      userRoles: {
        include: { role: true },
      },
      etudiant: {
        include: {
          promo: {
            include: {
              specialite: {
                include: { filiere: true },
              },
            },
          },
        },
      },
      enseignant: {
        include: { grade: true },
      },
    },
  });

  if (!user) {
    throw new AuthServiceError("User not found");
  }

  const authorization = await getUserAuthorizations(user.id);

  // Disciplinary memberships: only meaningful for users who have an enseignant
  // profile. Used by the frontend to gate president-only UI per conseil.
  const memberships = user.enseignant
    ? await prisma.membreConseil.findMany({
        where: { enseignantId: user.enseignant.id },
        select: { conseilId: true, role: true },
      })
    : [];

  return {
    ...user,
    roles: authorization.roles,
    coreRole: authorization.coreRole,
    extensions: authorization.extensions,
    permissions: authorization.permissions,
    memberships,
  };
};

export const updateCurrentUserPhoto = async (
  userId: number,
  photo: string | null
): Promise<{ user: Awaited<ReturnType<typeof getUserById>>; previousPhoto: string | null }> => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      photo: true,
    },
  });

  if (!existingUser) {
    throw new AuthServiceError("User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      photo,
    },
  });

  const user = await getUserById(userId);

  return {
    user,
    previousPhoto: existingUser.photo,
  };
};
