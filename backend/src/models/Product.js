import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        required: true,
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    image: {
        type: String, // URL to product image
        default: null,
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    unit: {
        type: String, // kg, pieces, liters, etc.
        default: 'pieces',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Product = mongoose.model("Product", productSchema);

export default Product;