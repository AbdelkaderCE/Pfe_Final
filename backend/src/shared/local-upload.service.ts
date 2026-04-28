import fs from "fs";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import crypto from "crypto";

export type UploadBucket = "profiles" | "documents" | "others";

const UPLOADS_ROOT_DIR = path.join(process.cwd(), "uploads");
const UPLOADS_PUBLIC_PREFIX = "/uploads";

const sanitizeSubDirectory = (value?: string): string => {
  if (!value) {
    return "";
  }

  return value
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, "_"))
    .join("/");
};

export const getLocalUploadDirectory = (
  bucket: UploadBucket,
  subDirectory?: string
): string => {
  const cleanedSubDirectory = sanitizeSubDirectory(subDirectory);

  if (!cleanedSubDirectory) {
    return path.join(UPLOADS_ROOT_DIR, bucket);
  }

  return path.join(UPLOADS_ROOT_DIR, bucket, cleanedSubDirectory);
};

export const ensureLocalUploadDirectory = (
  bucket: UploadBucket,
  subDirectory?: string
): string => {
  const directory = getLocalUploadDirectory(bucket, subDirectory);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};

const sanitizeBaseName = (fileName: string): string => {
  const extension = path.extname(fileName || "");
  const baseName = (fileName || "file").slice(0, Math.max(0, fileName.length - extension.length));
  const normalized = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);

  return normalized || "file";
};

export const buildUniqueUploadFilename = (originalFileName: string): string => {
  const extension = path.extname(originalFileName || "").toLowerCase().slice(0, 12);
  const safeBase = sanitizeBaseName(originalFileName || "file");
  const randomPart = crypto.randomBytes(8).toString("hex");

  return `${Date.now()}-${randomPart}-${safeBase}${extension}`;
};

export const createDiskStorage = (
  bucket: UploadBucket,
  subDirectory?: string
): multer.StorageEngine => {
  const destinationDirectory = ensureLocalUploadDirectory(bucket, subDirectory);

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, destinationDirectory);
    },
    filename: (_req, file, callback) => {
      callback(null, buildUniqueUploadFilename(file.originalname || "file"));
    },
  });
};

export const createMimeAndExtensionFileFilter = (
  allowedMimeTypes: Iterable<string>,
  allowedExtensions: Iterable<string>,
  errorMessage: string
) => {
  const mimeTypeSet = new Set(Array.from(allowedMimeTypes, (value) => String(value || "").toLowerCase()));
  const extensionSet = new Set(Array.from(allowedExtensions, (value) => String(value || "").toLowerCase()));

  return (_req: Request, file: Express.Multer.File, callback: FileFilterCallback): void => {
    const mimeType = String(file.mimetype || "").toLowerCase();
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (mimeTypeSet.has(mimeType) || extensionSet.has(extension)) {
      callback(null, true);
      return;
    }

    callback(new Error(errorMessage));
  };
};

export const toPublicUploadPath = (filePath: string): string | null => {
  if (!filePath) {
    return null;
  }

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const normalizedInput = String(filePath).replace(/\\/g, "/");
  if (normalizedInput.startsWith(`${UPLOADS_PUBLIC_PREFIX}/`)) {
    return normalizedInput;
  }

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const normalizedAbsolute = path.normalize(absolutePath);
  const normalizedRoot = path.normalize(UPLOADS_ROOT_DIR);

  if (!normalizedAbsolute.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
    return null;
  }

  const relativePath = path.relative(normalizedRoot, normalizedAbsolute).replace(/\\/g, "/");

  if (!relativePath || relativePath.includes("..")) {
    return null;
  }

  return `${UPLOADS_PUBLIC_PREFIX}/${relativePath}`;
};

export const resolvePublicUploadPath = (publicPath: string): string | null => {
  if (!publicPath || /^https?:\/\//i.test(publicPath)) {
    return null;
  }

  const normalized = String(publicPath || "").replace(/\\/g, "/");
  const withPublicPrefix = normalized.startsWith(`${UPLOADS_PUBLIC_PREFIX}/`)
    ? normalized
    : normalized.startsWith("uploads/")
      ? `${UPLOADS_PUBLIC_PREFIX}/${normalized.replace(/^uploads\//, "")}`
      : normalized;

  if (!withPublicPrefix.startsWith(`${UPLOADS_PUBLIC_PREFIX}/`)) {
    return null;
  }

  const relativePath = withPublicPrefix.slice(`${UPLOADS_PUBLIC_PREFIX}/`.length);
  if (!relativePath || relativePath.includes("..")) {
    return null;
  }

  return path.join(UPLOADS_ROOT_DIR, relativePath);
};

export const removeLocalUploadFile = (publicPath: string | null | undefined): void => {
  if (!publicPath) {
    return;
  }

  const absolutePath = resolvePublicUploadPath(publicPath);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    return;
  }

  fs.unlinkSync(absolutePath);
};
