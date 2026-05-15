import express from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
    checkoutFromCart,
    listAllTransactionsAdmin,
    listTransactionsByShop,
    listUserTransactions,
} from "../controllers/transactionsController.js";

const router = express.Router();

router.get("/admin/all", requireAdmin, listAllTransactionsAdmin);
router.get("/by-shop/:shopId", listTransactionsByShop);
router.get("/", listUserTransactions);
router.post("/checkout", checkoutFromCart);

export default router;
