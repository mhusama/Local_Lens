import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            default: "",
            maxlength: 5000,
        },
        status: {
            type: String,
            enum: ["pending", "reviewing", "resolved", "dismissed"],
            default: "pending",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { versionKey: false }
);

reportSchema.index({ shopId: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema, "reports");

export default Report;
