import express from "express";
import {
    addCartItem,
    clearCart,
    decreaseCartItemQuantity,
    getCartItems,
    increaseCartItemQuantity,
    removeCartItem
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/", getCartItems);
router.post("/", addCartItem);
router.patch("/:id/increase", increaseCartItemQuantity);
router.patch("/:id/decrease", decreaseCartItemQuantity);
router.delete("/", clearCart);
router.delete("/:id", removeCartItem);

export default router;
