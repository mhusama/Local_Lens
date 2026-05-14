import mongoose from "mongoose";
import Report from "../models/Report.js";

export const createReport = async (req, res) => {
    try {
        const { reporterId, reportedEntityType, reportedEntityId, reason, description } = req.body;

        if (!reporterId || !reportedEntityType || !reportedEntityId || !reason) {
            return res.status(400).json({
                message: "reporterId, reportedEntityType, reportedEntityId, and reason are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(reporterId) || !mongoose.Types.ObjectId.isValid(reportedEntityId)) {
            return res.status(400).json({ message: "Invalid ObjectId" });
        }

        const report = new Report({
            reporterId,
            reportedEntityType,
            reportedEntityId,
            reason,
            description: description ?? "",
        });

        await report.save();

        res.status(201).json({ message: "Report submitted", report });
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

        const report = await Report.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({ report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
