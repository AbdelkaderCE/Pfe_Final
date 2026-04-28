/**
 * Entry point for the affectation module — mounted under /api/v1/affectation in app.ts.
 * The real routing tree is in ./routes/index.ts; this file exists so the import
 * path in app.ts stays stable while the internal layout follows clean architecture.
 */
export { default } from "./routes";
