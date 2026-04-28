import { Router } from "express";
import {
  createAnnonceHandler,
  deleteAnnonceHandler,
  getAllAnnoncesHandler,
  getAnnonceByIdHandler,
  updateAnnonceHandler,
} from "./annonce.controller";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware";
import upload from "../../middlewares/annonces-upload.middleware";

const router = Router();

router.get("/", getAllAnnoncesHandler);
router.get("/:id", getAnnonceByIdHandler);

router.post("/", requireAuth, requireRole(["admin"]), upload.array("files", 10), createAnnonceHandler);
router.put("/:id", requireAuth, requireRole(["admin"]), upload.array("files", 10), updateAnnonceHandler);
router.delete("/:id", requireAuth, requireRole(["admin"]), deleteAnnonceHandler);

export default router;