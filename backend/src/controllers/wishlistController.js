import Wishlist from "../models/Wishlist.js";

const wishlistPopulate = {
    path: "product_Id",
    populate: { path: "shop", select: "shopName" },
};

export const addWishlistItem = async (req, res) => {
    try {
        const { user_id, product_id, product_Id } = req.body;
        const resolvedProductId = product_Id || product_id;

        if (!user_id || !resolvedProductId) {
            return res.status(400).json({ message: "user_id and product_id are required" });
        }

        const existing = await Wishlist.findOne({ user_id, product_Id: resolvedProductId }).lean();
        if (existing) {
            return res.status(200).json({ message: "Already in wishlist", wishlistItem: existing });
        }

        const wishlistItem = await Wishlist.create({
            user_id,
            product_Id: resolvedProductId,
            created_at: new Date(),
        });

        await wishlistItem.populate(wishlistPopulate);
        return res.status(201).json({ message: "Added to wishlist", wishlistItem });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getWishlistItems = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ message: "user_id is required" });
        }

        const items = await Wishlist.find({ user_id })
            .sort({ created_at: -1 })
            .populate(wishlistPopulate)
            .lean();

        return res.status(200).json({ items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const removeWishlistItem = async (req, res) => {
    try {
        const { wishlistId } = req.params;
        const deleted = await Wishlist.findByIdAndDelete(wishlistId).lean();
        if (!deleted) {
            return res.status(404).json({ message: "Wishlist item not found" });
        }
        return res.status(200).json({ message: "Wishlist item removed" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const clearWishlist = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ message: "user_id is required" });
        }
        await Wishlist.deleteMany({ user_id });
        return res.status(200).json({ message: "Wishlist cleared" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
