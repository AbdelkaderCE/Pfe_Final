import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  chooseSpecialite,
  getMySpecialiteChoices,
  getOpenCampagnes,
  getSpecialiteOptions,
  getStudentDeadlines,
  getStudentDocuments,
  getStudentNotes,
  getStudentProfile,
  getStudentSpecialties,
} from "./student.service";
import {
  StudentPanelDocumentKind,
  StudentPanelServiceError,
  changeStudentPanelPassword,
  createStudentPanelReclamation,
  getStudentPanelAnnouncementDetails,
  getStudentPanelAnnouncementDocumentDownloadInfo,
  getStudentPanelDashboard,
  getStudentPanelDocumentDownloadInfo,
  getStudentPanelProfile,
  getStudentPanelReclamationDetails,
  getStudentPanelReclamationDocumentDownloadInfo,
  listStudentPanelAnnouncements,
  listStudentPanelDocuments,
  listStudentPanelReclamationTypes,
  listStudentPanelReclamations,
  updateStudentPanelProfile,
} from "./student-panel.service";

const parsePositiveInt = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

const getUserIdOr401 = (req: AuthRequest, res: Response): number | null => {
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

const respondError = (res: Response, error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : fallback;
  const statusCode = message.toLowerCase().includes("not found") ? 404 : 400;
  res.status(statusCode).json({
    success: false,
    error: {
      code: "STUDENT_API_ERROR",
      message,
    },
  });
};

const respondPanelError = (res: Response, error: unknown, fallbackCode: string) => {
  if (error instanceof StudentPanelServiceError) {
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

export const getStudentProfileHandler = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const data = await getStudentProfile(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondError(res, error, "Failed to fetch student profile");
  }
};

export const getStudentSpecialtiesHandler = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const data = await getStudentSpecialties(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondError(res, error, "Failed to fetch student specialties");
  }
};

export const getStudentDeadlinesHandler = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const data = await getStudentDeadlines(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondError(res, error, "Failed to fetch student deadlines");
  }
};

export const getStudentDocumentsHandler = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getStudentDocuments();
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondError(res, error, "Failed to fetch student documents");
  }
};

export const getStudentNotesHandler = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const data = await getStudentNotes(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondError(res, error, "Failed to fetch student notes");
  }
};

export const getSpecialiteOptionsHandler = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const campagnes = await getOpenCampagnes();
    const options = campagnes.length ? await getSpecialiteOptions(userId) : [];

    res.status(200).json({
      success: true,
      data: {
        options,
        campagnes,
      },
    });
  } catch (error) {
    respondError(res, error, "Failed to fetch specialite options");
  }
};

export const chooseSpecialiteHandler = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  const campagneId = Number(req.body?.campagneId);
  const specialiteIdsRaw = Array.isArray(req.body?.specialiteIds) ? req.body.specialiteIds : [];
  const specialiteIds = specialiteIdsRaw.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0);

  if (!Number.isInteger(campagneId) || campagneId <= 0) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "campagneId must be a positive integer" },
    });
    return;
  }

  if (!specialiteIds.length) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "specialiteIds must contain at least one id" },
    });
    return;
  }

  try {
    const data = await chooseSpecialite(userId, { campagneId, specialiteIds });
    res.status(200).json({ success: true, data, message: "Specialite choices saved successfully" });
  } catch (error) {
    respondError(res, error, "Failed to choose specialite");
  }
};

export const getMySpecialiteChoicesHandler = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const data = await getMySpecialiteChoices(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondError(res, error, "Failed to fetch student choices");
  }
};

export const getStudentPanelDashboardHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const data = await getStudentPanelDashboard(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_DASHBOARD_FAILED");
  }
};

export const listStudentPanelAnnouncementsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const result = await listStudentPanelAnnouncements(userId, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      moduleId: parsePositiveInt(req.query.moduleId),
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
      modules: result.modules,
      types: result.types,
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_LIST_ANNOUNCEMENTS_FAILED");
  }
};

export const getStudentPanelAnnouncementDetailsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const announcementId = parsePositiveInt(req.params.announcementId);
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

    const data = await getStudentPanelAnnouncementDetails(userId, announcementId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_ANNOUNCEMENT_DETAILS_FAILED");
  }
};

