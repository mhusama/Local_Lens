import express from "express";
import { getShops, createShop, getShopsByOwner } from "../controllers/shopsController.js";

const router = express.Router();

router.get("/", getShops);
router.post("/", createShop);
router.get("/owner/:ownerId", getShopsByOwner);

export default router;