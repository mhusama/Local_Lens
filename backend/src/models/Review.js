import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        image: {
            type: String,
            default: "",
        },
        clarity: {
            type: String,
            required: true,
        },
    },
    {
        versionKey: false,
        timestamps: { createdAt: true, updatedAt: false },
    }
);

reviewSchema.index({ product_id: 1, createdAt: -1 });
reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema, "reviews");

export default Review;
