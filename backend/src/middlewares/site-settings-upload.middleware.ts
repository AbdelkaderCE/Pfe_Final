import multer from "multer";
import {
  createDiskStorage,
  createMimeAndExtensionFileFilter,
} from "../shared/local-upload.service";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

const siteSettingsUpload = multer({
  storage: createDiskStorage("others", "site-settings"),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    "Invalid file type. Only PNG/JPG/WEBP/GIF are allowed."
  ),
});

export default siteSettingsUpload;
