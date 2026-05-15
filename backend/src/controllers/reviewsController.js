import mongoose from "mongoose";
import path from "path";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import Transaction from "../models/Transaction.js";

const NO_PURCHASE_CLARITY = "no confirmation if the user bought the product";

/** Normalize DB value to a safe public URL under /uploads/ */
function publicUploadsPath(stored) {
    if (stored == null || typeof stored !== "string") return "";
    const t = stored.trim();
    if (!t) return "";
    if (t.startsWith("http://") || t.startsWith("https://")) return t;
    const normalized = t.replace(/\\/g, "/");
    const base = path.basename(normalized);
    if (!base || base === "." || base === "..") return "";
    return `/uploads/${base}`;
}

function formatPurchaseClarity(date) {
    const d = date instanceof Date ? date : new Date(date);
    const formatted = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    return `user bought the product on ${formatted}`;
}

async function resolveClarity(userId, productId) {
    const uid = new mongoose.Types.ObjectId(userId);
    const pid = new mongoose.Types.ObjectId(productId);

    const tx = await Transaction.findOne({
        userId: uid,
        status: "completed",
        items: { $elemMatch: { productId: pid } },
    })
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean();

    if (!tx?.createdAt) {
        return NO_PURCHASE_CLARITY;
    }
    return formatPurchaseClarity(tx.createdAt);
}

export async function recalculateProductRatings(productId) {
    const pid = new mongoose.Types.ObjectId(productId);
    const [row] = await Review.aggregate([
        { $match: { product_id: pid } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const average = row?.count ? Math.round(row.avg * 100) / 100 : 0;
    const count = row?.count ?? 0;
    await Product.updateOne({ _id: pid }, { $set: { "ratings.average": average, "ratings.count": count } });
    return { average, count };
}

export async function recalculateShopRating(shopId) {
    if (!shopId) return;
    const sid = new mongoose.Types.ObjectId(shopId);
    const products = await Product.find({ shop: sid }).select("ratings").lean();
    const rated = products.filter((p) => (p.ratings?.count || 0) > 0);
    const shopRating = rated.length
        ? Math.round((rated.reduce((s, p) => s + Number(p.ratings.average || 0), 0) / rated.length) * 100) / 100
        : 0;
    const totalReviews = products.reduce((s, p) => s + (p.ratings?.count || 0), 0);
    await Shop.updateOne({ _id: sid }, { $set: { rating: shopRating, totalReviews } });
}

export const listReviewsForProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        if (!productId || !mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Valid productId is required" });
        }
        const pid = new mongoose.Types.ObjectId(productId);
        const reviews = await Review.find({ product_id: pid })
            .populate("user_id", "name username")
            .sort({ createdAt: -1 })
            .lean();
        const mapped = reviews.map((r) => ({
            id: r._id.toString(),
            userId: r.user_id?._id?.toString(),
            userName: r.user_id?.name || r.user_id?.username || "User",
            message: r.message,
            rating: r.rating,
            image: publicUploadsPath(r.image),
            clarity: r.clarity,
            createdAt: r.createdAt,
        }));
        return res.status(200).json({ reviews: mapped });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createReview = async (req, res) => {
    try {
        const { userId, productId, message, rating } = req.body;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Valid userId is required" });
        }
        if (!productId || !mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Valid productId is required" });
        }
        const text = String(message ?? "").trim();
        if (!text) {
            return res.status(400).json({ message: "message is required" });
        }

        const ratingNum = Number(rating);
        const stars = Number.isFinite(ratingNum) ? Math.round(ratingNum) : NaN;
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            return res.status(400).json({ message: "rating must be a whole number from 1 to 5" });
        }

        const product = await Product.findById(productId).select("shop").lean();
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imagePath = req.file ? publicUploadsPath(`/uploads/${req.file.filename}`) : "";

        const clarity = await resolveClarity(userId, productId);

        await Review.create({
            user_id: userId,
            product_id: productId,
            message: text,
            rating: stars,
            image: imagePath,
            clarity,
        });

        await recalculateProductRatings(productId);
        await recalculateShopRating(product.shop);

        const stats = await Product.findById(productId).select("ratings").lean();

        return res.status(201).json({
            message: "Review submitted",
            clarity,
            ratings: stats?.ratings ?? { average: 0, count: 0 },
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "You have already reviewed this product" });
        }
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId, message, rating, removeImage } = req.body;

        if (!mongoose.isValidObjectId(reviewId)) {
            return res.status(400).json({ message: "Invalid review id" });
        }
        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Valid userId is required" });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        if (String(review.user_id) !== String(userId)) {
            return res.status(403).json({ message: "You can only edit your own review" });
        }

        const text = String(message ?? "").trim();
        if (!text) {
            return res.status(400).json({ message: "message is required" });
        }

        const ratingNum = Number(rating);
        const stars = Number.isFinite(ratingNum) ? Math.round(ratingNum) : NaN;
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            return res.status(400).json({ message: "rating must be a whole number from 1 to 5" });
        }

        const productId = review.product_id;
        const clarity = await resolveClarity(userId, productId);

        let nextImage = review.image || "";
        if (req.file) {
            nextImage = publicUploadsPath(`/uploads/${req.file.filename}`);
        } else if (removeImage === true || removeImage === "true") {
            nextImage = "";
        } else if (nextImage) {
            nextImage = publicUploadsPath(nextImage);
        }

        review.message = text;
        review.rating = stars;
        review.image = nextImage;
        review.clarity = clarity;
        await review.save();

        const product = await Product.findById(productId).select("shop").lean();
        if (product) {
            await recalculateProductRatings(productId);
            await recalculateShopRating(product.shop);
        }

        const stats = await Product.findById(productId).select("ratings").lean();
        return res.status(200).json({
            message: "Review updated",
            ratings: stats?.ratings ?? { average: 0, count: 0 },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId } = req.query;

        if (!mongoose.isValidObjectId(reviewId)) {
            return res.status(400).json({ message: "Invalid review id" });
        }
        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Valid userId query parameter is required" });
        }

        const review = await Review.findById(reviewId).lean();
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        if (String(review.user_id) !== String(userId)) {
            return res.status(403).json({ message: "You can only delete your own review" });
        }

        const productId = review.product_id;
        const product = await Product.findById(productId).select("shop").lean();

        await Review.deleteOne({ _id: reviewId });

        if (product) {
            await recalculateProductRatings(productId);
            await recalculateShopRating(product.shop);
        }

        const stats = await Product.findById(productId).select("ratings").lean();
        return res.status(200).json({
            message: "Review deleted",
            ratings: stats?.ratings ?? { average: 0, count: 0 },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
