import { CategorieDocument, Prisma, StatusDocumentRequest } from "@prisma/client";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import prisma from "../../config/database";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  removeLocalUploadFile,
  resolvePublicUploadPath,
  toPublicUploadPath,
} from "../../shared/local-upload.service";
import { createDocumentRequestStatusAlert } from "../alerts/alerts.service";

// Helpers
const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const ADMIN_LIKE_ROLES = ["admin"];

const isAdminLike = (roles: string[] = []): boolean =>
  roles.some((role) => ADMIN_LIKE_ROLES.includes(String(role || "").toLowerCase()));

const getUserIdOr401 = (req: AuthRequest, res: Response): number | null => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
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
      code: "DOCUMENTS_API_ERROR",
      message,
    },
  });
};

const resolveEnseignantByUserId = async (userId: number): Promise<{ id: number } | null> =>
  prisma.enseignant.findUnique({ where: { userId }, select: { id: true } });

const deleteFileIfExists = (filePath: string): void => {
  const normalizedPublicPath = toPublicUploadPath(filePath) || filePath;
  removeLocalUploadFile(normalizedPublicPath);
};

type DocumentRequestWithRelations = Prisma.DocumentRequestGetPayload<{
  include: {
    typeDoc: {
      select: {
        nom_ar: true;
        nom_en: true;
        categorie: true;
      };
    };
    enseignant: {
      select: {
        userId: true;
        user: {
          select: {
            nom: true;
            prenom: true;
          };
        };
      };
    };
  };
}>;

// Normalize DocumentRequest shape for frontend consumption.
const normalizeRequest = (r: DocumentRequestWithRelations) => ({
  id: r.id,
  name: r.typeDoc?.nom_ar ?? r.typeDoc?.nom_en ?? "Document",
  category: r.typeDoc?.categorie ?? "autre",
  status: r.status,
  documentUrl: toPublicUploadPath(r.documentUrl || "") || r.documentUrl,
  description: r.description_ar ?? r.description_en ?? null,
  enseignantNom: r.enseignant?.user
    ? `${r.enseignant.user.prenom} ${r.enseignant.user.nom}`
    : null,
  updatedAt: (r.dateTraitement ?? r.dateDemande)?.toISOString().split("T")[0] ?? null,
});

export const getDocumentTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = "1", limit = "10" } = req.query;
    const pageNumber = parsePositiveInt(page) ?? 1;
    const pageSize = parsePositiveInt(limit) ?? 10;
    const where: Prisma.DocumentTypeWhereInput = {};

    if (
      typeof category === "string" &&
      Object.values(CategorieDocument).includes(category as CategorieDocument)
    ) {
      where.categorie = category as CategorieDocument;
    }

    if (typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { nom_ar: { contains: term, mode: "insensitive" } },
        { nom_en: { contains: term, mode: "insensitive" } },
      ];
    }

    const [documentTypes, total] = await Promise.all([
      prisma.documentType.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.documentType.count({ where }),
    ]);

    res.json({
      success: true,
      data: documentTypes,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    respondError(res, error, "Failed to fetch document types");
  }
};

// Keep backward compatibility with existing route import name.
export const getDocuments = getDocumentTypes;

export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const enseignant = await resolveEnseignantByUserId(userId);
    if (!enseignant) {
      res.status(400).json({
        success: false,
        error: { code: "NOT_ENSEIGNANT", message: "Profil enseignant introuvable" },
      });
      return;
    }

    const requests = await prisma.documentRequest.findMany({
      where: { enseignantId: enseignant.id },
      orderBy: { dateDemande: "desc" },
      include: {
        typeDoc: { select: { nom_ar: true, nom_en: true, categorie: true } },
        enseignant: { select: { userId: true, user: { select: { nom: true, prenom: true } } } },
      },
    });

    res.status(200).json({ success: true, data: requests.map(normalizeRequest) });
  } catch (error) {
    respondError(res, error, "Failed to fetch document requests");
  }
};

