import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  TeacherServiceError,
  changeTeacherPassword,
  createTeacherAnnouncement,
  createTeacherDocument,
  deleteTeacherAnnouncement,
  deleteTeacherDocument,
  getTeacherDashboard,
  getTeacherDocumentDownloadInfo,
  getTeacherProfile,
  getTeacherStudentReclamationHistory,
  listTeacherAnnouncements,
  listTeacherDocuments,
  listTeacherReclamations,
  listTeacherStudents,
  updateTeacherAnnouncement,
  updateTeacherDocument,
  updateTeacherProfile,
  updateTeacherReclamation,
} from "./teacher.service";

const parsePositiveInt = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

const parseNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item > 0)
      )
    );
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseNumberArray(parsed);
    } catch (_error) {
      return [];
    }
  }

  return Array.from(
    new Set(
      trimmed
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );
};

const ensureUserId = (req: AuthRequest, res: Response): number | null => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return null;
  }

  return req.user.id;
};

const handleControllerError = (res: Response, error: unknown, fallbackCode: string) => {
  if (error instanceof TeacherServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    success: false,
    error: {
      code: fallbackCode,
      message,
    },
  });
};

export const getTeacherDashboardHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const data = await getTeacherDashboard(userId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_DASHBOARD_FAILED");
  }
};

export const listTeacherAnnouncementsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const result = await listTeacherAnnouncements(userId, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      moduleId: parsePositiveInt(req.query.moduleId),
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      typeId: parsePositiveInt(req.query.typeId),
      dateFrom: typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined,
      dateTo: typeof req.query.dateTo === "string" ? req.query.dateTo : undefined,
      page: parsePositiveInt(req.query.page),
      limit: parsePositiveInt(req.query.limit),
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      courses: result.courses,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_LIST_ANNOUNCEMENTS_FAILED");
  }
};

export const createTeacherAnnouncementHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const files = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];

    const moduleId = parsePositiveInt(req.body?.moduleId);
    if (!moduleId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_MODULE_ID",
          message: "A valid module id is required",
        },
      });
      return;
    }

    const created = await createTeacherAnnouncement(
      userId,
      {
        title: typeof req.body?.title === "string" ? req.body.title : "",
        description: typeof req.body?.description === "string" ? req.body.description : req.body?.content,
        typeName: typeof req.body?.typeName === "string" ? req.body.typeName : undefined,
        typeId: parsePositiveInt(req.body?.typeId),
        moduleId,
        status: typeof req.body?.status === "string" ? req.body.status : undefined,
        target: typeof req.body?.target === "string" ? req.body.target : undefined,
        priority: typeof req.body?.priority === "string" ? req.body.priority : undefined,
        scheduleAt: typeof req.body?.scheduleAt === "string" ? req.body.scheduleAt : undefined,
        expiresAt: typeof req.body?.expiresAt === "string" ? req.body.expiresAt : undefined,
      },
      files
    );

    res.status(201).json({
      success: true,
      data: created,
      message: "Announcement created successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_CREATE_ANNOUNCEMENT_FAILED");
  }
};

export const updateTeacherAnnouncementHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const announcementId = parsePositiveInt(req.params.id);
    if (!announcementId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ANNOUNCEMENT_ID",
          message: "A valid announcement id is required",
        },
      });
      return;
    }

    const files = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];

    const updated = await updateTeacherAnnouncement(
      userId,
      announcementId,
      {
        title: typeof req.body?.title === "string" ? req.body.title : undefined,
        description:
          typeof req.body?.description === "string" ? req.body.description : req.body?.content,
        typeName: typeof req.body?.typeName === "string" ? req.body.typeName : undefined,
        typeId: parsePositiveInt(req.body?.typeId),
        moduleId: req.body?.moduleId !== undefined ? parsePositiveInt(req.body?.moduleId) : undefined,
        status: typeof req.body?.status === "string" ? req.body.status : undefined,
        target: typeof req.body?.target === "string" ? req.body.target : undefined,
        priority: typeof req.body?.priority === "string" ? req.body.priority : undefined,
        scheduleAt: typeof req.body?.scheduleAt === "string" ? req.body.scheduleAt : undefined,
        expiresAt: typeof req.body?.expiresAt === "string" ? req.body.expiresAt : undefined,
        removeDocumentIds: parseNumberArray(req.body?.removeDocumentIds),
      },
      files
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: "Announcement updated successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_UPDATE_ANNOUNCEMENT_FAILED");
  }
};

export const deleteTeacherAnnouncementHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const announcementId = parsePositiveInt(req.params.id);
    if (!announcementId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ANNOUNCEMENT_ID",
          message: "A valid announcement id is required",
        },
      });
      return;
    }

    const deleted = await deleteTeacherAnnouncement(userId, announcementId);

    res.status(200).json({
      success: true,
      data: deleted,
      message: "Announcement deleted successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_DELETE_ANNOUNCEMENT_FAILED");
  }
};

export const listTeacherReclamationsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const result = await listTeacherReclamations(userId, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      moduleId: parsePositiveInt(req.query.moduleId),
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      dateFrom: typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined,
      dateTo: typeof req.query.dateTo === "string" ? req.query.dateTo : undefined,
      page: parsePositiveInt(req.query.page),
      limit: parsePositiveInt(req.query.limit),
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_LIST_RECLAMATIONS_FAILED");
  }
};

