import amqp from "amqplib";
import { connectDB } from "shared/db";
import { Game } from "shared/models/Game";
import { updateScore, updateDraw } from "./leaderboard";

// Retry connection with backoff
const connectWithRetry = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await amqp.connect("amqp://localhost");
    } catch (err) {
      console.error(`RabbitMQ not ready, retrying (${i + 1}/${retries})...`);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Failed to connect to RabbitMQ");
};

const start = async () => {
  // Connect to MongoDB
  await connectDB();

  const conn = await connectWithRetry();
  const ch = await conn.createChannel();

  await ch.assertExchange("chess.events", "fanout", { durable: false });
  const q = await ch.assertQueue("", { exclusive: true });
  await ch.bindQueue(q.queue, "chess.events", "");

  console.log("Leaderboard service listening for game events...");

  ch.consume(
    q.queue,
    async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());

        if (event.type === "GAME_OVER") {
          console.log(
            `Game over in ${event.gameId} — winner: ${event.winner}`
          );

          if (event.winner === "draw") {
            // For draws, look up both players from the game document
            const game = await Game.findOne({ gameId: event.gameId });
            if (game && game.whitePlayer && game.blackPlayer) {
              await updateDraw(game.whitePlayer, game.blackPlayer);
            }
          } else {
            // Checkmate — update winner and loser
            await updateScore(event.winner, event.loser);
          }
        }
      } catch (err) {
        console.error("Error processing leaderboard event:", err);
      }
    },
    { noAck: true }
  );
};

start();
