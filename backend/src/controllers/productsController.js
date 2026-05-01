import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('shop', 'name address location');
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, shop, image, stock, unit } = req.body;

        if (!name || !description || price === undefined || !category || !shop) {
            return res.status(400).json({ message: "Name, description, price, category, and shop are required" });
        }

        const newProduct = new Product({
            name,
            description,
            price: parseFloat(price),
            category,
            shop,
            image: image || null,
            stock: stock ? parseInt(stock) : 0,
            unit: unit || 'pieces',
        });

        await newProduct.save();

        // Populate shop info in response
        await newProduct.populate('shop', 'name address location');

        res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getProductsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const products = await Product.find({ shop: shopId }).populate('shop', 'name address location');
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
                { description: { $regex: query, $options: 'i' } }
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

        const products = await Product.find(filter).populate('shop', 'name address location');
        res.status(200).json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};