import express from "express";
import { getProducts, createProduct, getProductsByShop, searchProducts } from "../controllers/productsController.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", createProduct);
router.get("/shop/:shopId", getProductsByShop);
router.get("/search", searchProducts);

export default router;