
import express from "express";
import notesRoutes from "./routers/notesRoutes.js";

const app = express();


app.use("/api/notes", notesRoutes);

app.listen(5001, () => {
    console.log("Server is running on port 5001");
});


//mongodb+srv://lens:lens@cluster0.mcmzgb7.mongodb.net/?appName=Cluster0