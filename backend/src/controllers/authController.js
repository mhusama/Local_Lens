import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
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