export const updateTeacherReclamationHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const reclamationId = parsePositiveInt(req.params.id);
    if (!reclamationId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RECLAMATION_ID",
          message: "A valid reclamation id is required",
        },
      });
      return;
    }

    const status = typeof req.body?.status === "string" ? req.body.status.trim().toLowerCase() : "";
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RECLAMATION_STATUS",
          message: "Status must be one of: pending, approved, rejected",
        },
      });
      return;
    }

    const updated = await updateTeacherReclamation(userId, reclamationId, {
      status: status as "pending" | "approved" | "rejected",
      response: typeof req.body?.response === "string" ? req.body.response : undefined,
      internalNote: typeof req.body?.internalNote === "string" ? req.body.internalNote : undefined,
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: "Reclamation updated successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_UPDATE_RECLAMATION_FAILED");
  }
};

export const listTeacherStudentsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const result = await listTeacherStudents(userId, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      moduleId: parsePositiveInt(req.query.moduleId),
      page: parsePositiveInt(req.query.page),
      limit: parsePositiveInt(req.query.limit),
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_LIST_STUDENTS_FAILED");
  }
};

export const getTeacherStudentReclamationHistoryHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const studentId = parsePositiveInt(req.params.studentId);
    if (!studentId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STUDENT_ID",
          message: "A valid student id is required",
        },
      });
      return;
    }

    const data = await getTeacherStudentReclamationHistory(userId, studentId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_STUDENT_HISTORY_FAILED");
  }
};

export const listTeacherDocumentsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const result = await listTeacherDocuments(userId, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      moduleId: parsePositiveInt(req.query.moduleId),
      announcementId: parsePositiveInt(req.query.announcementId),
      page: parsePositiveInt(req.query.page),
      limit: parsePositiveInt(req.query.limit),
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_LIST_DOCUMENTS_FAILED");
  }
};

export const createTeacherDocumentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const file = req.file as Express.Multer.File | undefined;
    const title = typeof req.body?.title === "string" ? req.body.title : "";

    const created = await createTeacherDocument(
      userId,
      {
        title,
        moduleId: parsePositiveInt(req.body?.moduleId),
        announcementId: parsePositiveInt(req.body?.announcementId),
      },
      file as Express.Multer.File
    );

    res.status(201).json({
      success: true,
      data: created,
      message: "Document uploaded successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_CREATE_DOCUMENT_FAILED");
  }
};

export const updateTeacherDocumentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const documentId = parsePositiveInt(req.params.id);
    if (!documentId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOCUMENT_ID",
          message: "A valid document id is required",
        },
      });
      return;
    }

    const updated = await updateTeacherDocument(
      userId,
      documentId,
      {
        title: typeof req.body?.title === "string" ? req.body.title : undefined,
        moduleId: req.body?.moduleId !== undefined ? parsePositiveInt(req.body?.moduleId) : undefined,
        announcementId:
          req.body?.announcementId !== undefined ? parsePositiveInt(req.body?.announcementId) : undefined,
      },
      req.file as Express.Multer.File | undefined
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: "Document updated successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_UPDATE_DOCUMENT_FAILED");
  }
};

export const deleteTeacherDocumentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const documentId = parsePositiveInt(req.params.id);
    if (!documentId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOCUMENT_ID",
          message: "A valid document id is required",
        },
      });
      return;
    }

    const deleted = await deleteTeacherDocument(userId, documentId);

    res.status(200).json({
      success: true,
      data: deleted,
      message: "Document deleted successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_DELETE_DOCUMENT_FAILED");
  }
};

export const downloadTeacherDocumentHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const documentId = parsePositiveInt(req.params.id);
    if (!documentId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOCUMENT_ID",
          message: "A valid document id is required",
        },
      });
      return;
    }

    const info = await getTeacherDocumentDownloadInfo(userId, documentId);

    res.download(info.absolutePath, info.fileName, (error) => {
      if (error) {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: "TEACHER_DOCUMENT_DOWNLOAD_FAILED",
              message: "Failed to download document",
            },
          });
        }
      }
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_DOCUMENT_DOWNLOAD_FAILED");
  }
};

export const getTeacherProfileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const profile = await getTeacherProfile(userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_PROFILE_FETCH_FAILED");
  }
};

export const updateTeacherProfileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const profile = await updateTeacherProfile(userId, {
      nom: typeof req.body?.nom === "string" ? req.body.nom : undefined,
      prenom: typeof req.body?.prenom === "string" ? req.body.prenom : undefined,
      email: typeof req.body?.email === "string" ? req.body.email : undefined,
      telephone: typeof req.body?.telephone === "string" ? req.body.telephone : undefined,
      bureau: typeof req.body?.bureau === "string" ? req.body.bureau : undefined,
    });

    res.status(200).json({
      success: true,
      data: profile,
      message: "Profile updated successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_PROFILE_UPDATE_FAILED");
  }
};

export const changeTeacherPasswordHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = ensureUserId(req, res);
    if (!userId) return;

    const currentPassword =
      typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PASSWORD_PAYLOAD",
          message: "Both currentPassword and newPassword are required",
        },
      });
      return;
    }

    const result = await changeTeacherPassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      data: result,
      message: "Password changed successfully",
    });
  } catch (error: unknown) {
    handleControllerError(res, error, "TEACHER_PASSWORD_CHANGE_FAILED");
  }
};
