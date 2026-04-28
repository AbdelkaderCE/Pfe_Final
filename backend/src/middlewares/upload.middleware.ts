import multer from "multer";
import {
  createDiskStorage,
  createMimeAndExtensionFileFilter,
} from "../shared/local-upload.service";

const PROFILE_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
];

const PROFILE_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"];

const upload = multer({
  storage: createDiskStorage("profiles"),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    PROFILE_IMAGE_MIME_TYPES,
    PROFILE_IMAGE_EXTENSIONS,
    "Only image files are allowed for profile photos"
  ),
});

export default upload;
