import express from "express";
import {
    addComparisonItem,
    clearComparisonItems,
    getComparisonItems,
    removeComparisonItem,
} from "../controllers/compareController.js";

const router = express.Router();

router.get("/", getComparisonItems);
router.post("/", addComparisonItem);
router.delete("/", clearComparisonItems);
router.delete("/:id", removeComparisonItem);

export default router;
