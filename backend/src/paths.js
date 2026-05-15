import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Always `backend/uploads`, regardless of process.cwd() */
export const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");
