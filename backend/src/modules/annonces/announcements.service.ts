import prisma from "../../config/database";
import { Prisma, PrioriteAnnonce, TypeFichierAnnonce, CibleAnnonce } from "@prisma/client";
import logger from "../../utils/logger";
import { createAlert } from "../alerts/alert.service";

const normalizeAnnouncementPriority = (value?: string): PrioriteAnnonce => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "basse" || normalized === "low") {
    return "basse";
  }

  if (normalized === "haute" || normalized === "high") {
    return "haute";
  }

  if (normalized === "urgente" || normalized === "urgent") {
    return "urgente";
  }

  return "normale";
};

const resolveFileType = (mimeType?: string): TypeFichierAnnonce => {
  if (!mimeType) {
    return TypeFichierAnnonce.autre;
  }

  const normalized = mimeType.toLowerCase();

  if (normalized.includes("pdf")) {
    return TypeFichierAnnonce.pdf;
  }

  if (normalized.startsWith("image/")) {
    return TypeFichierAnnonce.image;
  }

  if (normalized.startsWith("video/")) {
    return TypeFichierAnnonce.video;
  }

  if (
    normalized.includes("word") ||
    normalized.includes("officedocument") ||
    normalized.includes("msword")
  ) {
    return TypeFichierAnnonce.doc;
  }

  return TypeFichierAnnonce.autre;
};

export interface CreateAnnounceInput {
  titre: string;
  contenu: string;
  priority?: string;
  typeAnnonce?: string;
  typeId?: number;
  dateExpiration?: Date;
  filePath?: string;
  fileType?: string;
}

export interface UpdateAnnounceInput {
  titre?: string;
  contenu?: string;
  priority?: string;
  typeAnnonce?: string;
  typeId?: number;
  dateExpiration?: Date;
  removedDocumentIds?: number[];
}

