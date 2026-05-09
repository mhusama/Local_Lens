import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";

dotenv.config();

const run = async () => {
    try {
        await connectDB();
        const migrateHoursResult = await Product.updateMany(
            {
                $or: [
                    { openingHours: { $exists: false } },
                    { openingHours: "" },
                ],
                openingTime: { $exists: true, $ne: "" },
            },
            [
                {
                    $set: {
                        openingHours: "$openingTime",
                    },
                },
            ],
        );
        const cleanupResult = await Product.updateMany(
            {},
            {
                $unset: {
                    closingTime: "",
                },
            },
        );
        console.log(
            `Migration complete. OpeningHours migrated: ${migrateHoursResult.modifiedCount}, cleanup modified: ${cleanupResult.modifiedCount}`,
        );
    } catch (error) {
        console.error("Migration failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

run();
