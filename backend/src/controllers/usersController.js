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

        const created = newUser.toObject();
        delete created.password;
        res.status(201).json({ message: "User created successfully", user: created });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, name, email, phone, password, longitude, latitude, location } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (email !== undefined && email !== user.email) {
            const taken = await User.findOne({ email, _id: { $ne: id } });
            if (taken) {
                return res.status(400).json({ message: "Email is already in use" });
            }
            user.email = email;
        }

        if (username !== undefined && username !== user.username) {
            const taken = await User.findOne({ username, _id: { $ne: id } });
            if (taken) {
                return res.status(400).json({ message: "Username is already taken" });
            }
            user.username = username;
        }

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;

        let lon = longitude !== undefined ? parseFloat(longitude) : null;
        let lat = latitude !== undefined ? parseFloat(latitude) : null;
        if ((!Number.isFinite(lon) || !Number.isFinite(lat)) && Array.isArray(location?.coordinates)) {
            lon = parseFloat(location.coordinates[0]);
            lat = parseFloat(location.coordinates[1]);
        }
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
            user.location = {
                type: "Point",
                coordinates: [lon, lat],
            };
        }

        if (password !== undefined && String(password).trim() !== "") {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        const safe = user.toObject();
        delete safe.password;
        return res.status(200).json({ message: "Profile updated", user: safe });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};