import ContactMessage from "../models/ContactMessage.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!emailRegex.test(String(email).trim())) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        if (String(message).trim().length < 10) {
            return res.status(400).json({ message: "Message should be at least 10 characters" });
        }

        const contact = await ContactMessage.create({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            subject: String(subject).trim(),
            message: String(message).trim(),
        });

        return res.status(201).json({
            message: "Message sent successfully",
            contactId: contact._id,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const listContactMessages = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
        const messages = await ContactMessage.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.status(200).json({ messages, total: messages.length });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
