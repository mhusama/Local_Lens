import Admin from "../models/Admin.js";

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

        const newAdmin = new Admin({
            name,
            email,
            password, // In a real app, hash the password
            phone,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
        });

        await newAdmin.save();

        res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};