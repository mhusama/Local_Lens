import express from "express";
import { listContactMessages, submitContactMessage } from "../controllers/contactController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/", submitContactMessage);
router.get("/", requireAdmin, listContactMessages);

export default router;