export const getAllRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const { status, search, page = "1", limit = "20" } = req.query;
    const pageNumber = parsePositiveInt(page) ?? 1;
    const pageSize = parsePositiveInt(limit) ?? 20;
    const where: Prisma.DocumentRequestWhereInput = {};

    if (
      typeof status === "string" &&
      Object.values(StatusDocumentRequest).includes(status as StatusDocumentRequest)
    ) {
      where.status = status as StatusDocumentRequest;
    }

    if (typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { typeDoc: { nom_ar: { contains: term, mode: "insensitive" } } },
        { typeDoc: { nom_en: { contains: term, mode: "insensitive" } } },
        { enseignant: { user: { nom: { contains: term, mode: "insensitive" } } } },
        { enseignant: { user: { prenom: { contains: term, mode: "insensitive" } } } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.documentRequest.findMany({
        where,
        orderBy: { dateDemande: "desc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          typeDoc: { select: { nom_ar: true, nom_en: true, categorie: true } },
          enseignant: { select: { userId: true, user: { select: { nom: true, prenom: true } } } },
        },
      }),
      prisma.documentRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: requests.map(normalizeRequest),
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    respondError(res, error, "Failed to fetch all requests");
  }
};

export const createDocumentType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nom, nom_en, categorie, description, description_en } = req.body as {
      nom?: string;
      nom_en?: string;
      categorie?: CategorieDocument;
      description?: string;
      description_en?: string;
    };

    if (!nom?.trim()) {
      res.status(400).json({ success: false, message: "nom est requis" });
      return;
    }

    if (!categorie || !Object.values(CategorieDocument).includes(categorie)) {
      res.status(400).json({ success: false, message: "categorie invalide" });
      return;
    }

    const docType = await prisma.documentType.create({
      data: {
        nom_ar: nom.trim(),
        nom_en: nom_en?.trim() || null,
        categorie,
        description_ar: description?.trim() || null,
        description_en: description_en?.trim() || description?.trim() || null,
      },
    });

    res.status(201).json({ success: true, data: docType });
  } catch (error) {
    respondError(res, error, "Failed to create document type");
  }
};

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const { typeDocId, description, description_en } = req.body as {
      typeDocId?: number | string;
      description?: string;
      description_en?: string;
    };

    const parsedTypeDocId = parsePositiveInt(typeDocId);
    if (!parsedTypeDocId) {
      res.status(400).json({ success: false, message: "typeDocId doit être un entier positif" });
      return;
    }

    const typeDoc = await prisma.documentType.findUnique({
      where: { id: parsedTypeDocId },
      select: { id: true },
    });

    if (!typeDoc) {
      res.status(404).json({ success: false, message: "Type de document introuvable" });
      return;
    }

    const enseignant = await resolveEnseignantByUserId(userId);
    if (!enseignant) {
      res.status(400).json({ success: false, message: "Profil enseignant introuvable" });
      return;
    }

    const duplicate = await prisma.documentRequest.findFirst({
      where: {
        enseignantId: enseignant.id,
        typeDocId: parsedTypeDocId,
        status: { in: [StatusDocumentRequest.en_attente, StatusDocumentRequest.en_traitement] },
      },
      select: { id: true },
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        message: "Une demande est déjà en cours pour ce type de document",
      });
      return;
    }

    const documentRequest = await prisma.documentRequest.create({
      data: {
        enseignantId: enseignant.id,
        typeDocId: parsedTypeDocId,
        description_ar: description?.trim() || null,
        description_en: description_en?.trim() || description?.trim() || null,
        dateDemande: new Date(),
      },
      include: { typeDoc: { select: { nom_ar: true, nom_en: true, categorie: true } } },
    });

    res.status(201).json({ success: true, data: documentRequest });
  } catch (error) {
    respondError(res, error, "Failed to create request");
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  let uploadedPublicPath: string | null = null;

  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "Fichier requis" });
      return;
    }

    uploadedPublicPath =
      toPublicUploadPath(req.file.path) || `/uploads/documents/${req.file.filename}`;

    const requestId = parsePositiveInt(req.body.requestId);
    if (!requestId) {
      deleteFileIfExists(uploadedPublicPath);
      res.status(400).json({ success: false, message: "requestId invalide" });
      return;
    }

    const existingRequest = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      select: { id: true, documentUrl: true, typeDoc: { select: { nom_en: true, nom_ar: true } } },
    });

    if (!existingRequest) {
      deleteFileIfExists(uploadedPublicPath);
      res.status(404).json({ success: false, message: "Demande introuvable" });
      return;
    }

    // Backend validation logic
    let profForm: Record<string, any> = {};
    if (req.body.profForm) {
      try {
        profForm = JSON.parse(req.body.profForm);
      } catch (e) {
        profForm = {};
      }
    }

    const docName = String(existingRequest.typeDoc?.nom_en || existingRequest.typeDoc?.nom_ar || "").toLowerCase();
    let requiredFields = ["prenom", "nom", "grade", "departement"];
    if ((docName.includes("scolarit") || docName.includes("certificat")) && !docName.includes("travail") && !docName.includes("عمل")) {
      requiredFields = ["prenom", "nom", "departement"];
    }

    for (const field of requiredFields) {
      if (!profForm[field] || String(profForm[field]).trim() === "") {
        deleteFileIfExists(uploadedPublicPath);
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: `${field} is required`,
          },
        });
        return;
      }
    }

    if (existingRequest.documentUrl) {
      deleteFileIfExists(existingRequest.documentUrl);
    }

    const updated = await prisma.documentRequest.update({
      where: { id: requestId },
      data: {
        documentUrl: uploadedPublicPath,
        status: StatusDocumentRequest.en_traitement,
        traitePar: userId,
        dateTraitement: new Date(),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (uploadedPublicPath) {
      deleteFileIfExists(uploadedPublicPath);
    }
    respondError(res, error, "Failed to upload document");
  }
};

export const validerDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "ID invalide" });
      return;
    }

    const { action, message } = req.body as {
      action?: "valide" | "refuse";
      message?: string;
    };
    if (!action || !["valide", "refuse"].includes(action)) {
      res.status(400).json({ success: false, message: "action doit être 'valide' ou 'refuse'" });
      return;
    }

    const existingRequest = await prisma.documentRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingRequest) {
      res.status(404).json({ success: false, message: "Demande introuvable" });
      return;
    }

    if (existingRequest.status !== StatusDocumentRequest.en_traitement) {
      res.status(400).json({
        success: false,
        message: "Seules les demandes 'en_traitement' peuvent être validées ou refusées",
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.documentRequest.update({
        where: { id },
        data: {
          status: action === "valide" ? StatusDocumentRequest.valide : StatusDocumentRequest.refuse,
          traitePar: userId,
          dateTraitement: new Date(),
        },
      });

      await createDocumentRequestStatusAlert(
        next.id,
        {
          optionalMessage: typeof message === "string" ? message : undefined,
        },
        tx
      );

      return next;
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    respondError(res, error, "Failed to validate document");
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "ID invalide" });
      return;
    }

    const documentRequest = await prisma.documentRequest.findUnique({
      where: { id },
      select: {
        documentUrl: true,
        status: true,
        enseignant: { select: { userId: true } },
      },
    });

    if (!documentRequest?.documentUrl) {
      res.status(404).json({ success: false, message: "Document introuvable" });
      return;
    }

    const isAdmin = isAdminLike(req.user?.roles ?? []);
    const isOwner = documentRequest.enseignant?.userId === userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: "Accès refusé" });
      return;
    }

    if (!isAdmin && documentRequest.status !== StatusDocumentRequest.valide) {
      res.status(403).json({ success: false, message: "Document non encore disponible" });
      return;
    }

    const filePath =
      resolvePublicUploadPath(documentRequest.documentUrl) ||
      (path.isAbsolute(documentRequest.documentUrl)
        ? documentRequest.documentUrl
        : path.join(process.cwd(), documentRequest.documentUrl));

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: "Fichier introuvable sur le serveur" });
      return;
    }

    res.download(filePath);
  } catch (error) {
    respondError(res, error, "Failed to download document");
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserIdOr401(req, res);
  if (!userId) {
    return;
  }

  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "ID invalide" });
      return;
    }

    const documentRequest = await prisma.documentRequest.findUnique({
      where: { id },
      select: {
        id: true,
        documentUrl: true,
        enseignant: { select: { userId: true } },
      },
    });

    if (!documentRequest) {
      res.status(404).json({ success: false, message: "Demande introuvable" });
      return;
    }

    const isAdmin = isAdminLike(req.user?.roles ?? []);
    const isOwner = documentRequest.enseignant?.userId === userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ success: false, message: "Action non autorisée" });
      return;
    }

    if (documentRequest.documentUrl) {
      deleteFileIfExists(documentRequest.documentUrl);
    }

    await prisma.documentRequest.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    respondError(res, error, "Failed to delete document");
  }
};
