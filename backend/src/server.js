
import express from "express";
import notesRoutes from "./routers/notesRoutes.js";
import {connectDB} from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

console.log("MongoDB URI from .env file:", process.env.MONGO_URI);
const port = process.env.PORT || 5001;

const app = express();
connectDB();


app.use("/api/notes", notesRoutes);

app.listen(port, () => {
    console.log("Server is running on port " + port);
});


//mongodb+srv://lens:lens@cluster0.mcmzgb7.mongodb.net/?appName=Cluster0