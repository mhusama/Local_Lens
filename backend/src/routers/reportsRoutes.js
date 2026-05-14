import express from "express";
import { createReport, listReports, updateReportStatus } from "../controllers/reportsController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/", createReport);
router.get("/", requireAdmin, listReports);
router.patch("/:id", requireAdmin, updateReportStatus);

export default router;
