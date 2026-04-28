import multer from "multer";
import {
  createDiskStorage,
  createMimeAndExtensionFileFilter,
} from "../shared/local-upload.service";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const documentsUpload = multer({
  storage: createDiskStorage("documents"),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: createMimeAndExtensionFileFilter(
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    "Invalid file type. Only PDF, DOC, and DOCX are allowed."
  ),
});

export default documentsUpload;
