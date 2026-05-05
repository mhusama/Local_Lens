import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getUsers = async (req, res) => {
    try {
        const { email, username, id } = req.query;

        const filter = {};
        if (id) filter._id = id;
        if (email) filter.email = email;
        if (username) filter.username = username;

        const users = await User.find(filter, '-password'); // Exclude password from response
        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createUser = async (req, res) => {
    try {
        const { username, name, email, password, phone, longitude, latitude, location } = req.body;

        if (!username || !name || !email || !password || !phone) {
            return res.status(400).json({ message: "Username, name, email, password, and phone are required" });
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let lon = longitude !== undefined ? parseFloat(longitude) : null;
        let lat = latitude !== undefined ? parseFloat(latitude) : null;

        if ((!Number.isFinite(lon) || !Number.isFinite(lat)) && Array.isArray(location?.coordinates)) {
            lon = parseFloat(location.coordinates[0]);
            lat = parseFloat(location.coordinates[1]);
        }

        if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
            return res.status(400).json({ message: "A valid map pin location is required" });
        }

        const newUser = new User({
            username,
            name,
            email,
            password: hashedPassword,
            phone,
            location: {
                type: 'Point',
                coordinates: [lon, lat],
            },
        });

        await newUser.save();

        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};