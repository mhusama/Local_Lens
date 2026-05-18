import Chat from "../models/Chat.js";
import { notifyChatMessage } from "../services/notificationService.js";

export const getConversation = async (req, res) => {
    try {
        const { userA, userB } = req.query;
        if (!userA || !userB) {
            return res.status(400).json({ message: "userA and userB are required" });
        }

        const messages = await Chat.find({
            $or: [
                { sender_id: userA, recipient_id: userB },
                { sender_id: userB, recipient_id: userA },
            ],
        }).sort({ createdAt: 1 });

        return res.status(200).json({ messages });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { sender_id, recipient_id, message, shop_id } = req.body;
        if (!sender_id || !recipient_id || !message?.trim()) {
            return res.status(400).json({ message: "sender_id, recipient_id, and message are required" });
        }

        const trimmed = message.trim();
        const saved = await Chat.create({
            sender_id,
            recipient_id,
            message: trimmed,
        });

        if (String(sender_id) !== String(recipient_id)) {
            try {
                await notifyChatMessage({
                    senderId: sender_id,
                    recipientId: recipient_id,
                    messageText: trimmed,
                    shopId: shop_id || null,
                });
            } catch (notifyErr) {
                console.error("Failed to create chat notification:", notifyErr);
            }
        }

        return res.status(201).json({ message: "Message sent", chat: saved });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
