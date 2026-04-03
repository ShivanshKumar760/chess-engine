import amqp from "amqplib";
import { connectDB } from "shared/db";
import { Game } from "shared/models/Game";
import { processMove } from "./engine";
import { removeGame } from "./state";

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
  await connectDB();

  const conn = await connectWithRetry();
  const ch = await conn.createChannel();

  const queue = `chess.moves.${PARTITION}`;
  await ch.assertQueue(queue, { durable: true });
  await ch.assertExchange("chess.events", "fanout", { durable: false });

  console.log(`Engine running on partition ${PARTITION} (queue: ${queue})`);

  ch.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        const result = processMove(event);

        if (result.error) {
          ch.ack(msg);
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

        if (result.gameOver) {
          if (result.isCheckmate && result.winner && result.loser) {
            ch.publish(
              "chess.events",
              "",
              Buffer.from(
                JSON.stringify({
                  type: "GAME_OVER",
                  gameId: event.gameId,
                  winner: result.winner,
                  loser: result.loser,
                  winnerColor: result.winnerColor,
                  finalFen: result.fen,
                })
              )
            );

            await Game.findOneAndUpdate(
              { gameId: event.gameId },
              { status: "completed", winner: result.winner, finalFen: result.fen }
            );
          } else if (result.isDraw) {
            ch.publish(
              "chess.events",
              "",
              Buffer.from(
                JSON.stringify({
                  type: "GAME_OVER",
                  gameId: event.gameId,
                  winner: "draw",
                  loser: null,
                  winnerColor: null,
                  finalFen: result.fen,
                })
              )
            );

            await Game.findOneAndUpdate(
              { gameId: event.gameId },
              { status: "completed", winner: "draw", finalFen: result.fen }
            );
          }

          removeGame(event.gameId);
        }

        ch.ack(msg);
      } catch (err) {
        console.error("Error processing move:", err);
        ch.ack(msg);
      }
    },
    { noAck: false }
  );
};

start();