import prisma from "../../config/database";
import { Prisma, StatusReclamation } from "@prisma/client";
import logger from "../../utils/logger";
import {
  EntityNotFoundError,
  StatusLockError,
  TERMINAL_STATUSES,
} from "../../shared/status-lock";

export interface CreateRequestInput {
  titre: string;
  description: string;
  typeRequest: string;
  documents?: string[];
  studentId?: number;
  submittedBy: number;
}

export interface UpdateRequestInput {
  titre?: string;
  description?: string;
  typeRequest?: string;
  status?: string;
  feedback?: string;
}

export interface ApproveRequestInput {
  requestId: number;
  approvedBy: number;
  feedback?: string;
}

export interface RejectRequestInput {
  requestId: number;
  rejectedBy: number;
  reason: string;
}

const mapStatus = (status?: string): StatusReclamation | undefined => {
  if (!status) return undefined;
  const value = status.toLowerCase();

  const mapping: Record<string, StatusReclamation> = {
    en_attente: StatusReclamation.en_attente,
    approuve: StatusReclamation.traitee,
    approuvé: StatusReclamation.traitee,
    rejete: StatusReclamation.refusee,
    rejeté: StatusReclamation.refusee,
    soumise: StatusReclamation.soumise,
    en_cours: StatusReclamation.en_cours,
    traitee: StatusReclamation.traitee,
    refusee: StatusReclamation.refusee,
  };

  return mapping[value];
};

const resolveEtudiantId = async (studentId: number | undefined, submittedBy: number): Promise<number> => {
  if (studentId) {
    return studentId;
  }

  const etudiant = await prisma.etudiant.findUnique({
    where: { userId: submittedBy },
    select: { id: true },
  });

  if (!etudiant) {
    throw new Error("Student profile not found for submitter");
  }

  return etudiant.id;
};

