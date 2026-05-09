import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },
        priceAtAddition: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

cartSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Cart = mongoose.model("Cart", cartSchema, "carts");

export default Cart;
