import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        let validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword && password === admin.password) {
            validPassword = true;
            admin.password = await bcrypt.hash(password, 10);
            await admin.save();
        }
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const payload = { type: "admin", id: admin._id.toString(), email: admin.email };
        const token = Buffer.from(JSON.stringify(payload)).toString("base64");

        res.status(200).json({
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({}, '-password'); // Exclude password from response
        res.status(200).json({ admins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createAdmin = async (req, res) => {
    try {
        const { name, email, password, phone, longitude, latitude } = req.body;

        if (!name || !email || !password || !phone || longitude === undefined || latitude === undefined) {
            return res.status(400).json({ message: "All fields including location coordinates are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            name,
            email,
            password: hashedPassword,
            phone,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
        });

        await newAdmin.save();

        const adminJson = newAdmin.toObject();
        delete adminJson.password;

        res.status(201).json({ message: "Admin created successfully", admin: adminJson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};