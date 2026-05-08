import Chat from "../models/Chat.js";

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
        const { sender_id, recipient_id, message } = req.body;
        if (!sender_id || !recipient_id || !message?.trim()) {
            return res.status(400).json({ message: "sender_id, recipient_id, and message are required" });
        }

        const saved = await Chat.create({
            sender_id,
            recipient_id,
            message: message.trim(),
        });

        return res.status(201).json({ message: "Message sent", chat: saved });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
