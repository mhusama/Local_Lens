import Shop from "../models/Shop.js";

export const getShops = async (req, res) => {
    try {
        const shops = await Shop.find().populate('user_id', 'name email');
        res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createShop = async (req, res) => {
    try {
        const { shopName, description, category, phone, user_id, longitude, latitude, address, openingHours, rating, totalReviews, followers, isOpen } = req.body;

        if (!shopName || !description || !category || !phone || !user_id || longitude === undefined || latitude === undefined || !address || !openingHours) {
            return res.status(400).json({ message: "shopName, description, category, phone, user_id, location coordinates, address, and openingHours are required" });
        }

        const newShop = new Shop({
            user_id,
            shopName,
            description,
            category,
            phone,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            address,
            openingHours,
            rating: rating || 0,
            totalReviews: totalReviews || 0,
            followers: followers || 0,
            isOpen: isOpen !== undefined ? isOpen : true,
        });

        await newShop.save();

        // Populate user info in response
        await newShop.populate('user_id', 'name email');

        res.status(201).json({ message: "Shop created successfully", shop: newShop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getShopsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const shops = await Shop.find({ user_id: ownerId }).populate('user_id', 'name email');
        res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};