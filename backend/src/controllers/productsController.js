import Product from "../models/Product.js";
import Shop from "../models/Shop.js";

const mapProductForClient = (p) => {
    const coords = p.location?.coordinates || p.shop?.location?.coordinates;
    let lat;
    let lon;
    if (Array.isArray(coords) && coords.length >= 2) {
        lon = coords[0];
        lat = coords[1];
    }
    return {
        id: p._id?.toString(),
        name: p.name,
        price: p.price,
        shopName: p.shop?.shopName ?? "Unknown",
        shopId: p.shop?._id?.toString(),
        location: lat != null && lon != null ? { lat, lon } : null,
        openingHours: p.openingHours || p.shop?.openingHours || null,
        tags: Array.isArray(p.tags) ? p.tags : [],
        rating: p.ratings?.average ?? 0,
    };
};

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
        custom = uniqueTags(providedTags).filter((tag) => !nextAutoSet.has(tag)).slice(0, 3);
    }
    return uniqueTags([...nextAuto, ...custom]);
};

const productPopulateSelect = "shopName location openingHours profilePicture bannerImage user_id";

export const getProducts = async (req, res) => {
    try {
        const { name, lat, lon, radius, shop_id, sort } = req.query;
        const nameRegex = name ? { $regex: String(name), $options: "i" } : null;

        if (name != null && lat != null && lon != null && radius != null) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);
            const maxMeters = parseFloat(radius);

            if (Number.isNaN(userLat) || Number.isNaN(userLon) || Number.isNaN(maxMeters)) {
                return res.status(400).json({ message: "Invalid lat, lon, or radius" });
            }

            const products = await Product.find({
                location: {
                    $nearSphere: {
                        $geometry: { type: "Point", coordinates: [userLon, userLat] },
                        $maxDistance: maxMeters,
                    },
                },
                $or: [
                    { name: nameRegex },
                    { category: nameRegex },
                    { tags: nameRegex },
                ],
            })
                .populate("shop", productPopulateSelect)
                .lean();

            const mapped = products.map(mapProductForClient);
            return res.status(200).json({ products: mapped });
        }

        if (shop_id) {
            const sortMap = {
                lowest_price: { price: 1 },
                highest_rating: { "ratings.average": -1 },
                best_discount: { discountPercentage: -1 },
            };
            const sortQuery = sortMap[String(sort || "").toLowerCase()] || { createdAt: -1 };
            const products = await Product.find({ shop: shop_id })
                .sort(sortQuery)
                .populate("shop", productPopulateSelect)
                .lean();
            return res.status(200).json({ products });
        }

        const products = await Product.find()
            .populate("shop", productPopulateSelect)
            .lean();
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, discountType, discountValue, finalPrice, reducedPrice, discountPercentage, category, shop, images, stock, tags, longitude, latitude, openingHours } = req.body;

        if (!name || !description || price === undefined || !category || !shop || longitude === undefined || latitude === undefined) {
            return res.status(400).json({ message: "Name, description, price, category, shop, and location coordinates are required" });
        }

        // Ensure description is an array
        const descriptionArray = Array.isArray(description) ? description : [description];
        const parsedIncomingTags = parseIncomingTags(tags);

        const uploadedImages = Array.isArray(req.files)
            ? req.files.map((f) => `/uploads/${f.filename}`)
            : [];
        const fallbackImages = Array.isArray(images) ? images : [];

        const parsedPrice = parseFloat(price);
        const parsedDiscountValue =
            discountValue !== undefined && discountValue !== '' ? parseFloat(discountValue) : null;
        const parsedFinalPrice =
            finalPrice !== undefined && finalPrice !== '' ? parseFloat(finalPrice) : null;
        const computedDiscountPercentage =
            discountType === "flat" && Number.isFinite(parsedPrice) && parsedPrice > 0 && Number.isFinite(parsedDiscountValue)
                ? Math.max(0, Math.min(100, (parsedDiscountValue / parsedPrice) * 100))
                : null;

        const shopDoc = await Shop.findById(shop).select("_id openingHours");
        if (!shopDoc) {
            return res.status(404).json({ message: "Shop not found" });
        }

        const resolvedTags = buildResolvedTags({
            title: name,
            category,
            providedTags: parsedIncomingTags,
        });

        const newProduct = new Product({
            name,
            description: descriptionArray,
            price: parsedPrice,
            reducedPrice: reducedPrice !== undefined && reducedPrice !== '' ? parseFloat(reducedPrice) : null,
            discountPercentage:
                discountType === "flat"
                    ? computedDiscountPercentage
                    : (discountPercentage !== undefined && discountPercentage !== '' ? parseFloat(discountPercentage) : null),
            discountType: discountType || null,
            discountValue: Number.isFinite(parsedDiscountValue) ? parsedDiscountValue : null,
            finalPrice: Number.isFinite(parsedFinalPrice) ? parsedFinalPrice : null,
            category,
            tags: resolvedTags,
            shop,
            images: uploadedImages.length > 0 ? uploadedImages : fallbackImages,
            stock: stock ? parseInt(stock) : 0,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            openingHours: String(openingHours || shopDoc.openingHours || "").trim(),
        });

        await newProduct.save();

        // Populate shop info in response
        await newProduct.populate('shop', productPopulateSelect);

        res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getProductsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const products = await Product.find({ shop: shopId })
            .populate('shop', productPopulateSelect)
            .lean();
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId)
            .populate('shop', productPopulateSelect)
            .lean();
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        return res.status(200).json({ product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const { query, category, minPrice, maxPrice } = req.query;

        let filter = {};

        // Text search in name/category/tags
        if (query) {
            const regex = { $regex: String(query), $options: "i" };
            filter.$or = [
                { name: regex },
                { category: regex },
                { tags: regex },
            ];
        }

        // Category filter
        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        const products = await Product.find(filter)
            .populate('shop', productPopulateSelect)
            .lean();
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, description, price, discountType, discountValue, finalPrice, reducedPrice, discountPercentage, category, images, stock, tags, longitude, latitude, location, openingHours } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });
        const previousName = product.name;
        const previousCategory = product.category;

        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = Array.isArray(description) ? description : [description];
        if (price !== undefined) product.price = parseFloat(price);
        if (discountType !== undefined) product.discountType = discountType || null;
        if (discountValue !== undefined) {
            product.discountValue = discountValue === '' || discountValue === null ? null : parseFloat(discountValue);
        }
        if (finalPrice !== undefined) {
            product.finalPrice = finalPrice === '' || finalPrice === null ? null : parseFloat(finalPrice);
        }
        if (reducedPrice !== undefined) {
            product.reducedPrice = reducedPrice === '' || reducedPrice === null ? null : parseFloat(reducedPrice);
        }
        if (discountPercentage !== undefined) {
            product.discountPercentage = discountPercentage === '' || discountPercentage === null ? null : parseFloat(discountPercentage);
        }
        if (
            product.discountType === "flat"
            && Number.isFinite(Number(product.price))
            && Number(product.price) > 0
            && Number.isFinite(Number(product.discountValue))
        ) {
            product.discountPercentage = Math.max(
                0,
                Math.min(100, (Number(product.discountValue) / Number(product.price)) * 100),
            );
        }
        if (category !== undefined) product.category = category;
        const parsedIncomingTags = parseIncomingTags(tags);
        product.tags = buildResolvedTags({
            title: product.name,
            category: product.category,
            providedTags: parsedIncomingTags,
            existingTags: product.tags || [],
            existingTitle: previousName,
            existingCategory: previousCategory,
        });
        const uploadedImages = Array.isArray(req.files)
            ? req.files.map((f) => `/uploads/${f.filename}`)
            : [];
        if (uploadedImages.length > 0) {
            product.images = uploadedImages;
        } else if (images !== undefined) {
            product.images = Array.isArray(images) ? images : [];
        }
        if (stock !== undefined) product.stock = parseInt(stock) || 0;
        if (openingHours !== undefined) {
            product.openingHours = String(openingHours || "").trim();
        }
        let lon = longitude !== undefined ? parseFloat(longitude) : null;
        let lat = latitude !== undefined ? parseFloat(latitude) : null;
        if ((!Number.isFinite(lon) || !Number.isFinite(lat)) && Array.isArray(location?.coordinates)) {
            lon = parseFloat(location.coordinates[0]);
            lat = parseFloat(location.coordinates[1]);
        }
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
            product.location = { type: 'Point', coordinates: [lon, lat] };
        }

        await product.save();
        await product.populate('shop', productPopulateSelect);

        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const deleted = await Product.findByIdAndDelete(productId);
        if (!deleted) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};