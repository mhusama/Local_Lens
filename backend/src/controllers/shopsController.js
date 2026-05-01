import Shop from "../models/Shop.js";

export const getShops = async (req, res) => {
    try {
        const shops = await Shop.find().populate('owner', 'name email');
        res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createShop = async (req, res) => {
    try {
        const { name, description, address, phone, owner, latitude, longitude } = req.body;

        if (!name || !description || !address || !phone || !owner || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newShop = new Shop({
            name,
            description,
            address,
            phone,
            owner,
            location: {
                latitude,
                longitude,
            },
        });

        await newShop.save();

        // Populate owner info in response
        await newShop.populate('owner', 'name email');

        res.status(201).json({ message: "Shop created successfully", shop: newShop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getShopsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const shops = await Shop.find({ owner: ownerId }).populate('owner', 'name email');
        res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};