import express from "express";
import { getShops, createShop, getShopsByOwner, getShopById, updateShop, deleteShop, followShop } from "../controllers/shopsController.js";
import { uploadProductImages } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getShops);
router.post(
    "/",
    uploadProductImages.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "bannerImage", maxCount: 1 },
    ]),
    createShop,
);
router.get("/owner/:ownerId", getShopsByOwner);
router.get("/:shopId", getShopById);
router.put(
    "/:shopId",
    uploadProductImages.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "bannerImage", maxCount: 1 },
    ]),
    updateShop,
);
router.delete("/:shopId", deleteShop);
router.post("/:shopId/follow", followShop);

export default router;