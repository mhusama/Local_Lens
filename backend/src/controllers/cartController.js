import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const cartPopulate = {
    path: "productId",
    populate: { path: "shop", select: "shopName" },
};

const computeItemSubtotal = (item) => Number(item.quantity || 0) * Number(item.priceAtAddition || 0);

const mapItem = (item) => {
    const subtotal = computeItemSubtotal(item);
    return {
        ...item,
        subtotal,
    };
};

const computeCartSummary = (items) => {
    const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const cartTotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    return { totalItems, cartTotal };
};

export const addCartItem = async (req, res) => {
    try {
        const { userId, productId, productid } = req.body;
        const resolvedProductId = productId || productid;
        if (!userId || !resolvedProductId) {
            return res.status(400).json({ message: "userId and productId are required" });
        }

        const product = await Product.findById(resolvedProductId).select("_id shop finalPrice reducedPrice price");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const discountedPrice = Number(product.finalPrice ?? product.reducedPrice ?? product.price ?? 0);
        const existing = await Cart.findOne({ userId, productId: resolvedProductId });
        if (existing) {
            existing.quantity = Number(existing.quantity || 0) + 1;
            await existing.save();
            await existing.populate(cartPopulate);
            const mapped = mapItem(existing.toObject());
            return res.status(200).json({ message: "Cart quantity updated", cartItem: mapped });
        }

        const cartItem = await Cart.create({
            userId,
            productId: resolvedProductId,
            shopId: product.shop,
            quantity: 1,
            priceAtAddition: discountedPrice,
        });
        await cartItem.populate(cartPopulate);
        const mapped = mapItem(cartItem.toObject());
        return res.status(201).json({ message: "Added to cart", cartItem: mapped });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getCartItems = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const items = await Cart.find({ userId })
            .sort({ createdAt: -1 })
            .populate(cartPopulate)
            .lean();

        const mappedItems = items.map(mapItem);
        const summary = computeCartSummary(mappedItems);
        return res.status(200).json({ items: mappedItems, ...summary });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const increaseCartItemQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Cart.findById(id).populate(cartPopulate);
        if (!item) {
            return res.status(404).json({ message: "Cart item not found" });
        }
        item.quantity = Number(item.quantity || 0) + 1;
        await item.save();
        const mapped = mapItem(item.toObject());
        return res.status(200).json({ message: "Quantity increased", cartItem: mapped });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const decreaseCartItemQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Cart.findById(id).populate(cartPopulate);
        if (!item) {
            return res.status(404).json({ message: "Cart item not found" });
        }
        const nextQuantity = Number(item.quantity || 0) - 1;
        if (nextQuantity <= 0) {
            await Cart.findByIdAndDelete(id);
            return res.status(200).json({ message: "Cart item removed", removed: true });
        }
        item.quantity = nextQuantity;
        await item.save();
        const mapped = mapItem(item.toObject());
        return res.status(200).json({ message: "Quantity decreased", cartItem: mapped, removed: false });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const removed = await Cart.findByIdAndDelete(id).lean();
        if (!removed) {
            return res.status(404).json({ message: "Cart item not found" });
        }
        return res.status(200).json({ message: "Cart item removed" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const clearCart = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        await Cart.deleteMany({ userId });
        return res.status(200).json({ message: "Cart cleared", totalItems: 0, cartTotal: 0 });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
