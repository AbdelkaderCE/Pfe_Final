import "dotenv/config"; // يجب أن يكون أول سطر
import { createServer } from "http";
import app from "./app";
import { connectDatabase } from "./config/database";
import { ensureRbacCatalog } from "./shared/rbac.service";
import { ensureRequestWorkflowHistoryTable } from "./modules/requests/workflow.service";
import { ensureAuditLogTable } from "./shared/audit-log.service";
import { ensureRequestSupportTables } from "./modules/requests/request.controller";
import { ensureSupportTables as ensureStudentPanelSupportTables } from "./modules/student/student-panel.service";
import { ensurePfeRuntimeCompatibility } from "./modules/pfe/pfe-runtime-compat.service";

const PORT = process.env.PORT || 5000;

// تشغيل السيرفر
async function startServer() {
  try {
    // الاتصال بقاعدة البيانات أولاً
    await connectDatabase();

    // Ensure critical runtime tables/catalogs exist before serving traffic.
    await Promise.all([
      ensureRbacCatalog(),
      ensureRequestWorkflowHistoryTable(),
      ensureRequestSupportTables(),
      ensureStudentPanelSupportTables(),
      ensureAuditLogTable(),
      ensurePfeRuntimeCompatibility(),
    ]);

    const httpServer = createServer(app);

    // Wrap listen() in a Promise so EADDRINUSE surfaces in the try/catch above.
    // Node fires listen errors as an 'error' event, not a thrown exception.
    await new Promise<void>((resolve, reject) => {
      httpServer.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          reject(
            new Error(
              `Port ${PORT} is already in use. ` +
              `Stop the existing process or set a different PORT in your .env file.`
            )
          );
        } else {
          reject(err);
        }
      });
      httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
        resolve();
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

startServer();