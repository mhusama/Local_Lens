import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import { sendPasswordResetEmail } from "../utils/email.js";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_PASSWORD_LENGTH = 6;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findUserByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    if (!normalized) return null;
    return User.findOne({ email: new RegExp(`^${escapeRegex(normalized)}$`, "i") });
}

function hashToken(rawToken) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function getFrontendBaseUrl() {
    return String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const payload = { id: user._id.toString(), email: user.email };
        const token = Buffer.from(JSON.stringify(payload)).toString("base64");

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    const genericMessage =
        "If an account exists for that email, we sent a link to reset your password.";

    try {
        const email = String(req.body?.email ?? "").trim().toLowerCase();
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        let devResetUrl;
        const user = await findUserByEmail(email);
        if (user) {
            await PasswordResetToken.updateMany(
                { userId: user._id, usedAt: null },
                { $set: { usedAt: new Date() } }
            );

            const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
            const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

            await PasswordResetToken.create({
                userId: user._id,
                tokenHash: hashToken(rawToken),
                expiresAt,
            });

            const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
            try {
                const mailResult = await sendPasswordResetEmail({ to: user.email, resetUrl });
                const exposeDevLink =
                    process.env.NODE_ENV !== "production" ||
                    process.env.EXPOSE_RESET_LINK === "true";
                if (exposeDevLink && mailResult?.logged && !mailResult?.delivered) {
                    devResetUrl = resetUrl;
                }
            } catch (mailErr) {
                console.error("Failed to send password reset email:", mailErr);
            }
        }

        return res.status(200).json({
            message: genericMessage,
            ...(devResetUrl ? { devResetUrl } : {}),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const validateResetToken = async (req, res) => {
    try {
        const rawToken = String(req.query?.token ?? "").trim();
        if (!rawToken) {
            return res.status(400).json({ valid: false, message: "Reset token is required" });
        }

        const record = await PasswordResetToken.findOne({
            tokenHash: hashToken(rawToken),
            usedAt: null,
            expiresAt: { $gt: new Date() },
        }).lean();

        if (!record) {
            return res.status(400).json({ valid: false, message: "This reset link is invalid or has expired" });
        }

        return res.status(200).json({ valid: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const rawToken = String(req.body?.token ?? "").trim();
        const password = String(req.body?.password ?? "");
        const confirmPassword = String(req.body?.confirmPassword ?? "");

        if (!rawToken) {
            return res.status(400).json({ message: "Reset token is required" });
        }
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const record = await PasswordResetToken.findOne({
            tokenHash: hashToken(rawToken),
            usedAt: null,
            expiresAt: { $gt: new Date() },
        });

        if (!record) {
            return res.status(400).json({ message: "This reset link is invalid or has expired" });
        }

        const hashed = await bcrypt.hash(password, 10);
        await User.updateOne({ _id: record.userId }, { $set: { password: hashed } });

        record.usedAt = new Date();
        await record.save();

        await PasswordResetToken.updateMany(
            { userId: record.userId, usedAt: null, _id: { $ne: record._id } },
            { $set: { usedAt: new Date() } }
        );

        return res.status(200).json({ message: "Password updated. You can sign in with your new password." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
