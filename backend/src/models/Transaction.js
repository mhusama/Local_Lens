import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
        },
        productName: { type: String, required: true },
        shopName: { type: String, default: "" },
        imageSnapshot: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: {
            type: [lineItemSchema],
            required: true,
        },
        subtotal: { type: Number, required: true, min: 0 },
        deliveryFee: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            default: null,
            index: true,
        },
        shopIds: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Shop",
            default: [],
        },
        status: {
            type: String,
            enum: ["completed", "cancelled"],
            default: "completed",
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ shopIds: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema, "transactions");

export default Transaction;
