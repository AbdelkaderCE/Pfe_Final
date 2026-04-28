import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  register,
  login,
  refresh,
  logout,
  verifyEmailHandler,
  resendVerificationHandler,
  getMeHandler,
  changePasswordHandler,
  createUserByAdminHandler,
  importUsersByAdminExcelHandler,
  adminResetPasswordHandler,
  listAdminUsersHandler,
  exportAdminUsersPdfHandler,
  listRolesHandler,
  getAcademicManagementOptionsHandler,
  createSpecialiteManagementHandler,
  createPromoManagementHandler,
  createModuleManagementHandler,
  getAcademicAssignmentsHandler,
  assignStudentPromoHandler,
  assignTeacherModulesHandler,
  updateUserRolesByAdminHandler,
  updateUserStatusByAdminHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getRbacCatalogHandler,
  uploadProfilePhotoHandler,
  removeProfilePhotoHandler,
} from "./auth.controller";
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
} from "../../middlewares/rate-limit.middleware";
import { requireAnyPermission, requireAuth, requireRole } from "../../middlewares/auth.middleware";
import upload from "../../middlewares/upload.middleware";

const router = Router();

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if ([".xlsx", ".xls"].includes(extension)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
  },
});

// ==================== PUBLIC ROUTES ====================
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh-token", refreshLimiter, refresh);

// ==================== LOGOUT ====================
router.post("/logout", logout);

// ── Password reset (public — no auth required) ──────────────────
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

// ==================== EMAIL VERIFICATION ====================
router.get("/verify-email/:token", verifyEmailHandler);
router.post("/resend-verification", resendVerificationHandler);

// ==================== PROTECTED ROUTES (All authenticated users) ====================
router.get("/me", requireAuth, getMeHandler);
router.get("/rbac/catalog", requireAuth, getRbacCatalogHandler);
router.post("/change-password", requireAuth, changePasswordHandler);
router.post("/profile/photo", requireAuth, upload.single("photo"), uploadProfilePhotoHandler);
router.delete("/profile/photo", requireAuth, removeProfilePhotoHandler);

// ==================== ADMIN ROUTES (Using permissions) ====================

// Create user - requires 'users:create' permission
router.post(
  "/admin/create-user",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  createUserByAdminHandler
);

router.post(
  "/admin/import-users-excel",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  excelUpload.single("file"),
  importUsersByAdminExcelHandler
);

// Reset password - requires 'users:edit' permission
router.post(
  "/admin/reset-password/:userId",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  adminResetPasswordHandler
);

router.get(
  "/admin/users",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  listAdminUsersHandler
);

router.get(
  "/admin/users/export/pdf",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  exportAdminUsersPdfHandler
);

router.get(
  "/admin/roles",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["roles:view", "roles:assign"]),
  listRolesHandler
);

router.put(
  "/admin/users/:userId/roles",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["roles:assign"]),
  updateUserRolesByAdminHandler
);

router.put(
  "/admin/users/:userId/status",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  updateUserStatusByAdminHandler
);

router.get(
  "/admin/academic/options",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  getAcademicManagementOptionsHandler
);

router.post(
  "/admin/academic/specialites",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  createSpecialiteManagementHandler
);

router.post(
  "/admin/academic/promos",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  createPromoManagementHandler
);

router.post(
  "/admin/academic/modules",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  createModuleManagementHandler
);

router.get(
  "/admin/academic/assignments",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  getAcademicAssignmentsHandler
);

router.put(
  "/admin/academic/assignments/students/:userId",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  assignStudentPromoHandler
);

router.put(
  "/admin/academic/assignments/teachers/:userId",
  requireAuth,
  requireRole(["admin"]),
  requireAnyPermission(["users:manage"]),
  assignTeacherModulesHandler
);

export default router;
