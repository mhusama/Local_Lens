//import express from "express";

import express from "express";
import noteRoutes from "./routes/notesRoutes.js";

const app = express();


app.use("/api/notes", noteRoutes);


