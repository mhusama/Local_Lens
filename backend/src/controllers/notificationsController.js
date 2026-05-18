import Notification from "../models/Notification.js";

export const listNotifications = async (req, res) => {
    try {
        const { userId, limit = "30" } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const max = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(max)
            .lean();

        return res.status(200).json({ notifications });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const count = await Notification.countDocuments({ userId, read: false });
        return res.status(200).json({ count });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const updated = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { $set: { read: true } },
            { new: true }
        ).lean();

        if (!updated) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({ notification: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
        return res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
