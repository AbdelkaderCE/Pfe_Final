import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET, ACCESS_TOKEN_COOKIE_NAME } from "../config/auth";
import prisma from "../config/database";
import {
  CoreRoleName,
  getUserAuthorizations,
  hasAnyRole,
  hasAnyPermission,
  hasPermission,
} from "../shared/rbac.service";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    roles: string[];
    permissions: string[];
    coreRole: CoreRoleName | null;
    extensions: string[];
    firstUse: boolean;
  };
}

type UserRoleRecord = {
  role?: {
    nom: string | null;
  } | null;
};

const extractBearerToken = (authorizationHeader?: string): string | undefined => {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  const normalized = token.trim();
  return normalized || undefined;
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token =
      extractBearerToken(req.headers.authorization) ||
      req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as unknown as {
      sub: number;
      email: string;
      roles: string[];
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        status: true,
        emailVerified: true,
        firstUse: true,
        lockUntil: true,
        userRoles: {
          select: {
            role: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    // Temporary brute-force lockout (bypassed in development)
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev && user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: `Account temporarily locked due to failed login attempts. Try again in ${minutesLeft} minute(s).`,
        },
      });
      return;
    }

    if (user.status !== "active") {
      const message =
        user.status === "suspended"
          ? "Account has been suspended. Please contact an administrator."
          : "Account is inactive.";
      res.status(401).json({
        success: false,
        error: { code: "ACCOUNT_SUSPENDED", message },
      });
      return;
    }

    const currentRoles = user.userRoles
      .map((userRole: UserRoleRecord) => userRole.role?.nom)
      .filter((roleName): roleName is string => Boolean(roleName));

    const authorization = await getUserAuthorizations(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      roles: authorization.roles.length > 0 ? authorization.roles : currentRoles,
      permissions: authorization.permissions,
      coreRole: authorization.coreRole,
      extensions: authorization.extensions,
      firstUse: user.firstUse,
    };

    // Debug: Log authenticated user's roles
    if (process.env.DEBUG_RBAC) {
      console.log(`[AUTH] User authenticated:`, {
        userId: req.user.id,
        email: req.user.email,
        dbRoles: currentRoles,
        authorizedRoles: authorization.roles,
        finalRoles: req.user.roles,
        coreRole: authorization.coreRole,
      });
    }

    // Force password change on first use (like friend's mustChangePassword)
    // Allow API access while still flagging first use for UI
    if (user.firstUse) {
      const isChangingPassword =
        req.method === "POST" && req.originalUrl.includes("/change-password");
      const isLoggingOut = req.originalUrl.includes("/logout");
      const isGettingMe = req.method === "GET" && req.originalUrl.includes("/me");
      const isApiCall = req.originalUrl.startsWith("/api/");
      // For web UI: enforce password change; for API: allow with flag
      if (!isApiCall && !isChangingPassword && !isLoggingOut && !isGettingMe) {
        res.status(403).json({
          success: false,
          error: {
            code: "PASSWORD_CHANGE_REQUIRED",
            message: "You must change your password before accessing this resource.",
            requiresPasswordChange: true,
          },
        });
        return;
      }
    }

    next();
    return;
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    });
    return;
  }
};

/**
 * Attaches `req.user` when a valid token is present; otherwise leaves it undefined.
 * Never rejects the request — used by endpoints that support both guest and authenticated flows.
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token =
      extractBearerToken(req.headers.authorization) ||
      req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];

    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as unknown as {
      sub: number;
      email: string;
      roles: string[];
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        status: true,
        firstUse: true,
        userRoles: {
          select: { role: { select: { nom: true } } },
        },
      },
    });

    if (!user || user.status !== "active") {
      return next();
    }

    const currentRoles = user.userRoles
      .map((userRole: UserRoleRecord) => userRole.role?.nom)
      .filter((roleName): roleName is string => Boolean(roleName));

    const authorization = await getUserAuthorizations(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      roles: authorization.roles.length > 0 ? authorization.roles : currentRoles,
      permissions: authorization.permissions,
      coreRole: authorization.coreRole,
      extensions: authorization.extensions,
      firstUse: user.firstUse,
    };

    return next();
  } catch {
    return next();
  }
};

export const requireEmailVerified = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      res.status(403).json({
        success: false,
        error: { code: "EMAIL_NOT_VERIFIED", message: "Please verify your email first" },
      });
      return;
    }

    next();
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An error occurred while checking email verification" },
    });
    return;
  }
};

/**
 * Check that the authenticated user has at least one of the allowed roles.
 * Usage: requireRole(["admin", "enseignant"])
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
        return;
      }

      const hasRole = hasAnyRole(req.user.roles || [], allowedRoles);
      if (!hasRole) {
        // Detailed debug logging for RBAC mismatch
        console.error(`[RBAC 403] Access Denied:`, {
          user: {
            id: req.user.id,
            email: req.user.email,
            roles: req.user.roles,
            coreRole: req.user.coreRole,
          },
          required: {
            allowedRoles,
          },
          endpoint: req.originalUrl,
          method: req.method,
        });
        res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Insufficient permissions" },
        });
        return;
      }

      next();
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An error occurred while checking permissions" },
      });
      return;
    }
  };
};

/**
 * Alias helper to keep route intent explicit when at least one role is enough.
 */
export const requireAnyRole = (allowedRoles: string[]) => requireRole(allowedRoles);

/**
 * Require a single permission code.
 */
export const requirePermission = (permissionCode: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
        return;
      }

      if (!hasPermission(req.user.permissions || [], permissionCode)) {
        res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Permission denied" },
        });
        return;
      }

      next();
      return;
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An error occurred while checking permissions" },
      });
      return;
    }
  };
};

/**
 * Require at least one permission from the provided set.
 */
export const requireAnyPermission = (permissionCodes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
        return;
      }

      if (!hasAnyPermission(req.user.permissions || [], permissionCodes)) {
        res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Permission denied" },
        });
        return;
      }

      next();
      return;
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An error occurred while checking permissions" },
      });
      return;
    }
  };
};
