import amqp from "amqplib";
import { processMove } from "./engine";

const PARTITION = process.env.PARTITION || "0";

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

  const queue = `chess.moves.${PARTITION}`;
  await ch.assertQueue(queue, { durable: true });
  await ch.assertExchange("chess.events", "fanout", { durable: false });

  console.log(`Engine running on partition ${PARTITION} (queue: ${queue})`);

  ch.consume(
    queue,
    (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        const result = processMove(event);

        if (result.error) {
          ch.ack(msg); // invalid move — discard, never requeue
          return;
        }

        ch.publish(
          "chess.events",
          "",
          Buffer.from(
            JSON.stringify({
              type: "GAME_UPDATE",
              gameId: event.gameId,
              fen: result.fen,
              gameOver: result.gameOver,
            })
          )
        );

        if (result.gameOver && result.winner) {
          ch.publish(
            "chess.events",
            "",
            Buffer.from(
              JSON.stringify({
                type: "GAME_OVER",
                gameId: event.gameId,
                winner: result.winner,
              })
            )
          );
        }

        ch.ack(msg);
      } catch (err) {
        console.error("Error processing move:", err);
        // ✅ ACK (discard) instead of NACK — prevents infinite requeue loops
        // chess.js v1.x throws on illegal moves, which would loop forever with nack
        ch.ack(msg);
      }
    },
    { noAck: false }
  );
};

start();
