import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Redis from "ioredis";

// Load .env from repo root if REDIS_URL isn't already set
if (!process.env.REDIS_URL) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(__dirname, "../../.env");
  try {
    process.loadEnvFile(envPath);
  } catch {
    // .env file not found — fall back to localhost
  }
}

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL);
