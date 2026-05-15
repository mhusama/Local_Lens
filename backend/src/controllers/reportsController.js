import mongoose from "mongoose";
import Report from "../models/Report.js";
import Shop from "../models/Shop.js";
import { SHOP_REPORT_REASON_LABELS } from "../constants/shopReportReasons.js";

const allowedReasons = new Set(SHOP_REPORT_REASON_LABELS);

export const createReport = async (req, res) => {
    try {
        const { reporterId, shopId, reason, description } = req.body;

        if (!reporterId || !shopId || !reason) {
            return res.status(400).json({
                message: "reporterId, shopId, and reason are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(reporterId) || !mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({ message: "Invalid reporter or shop id" });
        }

        const reasonText = String(reason).trim();
        if (!allowedReasons.has(reasonText)) {
            return res.status(400).json({ message: "Invalid reason" });
        }

        const shop = await Shop.findById(shopId).select("user_id shopName").lean();
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        if (String(shop.user_id) === String(reporterId)) {
            return res.status(403).json({ message: "You cannot report your own shop" });
        }

        const desc = String(description ?? "").trim().slice(0, 5000);

        const report = new Report({
            reporterId,
            shopId,
            reason: reasonText,
            description: desc,
        });

        await report.save();

        const populated = await Report.findById(report._id)
            .populate("reporterId", "name email username")
            .populate("shopId", "shopName category")
            .lean();

        res.status(201).json({ message: "Report submitted", report: populated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const listReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .sort({ createdAt: -1 })
            .populate("reporterId", "name email username")
            .populate("shopId", "shopName category")
            .lean();

        res.status(200).json({ reports });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid report id" });
        }

        const allowed = ["pending", "reviewing", "resolved", "dismissed"];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
        }

        const report = await Report.findByIdAndUpdate(id, { status }, { new: true })
            .populate("reporterId", "name email username")
            .populate("shopId", "shopName category")
            .lean();
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({ report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
