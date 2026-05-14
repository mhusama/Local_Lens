import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reportedEntityType: {
        type: String,
        enum: ["user", "shop", "product"],
        required: true,
    },
    reportedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
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
});

const Report = mongoose.model("Report", reportSchema, "reports");

export default Report;
