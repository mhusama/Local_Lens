import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        product_Id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false }
);

wishlistSchema.index({ user_id: 1, product_Id: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema, "wishlist");

export default Wishlist;
