import express from "express";
import {
    addWishlistItem,
    clearWishlist,
    getWishlistItems,
    removeWishlistItem,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.get("/", getWishlistItems);
router.post("/", addWishlistItem);
router.delete("/", clearWishlist);
router.delete("/:wishlistId", removeWishlistItem);

export default router;
