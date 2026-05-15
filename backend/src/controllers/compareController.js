import Comparison from "../models/Comparison.js";
import Product from "../models/Product.js";

const productPopulate = {
    path: "productId",
    populate: { path: "shop", select: "shopName location openingHours" },
};

export const addComparisonItem = async (req, res) => {
    try {
        const { userId, productId, product_id } = req.body;
        const resolvedProductId = productId || product_id;
        if (!userId || !resolvedProductId) {
            return res.status(400).json({ message: "userId and productId are required" });
        }

        const product = await Product.findById(resolvedProductId).select("_id").lean();
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const existing = await Comparison.findOne({ userId, productId: resolvedProductId }).lean();
        if (existing) {
            const doc = await Comparison.findById(existing._id).populate(productPopulate).lean();
            return res.status(200).json({ message: "Already in compare list", item: doc });
        }

        const created = await Comparison.create({ userId, productId: resolvedProductId });
        const populated = await Comparison.findById(created._id).populate(productPopulate).lean();
        return res.status(201).json({ message: "Added to compare list", item: populated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getComparisonItems = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const items = await Comparison.find({ userId })
            .sort({ createdAt: -1 })
            .populate(productPopulate)
            .lean();

        return res.status(200).json({ items });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const removeComparisonItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Comparison.findByIdAndDelete(id).lean();
        if (!deleted) {
            return res.status(404).json({ message: "Compare item not found" });
        }
        return res.status(200).json({ message: "Removed from compare list" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const clearComparisonItems = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        await Comparison.deleteMany({ userId });
        return res.status(200).json({ message: "Compare list cleared" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