export const downloadStudentPanelAnnouncementDocumentHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const announcementId = parsePositiveInt(req.params.announcementId);
    const documentId = parsePositiveInt(req.params.documentId);

    if (!announcementId || !documentId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOWNLOAD_PARAMS",
          message: "Both announcementId and documentId must be valid integers",
        },
      });
      return;
    }

    const info = await getStudentPanelAnnouncementDocumentDownloadInfo(
      userId,
      announcementId,
      documentId
    );

    res.download(info.absolutePath, info.fileName, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: "STUDENT_PANEL_ANNOUNCEMENT_DOWNLOAD_FAILED",
            message: "Failed to download announcement document",
          },
        });
      }
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_ANNOUNCEMENT_DOWNLOAD_FAILED");
  }
};

export const listStudentPanelReclamationTypesHandler = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const data = await listStudentPanelReclamationTypes();
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_RECLAMATION_TYPES_FAILED");
  }
};

export const createStudentPanelReclamationHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const files = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];

    const data = await createStudentPanelReclamation(
      userId,
      {
        typeId: parsePositiveInt(req.body?.typeId),
        typeName: typeof req.body?.typeName === "string" ? req.body.typeName : undefined,
        title:
          typeof req.body?.title === "string"
            ? req.body.title
            : typeof req.body?.objet === "string"
              ? req.body.objet
              : "",
        description:
          typeof req.body?.description === "string"
            ? req.body.description
            : typeof req.body?.contenu === "string"
              ? req.body.contenu
              : "",
        priority: typeof req.body?.priority === "string" ? req.body.priority : undefined,
      },
      files
    );

    res.status(201).json({
      success: true,
      data,
      message: "Reclamation submitted successfully",
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_CREATE_RECLAMATION_FAILED");
  }
};

export const listStudentPanelReclamationsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const result = await listStudentPanelReclamations(userId, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
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
      types: result.types,
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_LIST_RECLAMATIONS_FAILED");
  }
};

export const getStudentPanelReclamationDetailsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
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

    const data = await getStudentPanelReclamationDetails(userId, reclamationId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_RECLAMATION_DETAILS_FAILED");
  }
};

export const downloadStudentPanelReclamationDocumentHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const reclamationId = parsePositiveInt(req.params.reclamationId);
    const documentId = parsePositiveInt(req.params.documentId);

    if (!reclamationId || !documentId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOWNLOAD_PARAMS",
          message: "Both reclamationId and documentId must be valid integers",
        },
      });
      return;
    }

    const info = await getStudentPanelReclamationDocumentDownloadInfo(
      userId,
      reclamationId,
      documentId
    );

    res.download(info.absolutePath, info.fileName, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: "STUDENT_PANEL_RECLAMATION_DOWNLOAD_FAILED",
            message: "Failed to download reclamation document",
          },
        });
      }
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_RECLAMATION_DOWNLOAD_FAILED");
  }
};

export const listStudentPanelDocumentsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const result = await listStudentPanelDocuments(userId, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      kind: typeof req.query.kind === "string" ? req.query.kind : undefined,
      page: parsePositiveInt(req.query.page),
      limit: parsePositiveInt(req.query.limit),
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_LIST_DOCUMENTS_FAILED");
  }
};

export const downloadStudentPanelDocumentHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const kindRaw = String(req.params.kind || "").trim().toLowerCase();
    const documentId = parsePositiveInt(req.params.id);

    if (!documentId || !["announcement", "reclamation"].includes(kindRaw)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DOWNLOAD_PARAMS",
          message: "Kind must be announcement or reclamation and id must be a valid integer",
        },
      });
      return;
    }

    const kind = kindRaw as StudentPanelDocumentKind;
    const info = await getStudentPanelDocumentDownloadInfo(userId, kind, documentId);

    res.download(info.absolutePath, info.fileName, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: "STUDENT_PANEL_DOCUMENT_DOWNLOAD_FAILED",
            message: "Failed to download document",
          },
        });
      }
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_DOCUMENT_DOWNLOAD_FAILED");
  }
};

export const getStudentPanelProfileHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const data = await getStudentPanelProfile(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_PROFILE_FETCH_FAILED");
  }
};

export const updateStudentPanelProfileHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const data = await updateStudentPanelProfile(userId, {
      email: typeof req.body?.email === "string" ? req.body.email : undefined,
      telephone: typeof req.body?.telephone === "string" ? req.body.telephone : undefined,
    });

    res.status(200).json({
      success: true,
      data,
      message: "Profile updated successfully",
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_PROFILE_UPDATE_FAILED");
  }
};

export const changeStudentPanelPasswordHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserIdOr401(req, res);
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

    const data = await changeStudentPanelPassword(userId, currentPassword, newPassword);
    res.status(200).json({
      success: true,
      data,
      message: "Password changed successfully",
    });
  } catch (error) {
    respondPanelError(res, error, "STUDENT_PANEL_PASSWORD_CHANGE_FAILED");
  }
};
