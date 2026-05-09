
import express from "express";
import notesRoutes from "./routers/notesRoutes.js";
import usersRoutes from "./routers/usersRoutes.js";
import authRoutes from "./routers/authRoutes.js";
import shopsRoutes from "./routers/shopsRoutes.js";
import productsRoutes from "./routers/productsRoutes.js";
import adminRoutes from "./routers/adminRoutes.js";
import chatsRoutes from "./routers/chatsRoutes.js";
import wishlistRoutes from "./routers/wishlistRoutes.js";
import cartRoutes from "./routers/cartRoutes.js";
import contactRoutes from "./routers/contactRoutes.js";
import {connectDB} from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

console.log("MongoDB URI from .env file:", process.env.MONGO_URI);
const port = process.env.PORT || 5001;

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/notes", notesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shops", shopsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);

app.listen(port, () => {
    console.log("Server is running on port " + port);
});


//mongodb+srv://lens:lens@cluster0.mcmzgb7.mongodb.net/?appName=Cluster0