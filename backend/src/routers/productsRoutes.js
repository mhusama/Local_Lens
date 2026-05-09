import express from "express";
import { getProducts, createProduct, getProductsByShop, getProductById, searchProducts, updateProduct, deleteProduct } from "../controllers/productsController.js";
import { uploadProductImages } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", uploadProductImages.array("images", 3), createProduct);
router.put("/:productId", uploadProductImages.array("images", 3), updateProduct);
router.delete("/:productId", deleteProduct);
router.get("/shop/:shopId", getProductsByShop);
router.get("/search", searchProducts);
router.get("/:productId", getProductById);

export default router;