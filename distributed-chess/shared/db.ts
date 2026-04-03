import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/chess";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
