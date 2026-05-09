import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: [String], // Array of description points
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    reducedPrice: {
        type: Number,
        min: 0,
        default: null,
    },
    discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
    },
    discountType: {
        type: String,
        enum: ['flat', 'percentage'],
        default: null,
    },
    discountValue: {
        type: Number,
        min: 0,
        default: null,
    },
    finalPrice: {
        type: Number,
        min: 0,
        default: null,
    },
    category: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    images: {
        type: [String], // Array of image URLs
        default: [],
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        count: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    reviews: [{
        user: {
            type: String, // User's name
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
    }],
    totalPurchases: {
        type: Number,
        default: 0,
        min: 0,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
    openingHours: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

productSchema.index({ location: '2dsphere' });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ shop: 1, createdAt: -1 });

const Product = mongoose.model("Product", productSchema, "products");

export default Product;