import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import authRoutes from "./modules/auth/auth.routes";
import teacherDashboardRoutes from "./modules/dashboard/teacher-dashboard.routes";
import requestRoutes from "./modules/requests/request.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import studentRoutes from "./modules/student/student.routes";
import pfeRefactoredRoutes from "./modules/pfe/pfe-refactored.routes";
import disciplineRoutes from "./modules/discipline/routes/discipline.routes";
import affectationRoutes from "./modules/affectation/affectation.routes";
import adminRoutes from "./modules/admin/admin.routes";
import teacherRoutes from "./modules/teacher/teacher.routes";
import actualitesRoutes from "./modules/actualites/actualites.routes";
import annoncesRoutes from "./modules/annonces/annonces.routes";
import alertsRoutes from "./modules/alerts/alerts.routes";
import aiRoutes from "./modules/ai/ai.routes";
import siteSettingsRoutes from "./modules/settings/site-settings.routes";
import copieRemiseRoutes from "./modules/copieRemise/copiesRemise.routes";
import enseignantsRoutes from "./modules/enseignants/enseignants.routes";
import submissionRoutes from "./modules/submissions/submission.routes";
import historyRoutes from "./modules/history/history.routes";
import academicYearsRoutes from "./modules/academic-years/academic-years.routes";
import academicModulesRoutes from "./modules/academic-modules/academic-modules.routes";
import enseignementsRoutes from "./modules/enseignements/enseignements.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { globalLimiter } from "./middlewares/rate-limit.middleware";

const app = express();
const uploadsRootPath = path.join(process.cwd(), "uploads");

["profiles", "documents", "others"].forEach((directoryName) => {
  fs.mkdirSync(path.join(uploadsRootPath, directoryName), { recursive: true });
});

const configuredOrigins = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const localhostDevOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV !== "production" && localhostDevOriginRegex.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  "/uploads",
  express.static(uploadsRootPath, {
    dotfiles: "deny",
    index: false,
    fallthrough: true,
  })
);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "University API Running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/", globalLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/dashboard", teacherDashboardRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/documents", documentsRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/pfe", pfeRefactoredRoutes);
app.use("/api/v1/cd", disciplineRoutes);
app.use("/api/v1/disciplinary", disciplineRoutes);
app.use("/api/v1/discipline", disciplineRoutes);
app.use("/api/v1/affectation", affectationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/teacher", teacherRoutes);
app.use("/api/v1/actualites", actualitesRoutes);
app.use("/api/v1/annonces", annoncesRoutes);
app.use("/api/v1/alerts", alertsRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/site-settings", siteSettingsRoutes);
app.use("/api/v1/copies-remise", copieRemiseRoutes);
app.use("/api/v1/enseignants", enseignantsRoutes);
app.use("/api/v1/submissions", submissionRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/academic-years", academicYearsRoutes);
app.use("/api/v1/modules", academicModulesRoutes);
app.use("/api/v1/enseignements", enseignementsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
