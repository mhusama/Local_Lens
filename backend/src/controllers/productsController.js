import Product from "../models/Product.js";

const mapProductForClient = (p) => {
    const coords = p.location?.coordinates;
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
        location: lat != null && lon != null ? { lat, lon } : null,
        rating: p.ratings?.average ?? 0,
    };
};

export const getProducts = async (req, res) => {
    try {
        const { name, lat, lon, radius } = req.query;

        if (name != null && lat != null && lon != null && radius != null) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);
            const maxMeters = parseFloat(radius);

            if (Number.isNaN(userLat) || Number.isNaN(userLon) || Number.isNaN(maxMeters)) {
                return res.status(400).json({ message: "Invalid lat, lon, or radius" });
            }

            const products = await Product.find({
                name: { $regex: String(name), $options: "i" },
                location: {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [userLon, userLat],
                        },
                        $maxDistance: maxMeters,
                    },
                },
            }).populate("shop", "shopName address location");

            const mapped = products.map(mapProductForClient);
            return res.status(200).json({ products: mapped });
        }

        const products = await Product.find().populate("shop", "shopName address location");
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, shop, images, stock, longitude, latitude } = req.body;

        if (!name || !description || price === undefined || !category || !shop || longitude === undefined || latitude === undefined) {
            return res.status(400).json({ message: "Name, description, price, category, shop, and location coordinates are required" });
        }

        // Ensure description is an array
        const descriptionArray = Array.isArray(description) ? description : [description];

        const newProduct = new Product({
            name,
            description: descriptionArray,
            price: parseFloat(price),
            category,
            shop,
            images: images || [],
            stock: stock ? parseInt(stock) : 0,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
        });

        await newProduct.save();

        // Populate shop info in response
        await newProduct.populate('shop', 'shopName address location');

        res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getProductsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const products = await Product.find({ shop: shopId }).populate('shop', 'shopName address location');
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const { query, category, minPrice, maxPrice } = req.query;

        let filter = {};

        // Text search in name and description
        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $elemMatch: { $regex: query, $options: 'i' } } }
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

        const products = await Product.find(filter).populate('shop', 'shopName address location');
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};