const resolveTypeId = async (typeRequest: string): Promise<number> => {
  const name = typeRequest.trim();
  const existing = await prisma.reclamationType.findFirst({
    where: {
      OR: [
        { nom_ar: { equals: name, mode: "insensitive" } },
        { nom_en: { equals: name, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.reclamationType.create({
    data: { nom_ar: name },
    select: { id: true },
  });

  return created.id;
};

export const createRequest = async (input: CreateRequestInput) => {
  try {
    const etudiantId = await resolveEtudiantId(input.studentId, input.submittedBy);
    const typeId = await resolveTypeId(input.typeRequest);

    const request = await prisma.reclamation.create({
      data: {
        objet_ar: input.titre,
        description_ar: input.description,
        etudiantId,
        typeId,
        status: StatusReclamation.soumise,
        dateReclamation: new Date(),
        reponse_ar: input.documents?.join("\n") || null,
      },
      include: {
        etudiant: {
          include: { user: true },
        },
        type: true,
        traiteParUser: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    logger.info(`Request created: ${request.id}`);
    return request;
  } catch (error) {
    logger.error("Error creating request:", error);
    throw error;
  }
};

export const getRequests = async (filters?: {
  typeRequest?: string;
  status?: string;
  studentId?: number;
  submittedBy?: number;
}) => {
  try {
    const where: Prisma.ReclamationWhereInput = {};

    if (filters?.studentId) where.etudiantId = filters.studentId;

    if (filters?.submittedBy) {
      const etudiant = await prisma.etudiant.findUnique({
        where: { userId: filters.submittedBy },
        select: { id: true },
      });
      where.etudiantId = etudiant?.id ?? -1;
    }

    if (filters?.typeRequest?.trim()) {
      where.type = {
        OR: [
          { nom_ar: { equals: filters.typeRequest.trim(), mode: "insensitive" } },
          { nom_en: { equals: filters.typeRequest.trim(), mode: "insensitive" } },
        ],
      };
    }

    const status = mapStatus(filters?.status);
    if (status) where.status = status;

    return await prisma.reclamation.findMany({
      where,
      include: {
        etudiant: {
          include: { user: true },
        },
        type: true,
        traiteParUser: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
      orderBy: { dateReclamation: "desc" },
    });
  } catch (error) {
    logger.error("Error fetching requests:", error);
    throw error;
  }
};

export const getRequestById = async (id: number) => {
  try {
    const request = await prisma.reclamation.findUnique({
      where: { id },
      include: {
        etudiant: {
          include: { user: true },
        },
        type: true,
        traiteParUser: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    return request;
  } catch (error) {
    logger.error("Error fetching request:", error);
    throw error;
  }
};

export const updateRequest = async (id: number, input: UpdateRequestInput) => {
  try {
    let typeId: number | undefined;
    if (input.typeRequest?.trim()) {
      typeId = await resolveTypeId(input.typeRequest);
    }

    const request = await prisma.reclamation.update({
      where: { id },
      data: {
        objet_ar: input.titre,
        description_ar: input.description,
        typeId,
        status: mapStatus(input.status),
        reponse_ar: input.feedback,
      },
      include: {
        etudiant: {
          include: { user: true },
        },
        type: true,
      },
    });

    logger.info(`Request updated: ${id}`);
    return request;
  } catch (error) {
    logger.error("Error updating request:", error);
    throw error;
  }
};

const decideReclamationLocked = async (
  requestId: number,
  data: Prisma.ReclamationUncheckedUpdateManyInput
) => {
  const result = await prisma.reclamation.updateMany({
    where: {
      id: requestId,
      status: { notIn: [...TERMINAL_STATUSES.reclamation] },
    },
    data,
  });

  if (result.count === 0) {
    const existing = await prisma.reclamation.findUnique({
      where: { id: requestId },
      select: { status: true },
    });
    if (!existing) {
      throw new EntityNotFoundError("reclamation", requestId);
    }
    throw new StatusLockError("reclamation", existing.status);
  }

  return prisma.reclamation.findUnique({
    where: { id: requestId },
    include: {
      etudiant: { include: { user: true } },
      type: true,
    },
  });
};

export const approveRequest = async (input: ApproveRequestInput) => {
  try {
    const request = await decideReclamationLocked(input.requestId, {
      status: StatusReclamation.traitee,
      traitePar: input.approvedBy,
      reponse_ar: input.feedback,
      dateTraitement: new Date(),
    });

    logger.info(`Request approved: ${input.requestId}`);
    return request;
  } catch (error) {
    if (error instanceof StatusLockError || error instanceof EntityNotFoundError) {
      throw error;
    }
    logger.error("Error approving request:", error);
    throw error;
  }
};

export const rejectRequest = async (input: RejectRequestInput) => {
  try {
    const request = await decideReclamationLocked(input.requestId, {
      status: StatusReclamation.refusee,
      traitePar: input.rejectedBy,
      reponse_ar: input.reason,
      dateTraitement: new Date(),
    });

    logger.info(`Request rejected: ${input.requestId}`);
    return request;
  } catch (error) {
    if (error instanceof StatusLockError || error instanceof EntityNotFoundError) {
      throw error;
    }
    logger.error("Error rejecting request:", error);
    throw error;
  }
};

export const getRequestStats = async () => {
  try {
    const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] =
      await Promise.all([
        prisma.reclamation.count(),
        prisma.reclamation.count({ where: { status: StatusReclamation.en_attente } }),
        prisma.reclamation.count({ where: { status: StatusReclamation.traitee } }),
        prisma.reclamation.count({ where: { status: StatusReclamation.refusee } }),
      ]);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      approvalRate:
        totalRequests > 0
          ? Math.round((approvedRequests / totalRequests) * 100)
          : 0,
    };
  } catch (error) {
    logger.error("Error fetching request stats:", error);
    throw error;
  }
};

export const getStudentRequests = async (studentId: number) => {
  try {
    return await prisma.reclamation.findMany({
      where: { etudiantId: studentId },
      include: {
        etudiant: {
          include: { user: true },
        },
        type: true,
        traiteParUser: {
          select: { nom: true, prenom: true },
        },
      },
      orderBy: { dateReclamation: "desc" },
    });
  } catch (error) {
    logger.error("Error fetching student requests:", error);
    throw error;
  }
};
