import prisma from "../../config/database";
import {
  CategorieDocument,
  Prisma,
  StatusDocumentRequest,
} from "@prisma/client";
import logger from "../../utils/logger";
import { createDocumentRequestStatusAlert } from "../alerts/alerts.service";

export interface CreateDocumentTypeInput {
  nom: string;
  description?: string;
  categorie?: CategorieDocument;
}

export interface CreateDocumentInput {
  nom: string;
  typeId: number;
  url: string;
  size?: number;
  uploadedBy: number;
}

export interface CreateDocumentRequestInput {
  typeDocId: number;
  description?: string;
  enseignantId: number;
}

export const createDocumentType = async (input: CreateDocumentTypeInput) => {
  try {
    const type = await prisma.documentType.create({
      data: {
        nom_ar: input.nom,
        description_ar: input.description,
        categorie: input.categorie ?? CategorieDocument.autre,
      },
    });

    logger.info(`Document type created: ${type.id}`);
    return type;
  } catch (error) {
    logger.error("Error creating document type:", error);
    throw error;
  }
};

export const getDocumentTypes = async () => {
  try {
    return await prisma.documentType.findMany({
      orderBy: { nom_ar: "asc" },
    });
  } catch (error) {
    logger.error("Error fetching document types:", error);
    throw error;
  }
};

export const createDocument = async (input: CreateDocumentInput) => {
  try {
    const enseignant = await prisma.enseignant.findUnique({
      where: { userId: input.uploadedBy },
      select: { id: true },
    });

    if (!enseignant) {
      throw new Error("Uploader is not linked to an enseignant profile");
    }

    const request = await prisma.documentRequest.create({
      data: {
        enseignantId: enseignant.id,
        typeDocId: input.typeId,
        description_ar: input.nom,
        dateDemande: new Date(),
        documentUrl: input.url,
        status: StatusDocumentRequest.valide,
        traitePar: input.uploadedBy,
        dateTraitement: new Date(),
      },
      include: {
        typeDoc: true,
        enseignant: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
    });

    logger.info(`Document created as request: ${request.id}`);
    return request;
  } catch (error) {
    logger.error("Error creating document:", error);
    throw error;
  }
};

export const getDocuments = async (filters?: {
  typeId?: number;
  uploadedBy?: number;
}) => {
  try {
    const where: Prisma.DocumentRequestWhereInput = {
      documentUrl: { not: null },
    };

    if (filters?.typeId) where.typeDocId = filters.typeId;

    if (filters?.uploadedBy) {
      where.traitePar = filters.uploadedBy;
    }

    return await prisma.documentRequest.findMany({
      where,
      include: {
        typeDoc: true,
        enseignant: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
          },
        },
      },
      orderBy: { dateTraitement: "desc" },
    });
  } catch (error) {
    logger.error("Error fetching documents:", error);
    throw error;
  }
};

export const getDocumentById = async (id: number) => {
  try {
    const document = await prisma.documentRequest.findUnique({
      where: { id },
      include: {
        typeDoc: true,
        enseignant: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
          },
        },
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    return document;
  } catch (error) {
    logger.error("Error fetching document:", error);
    throw error;
  }
};

export const deleteDocument = async (id: number) => {
  try {
    const document = await prisma.documentRequest.delete({
      where: { id },
    });

    logger.info(`Document deleted: ${id}`);
    return document;
  } catch (error) {
    logger.error("Error deleting document:", error);
    throw error;
  }
};

export const createDocumentRequest = async (input: CreateDocumentRequestInput) => {
  try {
    const request = await prisma.documentRequest.create({
      data: {
        typeDocId: input.typeDocId,
        description_ar: input.description,
        enseignantId: input.enseignantId,
        dateDemande: new Date(),
        status: StatusDocumentRequest.en_attente,
      },
      include: {
        enseignant: {
          include: { user: true },
        },
        typeDoc: true,
      },
    });

    logger.info(`Document request created: ${request.id}`);
    return request;
  } catch (error) {
    logger.error("Error creating document request:", error);
    throw error;
  }
};

export const getDocumentRequests = async (filters?: {
  enseignantId?: number;
  status?: string;
}) => {
  try {
    const where: Prisma.DocumentRequestWhereInput = {};

    if (filters?.enseignantId) where.enseignantId = filters.enseignantId;

    if (filters?.status) {
      const allowed = Object.values(StatusDocumentRequest);
      if (allowed.includes(filters.status as StatusDocumentRequest)) {
        where.status = filters.status as StatusDocumentRequest;
      }
    }

    return await prisma.documentRequest.findMany({
      where,
      include: {
        enseignant: {
          include: {
            user: {
              select: { nom: true, prenom: true, email: true },
            },
          },
        },
        typeDoc: true,
      },
      orderBy: { dateDemande: "desc" },
    });
  } catch (error) {
    logger.error("Error fetching document requests:", error);
    throw error;
  }
};

export const submitDocumentRequest = async (
  requestId: number,
  documents: Array<{ nom: string; url: string; size?: number }>
) => {
  try {
    if (documents.length === 0) {
      throw new Error("At least one document is required");
    }

    const first = documents[0];

    const request = await prisma.documentRequest.update({
      where: { id: requestId },
      data: {
        documentUrl: first.url,
        status: StatusDocumentRequest.en_traitement,
      },
    });

    logger.info(`Document request submitted: ${requestId}`);
    return request;
  } catch (error) {
    logger.error("Error submitting document request:", error);
    throw error;
  }
};

export const approveDocumentRequest = async (
  requestId: number,
  approvedBy: number,
  feedback?: string
) => {
  try {
    const request = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentRequest.update({
        where: { id: requestId },
        data: {
          status: StatusDocumentRequest.valide,
          traitePar: approvedBy,
          dateTraitement: new Date(),
          description_ar: feedback,
        },
      });

      await createDocumentRequestStatusAlert(
        updated.id,
        { optionalMessage: feedback },
        tx
      );

      return updated;
    });

    logger.info(`Document request approved: ${requestId}`);
    return request;
  } catch (error) {
    logger.error("Error approving document request:", error);
    throw error;
  }
};

export const rejectDocumentRequest = async (
  requestId: number,
  rejectedBy: number,
  reason?: string
) => {
  try {
    const request = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentRequest.update({
        where: { id: requestId },
        data: {
          status: StatusDocumentRequest.refuse,
          traitePar: rejectedBy,
          dateTraitement: new Date(),
          description_ar: reason,
        },
      });

      await createDocumentRequestStatusAlert(
        updated.id,
        { optionalMessage: reason },
        tx
      );

      return updated;
    });

    logger.info(`Document request rejected: ${requestId}`);
    return request;
  } catch (error) {
    logger.error("Error rejecting document request:", error);
    throw error;
  }
};
