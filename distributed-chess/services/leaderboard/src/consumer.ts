import amqp from "amqplib";
import { updateScore } from "./leaderboard";

// FIX (Bug 7): Retry connection with backoff
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
  const conn = await connectWithRetry();
  const ch = await conn.createChannel();

  await ch.assertExchange("chess.events", "fanout", { durable: false });
  const q = await ch.assertQueue("", { exclusive: true });
  await ch.bindQueue(q.queue, "chess.events", "");

  console.log("Leaderboard service listening for game events...");

  ch.consume(
    q.queue,
    (msg) => {
      if (!msg) return;
      const event = JSON.parse(msg.content.toString());

      if (event.type === "GAME_OVER") {
        console.log(`Game over in ${event.gameId} — winner: ${event.winner}`);
        updateScore(event.winner);
      }
      // Exclusive fanout queues auto-ack is fine here; leaderboard is not critical path
    },
    { noAck: true }
  );
};

start();
