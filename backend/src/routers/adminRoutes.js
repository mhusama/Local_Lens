import express from "express";
import { adminLogin, getAdmins, createAdmin } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/login", adminLogin);

router.get("/", requireAdmin, getAdmins);

router.post("/", createAdmin);

export default router;