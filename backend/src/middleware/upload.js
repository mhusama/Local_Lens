import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const rawName = String(req.body?.name || "product")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        const base = rawName || "product";
        const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
        const index = req._uploadIndex || 0;
        req._uploadIndex = index + 1;
        cb(null, `${base}_${index}_${Date.now()}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        cb(null, true);
        return;
    }
    cb(new Error("Only image files are allowed"));
};

export const uploadProductImages = multer({
    storage,
    fileFilter,
    limits: { files: 3, fileSize: 8 * 1024 * 1024 },
});
