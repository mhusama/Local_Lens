import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shopName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
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
    profilePicture: {
        type: String,
        default: null,
    },
    bannerImage: {
        type: String,
        default: null,
    },
    openingHours: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0,
    },
    followers: {
        type: Number,
        default: 0,
        min: 0,
    },
    followerIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    isOpen: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Add index for geospatial queries
shopSchema.index({ location: '2dsphere' });

const Shop = mongoose.model("Shop", shopSchema, "shops");

export default Shop;