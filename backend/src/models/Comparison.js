import mongoose from "mongoose";

const comparisonSchema = new mongoose.Schema(
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
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

comparisonSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Comparison = mongoose.model("Comparison", comparisonSchema, "comparisons");

export default Comparison;
