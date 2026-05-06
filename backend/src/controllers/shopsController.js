import Shop from "../models/Shop.js";

export const getShops = async (req, res) => {
    try {
        const { user_id } = req.query;
        const filter = user_id ? { user_id } : {};
        const shops = await Shop.find(filter).populate('user_id', 'name email');
        res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createShop = async (req, res) => {
    try {
        const {
            shopName,
            description,
            category,
            phone,
            user_id,
            longitude,
            latitude,
            location,
            address,
            openingHours,
            rating,
            totalReviews,
            followers,
            isOpen
        } = req.body;

        if (!shopName || !description || !category || !phone || !user_id || !address || !openingHours) {
            return res.status(400).json({ message: "shopName, description, category, phone, user_id, location coordinates, address, and openingHours are required" });
        }

        let lon = longitude !== undefined ? parseFloat(longitude) : null;
        let lat = latitude !== undefined ? parseFloat(latitude) : null;

        if ((!Number.isFinite(lon) || !Number.isFinite(lat)) && Array.isArray(location?.coordinates)) {
            lon = parseFloat(location.coordinates[0]);
            lat = parseFloat(location.coordinates[1]);
        }

        if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
            return res.status(400).json({ message: "Valid longitude and latitude are required" });
        }

        const newShop = new Shop({
            user_id,
            shopName,
            description,
            category,
            phone,
            location: {
                type: 'Point',
                coordinates: [lon, lat],
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

export const getShopById = async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await Shop.findById(shopId).populate('user_id', 'name email');
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        res.status(200).json({ shop });
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