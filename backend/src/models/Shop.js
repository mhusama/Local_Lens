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
    tags: {
        type: [String],
        default: [],
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
shopSchema.index({ shopName: 1 });
shopSchema.index({ category: 1 });
shopSchema.index({ tags: 1 });

const Shop = mongoose.model("Shop", shopSchema, "shops");

export default Shop;