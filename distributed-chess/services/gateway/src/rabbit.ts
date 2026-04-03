import amqp from "amqplib";
import { hashGame } from "shared/hash";

let channel: amqp.Channel;
const PARTITIONS = 3;

const connectWithRetry = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await amqp.connect("amqp://localhost");
    } catch (err) {
      console.error(`RabbitMQ connection failed (attempt ${i + 1}/${retries}):`, err);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Failed to connect to RabbitMQ after multiple attempts");
};

export const initRabbit = async () => {
  const conn = await connectWithRetry();
  if (!conn) throw new Error("RabbitMQ connection is undefined");

  channel = await conn.createChannel();
  for (let i = 0; i < PARTITIONS; i++) {
    await channel.assertQueue(`chess.moves.${i}`, { durable: true });
  }
  await channel.assertExchange("chess.events", "fanout", { durable: false });
};

export const publishMove = async (msg: any) => {
  const index = hashGame(msg.gameId, PARTITIONS);
  channel.sendToQueue(
    `chess.moves.${index}`,
    Buffer.from(JSON.stringify(msg)),
    { persistent: true }
  );
};

export const subscribeEvents = async (cb: (msg: any) => void) => {
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, "chess.events", "");
  channel.consume(
    q.queue,
    (msg) => {
      if (msg) cb(JSON.parse(msg.content.toString()));
    },
    { noAck: true }
  );
};