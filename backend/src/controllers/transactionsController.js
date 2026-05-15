import Cart from "../models/Cart.js";
import Transaction from "../models/Transaction.js";
import Shop from "../models/Shop.js";
import mongoose from "mongoose";

const cartPopulate = {
    path: "productId",
    populate: { path: "shop", select: "shopName" },
};

const DELIVERY_FEE = 40;

export const checkoutFromCart = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const cartItems = await Cart.find({ userId }).populate(cartPopulate).lean();
        if (!cartItems.length) {
            return res.status(400).json({ message: "Your cart is empty" });
        }

        const items = cartItems.map((row) => {
            const product = row.productId;
            const qty = Number(row.quantity || 0);
            const unitPrice = Number(row.priceAtAddition || 0);
            const subtotal = qty * unitPrice;
            const images = Array.isArray(product?.images) ? product.images : [];
            return {
                productId: product?._id || row.productId,
                shopId: row.shopId,
                productName: product?.name || "Product",
                shopName: product?.shop?.shopName || "Unknown shop",
                imageSnapshot: images[0] || "",
                quantity: qty,
                unitPrice,
                subtotal,
            };
        });

        const subtotal = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
        const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
        const total = subtotal + deliveryFee;

        const shopIdStrings = [...new Set(items.map((it) => String(it.shopId || "")).filter(Boolean))];
        const shopIds = shopIdStrings.map((s) => new mongoose.Types.ObjectId(s));
        const shopId = shopIds.length === 1 ? shopIds[0] : null;

        const transaction = await Transaction.create({
            userId,
            items,
            shopIds,
            shopId,
            subtotal,
            deliveryFee,
            total,
            status: "completed",
        });

        await Cart.deleteMany({ userId });

        const saved = await Transaction.findById(transaction._id).lean();

        return res.status(201).json({ message: "Checkout complete", transaction: saved });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const listUserTransactions = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const list = await Transaction.find({ userId }).sort({ createdAt: -1 }).lean();

        return res.status(200).json({ transactions: list });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const listTransactionsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        if (!shopId) {
            return res.status(400).json({ message: "shopId is required" });
        }

        const shop = await Shop.findById(shopId).select("user_id").lean();
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        const ownerId = String(shop.user_id || "");
        if (ownerId !== String(userId)) {
            return res.status(403).json({ message: "You can only view transactions for your own shops" });
        }

        const shopObjectId = new mongoose.Types.ObjectId(shopId);
        const list = await Transaction.find({
            $or: [{ shopId: shopObjectId }, { shopIds: shopObjectId }, { "items.shopId": shopObjectId }],
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ transactions: list });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const listAllTransactionsAdmin = async (req, res) => {
    try {
        const list = await Transaction.find({}).sort({ createdAt: -1 }).limit(500).lean();
        return res.status(200).json({ transactions: list });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
