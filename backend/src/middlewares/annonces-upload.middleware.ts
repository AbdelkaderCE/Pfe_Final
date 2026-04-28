import multer from "multer";
import {
  createDiskStorage,
  createMimeAndExtensionFileFilter,
} from "../shared/local-upload.service";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Video formats
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/webm",
  "video/ogg",
  "video/3gpp",
  "video/x-flv",
]);

const allowedExtensions = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".doc",
  ".docx",
  // Video extensions
  ".mp4",
  ".mpeg",
  ".mov",
  ".avi",
  ".wmv",
  ".webm",
  ".ogv",
  ".3gp",
  ".flv",
]);

const upload = multer({
  storage: createDiskStorage("others", "annonces"),
  limits: {
    fileSize: 500 * 1024 * 1024, // Increased to 500MB for video support
    files: 10,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    allowedMimeTypes,
    allowedExtensions,
    "Only JPG, PNG, GIF, PDF, Word, and video files (MP4, MOV, AVI, WebM, etc.) are allowed"
  ),
});

export default upload;
