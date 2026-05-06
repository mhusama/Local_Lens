import express from "express";
import { getShops, createShop, getShopsByOwner, getShopById } from "../controllers/shopsController.js";

const router = express.Router();

router.get("/", getShops);
router.post("/", createShop);
router.get("/owner/:ownerId", getShopsByOwner);
router.get("/:shopId", getShopById);

export default router;