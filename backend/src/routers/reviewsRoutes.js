import express from "express";
import { createReview, deleteReview, listReviewsForProduct, updateReview } from "../controllers/reviewsController.js";
import { uploadReviewImage } from "../middleware/upload.js";

const router = express.Router();

router.get("/", listReviewsForProduct);

const maybeReviewUpload = (req, res, next) => {
    const ct = String(req.headers["content-type"] || "");
    if (ct.includes("multipart/form-data")) {
        return uploadReviewImage.single("image")(req, res, next);
    }
    return next();
};

router.post("/", maybeReviewUpload, createReview);
router.put("/:reviewId", maybeReviewUpload, updateReview);
router.delete("/:reviewId", deleteReview);

export default router;
