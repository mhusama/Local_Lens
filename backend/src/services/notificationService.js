import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";

export async function createNotification({ userId, type, title, message, link = "", metadata = {} }) {
    if (!userId) return null;
    return Notification.create({
        userId,
        type,
        title,
        message,
        link,
        metadata,
        read: false,
    });
}

export async function notifyCheckout({ buyerId, transactionId, items, total }) {
    const buyerObjectId = new mongoose.Types.ObjectId(String(buyerId));
    const shopIdStrings = [...new Set(items.map((it) => String(it.shopId || "")).filter(Boolean))];
    const shopObjectIds = shopIdStrings.map((id) => new mongoose.Types.ObjectId(id));

    await createNotification({
        userId: buyerObjectId,
        type: "purchase_confirmed",
        title: "Order confirmed",
        message: `Your order (${items.length} item${items.length === 1 ? "" : "s"}) was placed successfully.`,
        link: "/transactions",
        metadata: { transactionId, total },
    });

    if (!shopObjectIds.length) return;

    const shops = await Shop.find({ _id: { $in: shopObjectIds } }).select("user_id shopName").lean();
    for (const shop of shops) {
        const ownerId = shop.user_id;
        if (!ownerId || String(ownerId) === String(buyerId)) continue;

        const shopItems = items.filter((it) => String(it.shopId) === String(shop._id));
        const itemCount = shopItems.reduce((sum, it) => sum + Number(it.quantity || 0), 0);

        await createNotification({
            userId: ownerId,
            type: "shop_sale",
            title: "New sale",
            message: `Someone placed an order at ${shop.shopName} (${itemCount} item${itemCount === 1 ? "" : "s"}).`,
            link: `/shop/${shop._id}`,
            metadata: { transactionId, shopId: shop._id, shopName: shop.shopName },
        });
    }
}

export async function notifyChatMessage({ senderId, recipientId, messageText, shopId }) {
    const sender = await User.findById(senderId).select("name username").lean();
    const senderLabel = sender?.name || sender?.username || "Someone";
    const preview =
        messageText.length > 80 ? `${messageText.slice(0, 80).trim()}…` : messageText.trim();

    let link = "";
    if (shopId) {
        link = `/shop/${shopId}`;
    }

    await createNotification({
        userId: recipientId,
        type: "chat_message",
        title: "New message",
        message: `${senderLabel}: ${preview}`,
        link,
        metadata: { senderId, shopId: shopId || null },
    });
}
