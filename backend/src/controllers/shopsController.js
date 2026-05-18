import Shop from "../models/Shop.js";
import Product from "../models/Product.js";

const normalizeTag = (value) => String(value || "").trim().toLowerCase();

const parseIncomingTags = (rawTags) => {
    if (rawTags == null) return null;
    if (Array.isArray(rawTags)) return rawTags;
    if (typeof rawTags === "string") {
        const trimmed = rawTags.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [trimmed];
        } catch {
            return trimmed.split(",");
        }
    }
    return [];
};

const uniqueTags = (tags) => {
    const seen = new Set();
    const out = [];
    for (const tag of tags) {
        const normalized = normalizeTag(tag);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        out.push(normalized);
    }
    return out;
};

const buildResolvedTags = ({
    title,
    category,
    providedTags,
    existingTags = [],
    existingTitle = "",
    existingCategory = "",
}) => {
    const nextAuto = uniqueTags([title, category]);
    const prevAuto = uniqueTags([existingTitle, existingCategory]);
    let custom = [];
    if (providedTags == null) {
        const prevAutoSet = new Set(prevAuto);
        custom = uniqueTags(existingTags.filter((tag) => !prevAutoSet.has(normalizeTag(tag))));
    } else {
        const nextAutoSet = new Set(nextAuto);
        custom = uniqueTags(providedTags).filter((tag) => !nextAutoSet.has(tag)).slice(0, 8);
    }
    return uniqueTags([...nextAuto, ...custom]);
};

export const getShops = async (req, res) => {
    try {
        const { user_id, q } = req.query;
        const filter = {};
        if (user_id) filter.user_id = user_id;
        if (q) {
            const queryRegex = { $regex: String(q), $options: "i" };
            filter.$or = [
                { shopName: queryRegex },
                { category: queryRegex },
                { tags: queryRegex },
            ];
        }
        const shops = await Shop.find(filter).populate('user_id', 'name email').lean();
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
            openingHours,
            tags,
            rating,
            totalReviews,
            followers,
            isOpen
        } = req.body;

        if (!shopName || !description || !category || !phone || !user_id || !openingHours) {
            return res.status(400).json({ message: "shopName, description, category, phone, user_id, location coordinates, and openingHours are required" });
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

        const uploadedProfilePicture = Array.isArray(req.files?.profilePicture) && req.files.profilePicture[0]
            ? `/uploads/${req.files.profilePicture[0].filename}`
            : null;
        const uploadedBannerImage = Array.isArray(req.files?.bannerImage) && req.files.bannerImage[0]
            ? `/uploads/${req.files.bannerImage[0].filename}`
            : null;
        const parsedIncomingTags = parseIncomingTags(tags);
        const resolvedTags = buildResolvedTags({
            title: shopName,
            category,
            providedTags: parsedIncomingTags,
        });

        const newShop = new Shop({
            user_id,
            shopName,
            description,
            category,
            tags: resolvedTags,
            phone,
            location: {
                type: 'Point',
                coordinates: [lon, lat],
            },
            profilePicture: uploadedProfilePicture,
            bannerImage: uploadedBannerImage,
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

export const getFollowedShops = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const shops = await Shop.find({ followerIds: userId })
            .populate("user_id", "name email")
            .sort({ shopName: 1 })
            .lean();

        return res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const {
            shopName,
            description,
            category,
            phone,
            openingHours,
            longitude,
            latitude,
            location,
            rating,
            totalReviews,
            followers,
            isOpen,
            tags,
        } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        const previousShopName = shop.shopName;
        const previousCategory = shop.category;

        if (shopName !== undefined) shop.shopName = shopName;
        if (description !== undefined) shop.description = description;
        if (category !== undefined) shop.category = category;
        const parsedIncomingTags = parseIncomingTags(tags);
        shop.tags = buildResolvedTags({
            title: shop.shopName,
            category: shop.category,
            providedTags: parsedIncomingTags,
            existingTags: shop.tags || [],
            existingTitle: previousShopName,
            existingCategory: previousCategory,
        });
        if (phone !== undefined) shop.phone = phone;
        if (openingHours !== undefined) shop.openingHours = openingHours;
        if (rating !== undefined) shop.rating = Number(rating) || 0;
        if (totalReviews !== undefined) shop.totalReviews = Number(totalReviews) || 0;
        if (followers !== undefined) shop.followers = Number(followers) || 0;
        if (isOpen !== undefined) {
            shop.isOpen = String(isOpen) === "true" || isOpen === true;
        }

        let lon = longitude !== undefined ? parseFloat(longitude) : null;
        let lat = latitude !== undefined ? parseFloat(latitude) : null;

        if ((!Number.isFinite(lon) || !Number.isFinite(lat)) && Array.isArray(location?.coordinates)) {
            lon = parseFloat(location.coordinates[0]);
            lat = parseFloat(location.coordinates[1]);
        }

        let locationChanged = false;
        let nextLocation = null;
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
            const prevCoords = shop.location?.coordinates;
            const prevLon = Array.isArray(prevCoords) ? parseFloat(prevCoords[0]) : null;
            const prevLat = Array.isArray(prevCoords) ? parseFloat(prevCoords[1]) : null;
            locationChanged =
                !Number.isFinite(prevLon) ||
                !Number.isFinite(prevLat) ||
                prevLon !== lon ||
                prevLat !== lat;
            nextLocation = {
                type: "Point",
                coordinates: [lon, lat],
            };
            shop.location = nextLocation;
        }

        const uploadedProfilePicture = Array.isArray(req.files?.profilePicture) && req.files.profilePicture[0]
            ? `/uploads/${req.files.profilePicture[0].filename}`
            : null;
        const uploadedBannerImage = Array.isArray(req.files?.bannerImage) && req.files.bannerImage[0]
            ? `/uploads/${req.files.bannerImage[0].filename}`
            : null;

        if (uploadedProfilePicture) {
            shop.profilePicture = uploadedProfilePicture;
        }
        if (uploadedBannerImage) {
            shop.bannerImage = uploadedBannerImage;
        }

        await shop.save();

        if (locationChanged && nextLocation) {
            await Product.updateMany({ shop: shop._id }, { $set: { location: nextLocation } });
        }

        await shop.populate("user_id", "name email");

        return res.status(200).json({ message: "Shop updated successfully", shop });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const deleted = await Shop.findByIdAndDelete(shopId);
        if (!deleted) {
            return res.status(404).json({ message: "Shop not found" });
        }
        return res.status(200).json({ message: "Shop deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const followShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { user_id } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        const ownerId = String(shop.user_id);
        if (user_id && String(user_id) === ownerId) {
            return res.status(400).json({ message: "Shop owner cannot follow their own shop" });
        }

        if (user_id) {
            const alreadyFollowing = Array.isArray(shop.followerIds)
                && shop.followerIds.some((id) => String(id) === String(user_id));
            if (alreadyFollowing) {
                return res.status(200).json({ message: "Already following", followers: shop.followers || 0, alreadyFollowing: true });
            }
            shop.followerIds = [...(shop.followerIds || []), user_id];
        }

        shop.followers = Number(shop.followers || 0) + 1;
        await shop.save();

        return res.status(200).json({ message: "Followed shop", followers: shop.followers, alreadyFollowing: false });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};