const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");

const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[migrate-safe] Missing DATABASE_URL in .env");
  process.exit(1);
}

let backupDatabaseUrl = databaseUrl;
try {
  const parsedUrl = new URL(databaseUrl);
  parsedUrl.searchParams.delete("schema");
  backupDatabaseUrl = parsedUrl.toString();
} catch (error) {
  backupDatabaseUrl = databaseUrl.replace(/\?schema=[^&]+/, "");
}

const backupPath = process.env.PG_DUMP_OUTPUT || path.join(projectRoot, "backup.sql");
fs.mkdirSync(path.dirname(backupPath), { recursive: true });
if (fs.existsSync(backupPath)) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rotatedPath = path.join(projectRoot, `backup-${timestamp}.sql`);
  fs.renameSync(backupPath, rotatedPath);
  console.log(`[migrate-safe] Rotated existing backup to ${path.basename(rotatedPath)}`);
}

const prismaCommand = (() => {
  const localBinary = path.join(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prisma.cmd" : "prisma"
  );

  if (fs.existsSync(localBinary)) {
    return localBinary;
  }

  return process.platform === "win32" ? "npx.cmd" : "npx";
})();
const pgDumpCommand = process.env.PG_DUMP_PATH || "pg_dump";

function runStep(label, command, args, extraOptions = {}) {
  console.log(`[migrate-safe] ${label}...`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    ...extraOptions,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function runPrismaStep(label, args) {
  const isNpx = path.basename(prismaCommand).startsWith("npx");
  const prismaArgs = isNpx ? ["prisma", ...args] : args;
  runStep(label, prismaCommand, prismaArgs);
}

try {
  console.log(`[migrate-safe] Using pg_dump: ${pgDumpCommand}`);
  runStep("Backup database", pgDumpCommand, ["-f", backupPath, backupDatabaseUrl]);
  runPrismaStep("Prisma validate", ["validate"]);
  runPrismaStep("Prisma migrate deploy", ["migrate", "deploy"]);
  runPrismaStep("Prisma generate", ["generate"]);
  console.log("[migrate-safe] Completed successfully.");
} catch (error) {
  console.error(`[migrate-safe] ${error.message || error}`);
  console.error("[migrate-safe] Migration halted. Restore from backup.sql if needed.");
  process.exit(1);
}
