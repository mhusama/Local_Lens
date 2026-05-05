import express from "express";
import { getAdmins, createAdmin } from "../controllers/adminController.js";

const router = express.Router();

// GET /api/admins - Get all admins
router.get("/", getAdmins);

// POST /api/admins - Create a new admin
router.post("/", createAdmin);

export default router;