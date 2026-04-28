-- Alerts feature — admin-driven banner alerts shown in dashboards.

CREATE TYPE "AlertAudience" AS ENUM ('all', 'etudiants', 'enseignants', 'admins');
CREATE TYPE "AlertLevel" AS ENUM ('info', 'warning', 'critical');

CREATE TABLE "alerts" (
  "id"         SERIAL            NOT NULL,
  "titre"      VARCHAR(255)      NOT NULL,
  "message"    TEXT              NOT NULL,
  "audience"   "AlertAudience"   NOT NULL DEFAULT 'all',
  "level"      "AlertLevel"      NOT NULL DEFAULT 'info',
  "starts_at"  TIMESTAMP(3),
  "ends_at"    TIMESTAMP(3),
  "active"     BOOLEAN           NOT NULL DEFAULT true,
  "created_by" INTEGER           NOT NULL,
  "created_at" TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3)      NOT NULL,

  CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "alerts_active_ends_at_idx" ON "alerts" ("active", "ends_at");

ALTER TABLE "alerts"
  ADD CONSTRAINT "alerts_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users" ("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
