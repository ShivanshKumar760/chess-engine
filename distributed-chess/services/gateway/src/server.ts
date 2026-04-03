import express from "express";
import http from "http";
import { connectDB } from "shared/db";
import { initRabbit } from "./rabbit";
import { initWS } from "./ws";
import authRoutes from "./routes/auth";
import gameRoutes from "./routes/game";
import leaderboardRoutes from "./routes/leaderboard";
import cors from "cors";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get("/", (_, res) => res.send("Gateway running"));
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

const start = async () => {
  // Connect to MongoDB
  await connectDB();

  // Connect to RabbitMQ
  await initRabbit();

  // Initialize WebSocket
  initWS(server);

  server.listen(3000, () => {
    console.log("Gateway running on 3000");
  });
};

start();