const resolveTypeId = async (
  input: Pick<CreateAnnounceInput, "typeAnnonce" | "typeId">
): Promise<number | null> => {
  if (typeof input.typeId === "number") {
    return input.typeId;
  }

  if (!input.typeAnnonce?.trim()) {
    return null;
  }

  const typeName = input.typeAnnonce.trim();
  const existing = await prisma.annonceType.findFirst({
    where: {
      OR: [
        { nom_ar: { equals: typeName, mode: "insensitive" } },
        { nom_en: { equals: typeName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.annonceType.create({
    data: {
      nom_ar: typeName,
      nom_en: typeName,
    },
    select: { id: true },
  });

  return created.id;
};

export const createAnnounce = async (
  input: CreateAnnounceInput,
  auteurId: number,
  files?: Express.Multer.File[]
) => {
  try {
    const typeId = await resolveTypeId(input);

    const announce = await prisma.annonce.create({
      data: {
        titre_ar: input.titre,
        titre_en: input.titre,
        contenu_ar: input.contenu,
        contenu_en: input.contenu,
        priorite: normalizeAnnouncementPriority(input.priority),
        auteurId: auteurId,
        typeId,
        datePublication: new Date(),
        dateExpiration: input.dateExpiration,
      },
      include: {
        auteur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        type: true,
        documents: true,
      },
    });

    if (files && files.length > 0) {
  await prisma.annonceDocument.createMany({
    data: files.map((file) => ({
      annonceId: announce.id,
      fichier: `/uploads/others/annonces/${file.filename}`,
      type: resolveFileType(file.mimetype),
    })),
  });
}

    // Fan-out alerts to the audience implied by `cible` (default: tous).
    // Errors are swallowed so a transient alert failure can't roll back
    // the announcement (which is already committed at this point).
    fanoutAnnouncementAlerts(announce.id, announce.cible).catch((err) => {
      logger.warn(`Announcement alert fan-out failed for #${announce.id}: ${err?.message || err}`);
    });

    logger.info(`Announcement created: ${announce.id}`);
    return getAnnounceById(announce.id);
  } catch (error) {
    logger.error("Error creating announcement:", error);
    throw error;
  }
};

/**
 * Resolve the audience userIds for an announcement, then create one alert
 * per recipient. The cible enum maps to:
 *   - tous           → every user with status="active"
 *   - etudiants      → users with the "etudiant" role
 *   - enseignants    → users with the "enseignant" role
 *   - administration → users with the "admin" role
 *
 * Author is excluded so the publisher doesn't notify themselves.
 */
const fanoutAnnouncementAlerts = async (
  annonceId: number,
  cible: CibleAnnonce | null | undefined
): Promise<void> => {
  const annonce = await prisma.annonce.findUnique({
    where: { id: annonceId },
    select: {
      id: true,
      titre_ar: true,
      titre_en: true,
      auteurId: true,
      contenu_ar: true,
      contenu_en: true,
    },
  });
  if (!annonce) return;

  const target = cible ?? CibleAnnonce.tous;
  let userIds: number[] = [];

  if (target === CibleAnnonce.tous) {
    const rows = await prisma.user.findMany({
      where: { status: "active" },
      select: { id: true },
    });
    userIds = rows.map((row) => row.id);
  } else {
    const roleNames =
      target === CibleAnnonce.etudiants
        ? ["etudiant"]
        : target === CibleAnnonce.enseignants
          ? ["enseignant"]
          : ["admin"];
    const rows = await prisma.userRole.findMany({
      where: {
        role: { nom: { in: roleNames, mode: "insensitive" } },
        user: { status: "active" },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    userIds = rows.map((row) => row.userId);
  }

  // Drop the author so they don't alert themselves about their own post.
  userIds = userIds.filter((id) => id !== annonce.auteurId);

  const title = annonce.titre_en || annonce.titre_ar || "New announcement";
  const preview =
    (annonce.contenu_en || annonce.contenu_ar || "").trim().slice(0, 240) || "Open the announcements page for details.";

  for (const userId of userIds) {
    try {
      await createAlert({
        userId,
        title: `New announcement: ${title}`,
        message: preview,
        type: "REQUEST",
        relatedId: annonce.id,
      });
    } catch (err) {
      logger.warn(
        `Failed to create announcement alert for user=${userId}, annonce=${annonce.id}: ${(err as Error)?.message || err}`
      );
    }
  }
};

export const getAnnounces = async (filters?: {
  typeAnnonce?: string;
  isExpired?: boolean;
}) => {
  try {
    const where: Prisma.AnnonceWhereInput = {};

    if (filters?.typeAnnonce?.trim()) {
      where.type = {
        OR: [
          { nom_ar: { equals: filters.typeAnnonce.trim(), mode: "insensitive" } },
          { nom_en: { equals: filters.typeAnnonce.trim(), mode: "insensitive" } },
        ],
      };
    }

    const announces = await prisma.annonce.findMany({
      where,
      include: {
        auteur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        type: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (filters?.isExpired === true) {
      return announces.filter(
        (a) => a.dateExpiration && new Date(a.dateExpiration) < new Date()
      );
    }

    if (filters?.isExpired === false) {
      return announces.filter(
        (a) => !a.dateExpiration || new Date(a.dateExpiration) >= new Date()
      );
    }

    return announces;
  } catch (error) {
    logger.error("Error fetching announcements:", error);
    throw error;
  }
};

export const getAnnounceById = async (id: number) => {
  try {
    const announce = await prisma.annonce.findUnique({
      where: { id },
      include: {
        auteur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        type: true,
        documents: true,
      },
    });

    if (!announce) {
      throw new Error("Announcement not found");
    }

    return announce;
  } catch (error) {
    logger.error("Error fetching announcement:", error);
    throw error;
  }
};

export const updateAnnounce = async (
  id: number,
  input: UpdateAnnounceInput,
  files?: Express.Multer.File[]
) => {
  try {
    const typeId = await resolveTypeId(input);

    const announce = await prisma.$transaction(async (tx) => {
      const updatedAnnonce = await tx.annonce.update({
        where: { id },
        data: {
          titre_ar: input.titre,
          titre_en: input.titre,
          contenu_ar: input.contenu,
          contenu_en: input.contenu,
          priorite: input.priority
            ? normalizeAnnouncementPriority(input.priority)
            : undefined,
          typeId: typeId ?? undefined,
          dateExpiration: input.dateExpiration,
        },
      });
      if (input.removedDocumentIds && input.removedDocumentIds.length > 0) {
    await tx.annonceDocument.deleteMany({
      where: {
        id: { in: input.removedDocumentIds },
        annonceId: id,
      },
    });
  }

      if (files && files.length > 0) {
        await tx.annonceDocument.deleteMany({
          where: { annonceId: id },
        });

        await tx.annonceDocument.createMany({
          data: files.map((file) => ({
            annonceId: id,
            fichier: `/uploads/others/annonces/${file.filename}`,
            type: resolveFileType(file.mimetype),
          })),
        });
      }

      return tx.annonce.findUnique({
        where: { id: updatedAnnonce.id },
        include: {
          auteur: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          type: true,
          documents: true,
        },
      });
    });

    logger.info(`Announcement updated: ${id}`);
    return announce;
  } catch (error) {
    logger.error("Error updating announcement:", error);
    throw error;
  }
};

export const deleteAnnounce = async (id: number) => {
  try {
    await prisma.annonceDocument.deleteMany({
      where: { annonceId: id },
    });

    const announce = await prisma.annonce.delete({
      where: { id },
    });

    return announce;
  } catch (error) {
    console.error('[ERROR] Error deleting announcement:', error);
    throw error;
  }
};

export const getLatestAnnounces = async (limit = 5) => {
  try {
    return await prisma.annonce.findMany({
      where: {
        OR: [
          { dateExpiration: null },
          { dateExpiration: { gte: new Date() } },
        ],
      },
      include: {
        auteur: {
          select: { id: true, nom: true, prenom: true },
        },
        type: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    logger.error("Error fetching latest announcements:", error);
    throw error;
  }
};
