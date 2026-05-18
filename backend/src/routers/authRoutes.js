import express from "express";
import {
    forgotPassword,
    login,
    resetPassword,
    validateResetToken,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/validate", validateResetToken);
router.post("/reset-password", resetPassword);

export default router;
