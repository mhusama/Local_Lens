import express from "express";
import { getConversation, sendMessage } from "../controllers/chatsController.js";

const router = express.Router();

router.get("/", getConversation);
router.post("/", sendMessage);

export default router;
