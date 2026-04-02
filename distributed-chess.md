# 🧠 Distributed Chess — Project Documentation

---

## 🏗️ Project Structure

```
distributed-chess/
│
├── shared/
│   ├── hash.ts
│   └── types.ts
│
├── services/
│
│   ├── gateway/
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── ws.ts
│   │   │   └── rabbit.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│
│   ├── game-engine/
│   │   ├── src/
│   │   │   ├── consumer.ts
│   │   │   ├── engine.ts
│   │   │   └── state.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│
│   ├── leaderboard/
│   │   ├── src/
│   │   │   ├── consumer.ts
│   │   │   └── leaderboard.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│
├── docker-compose.yml
└── package.json
```

---

## ⚙️ Root Setup

### `package.json` (root)

```json
{
  "name": "distributed-chess",
  "private": true,
  "workspaces": ["services/*"],
  "scripts": {
    "dev:gateway": "cd services/gateway && npx ts-node-dev src/server.ts",
    "dev:engine0": "cd services/game-engine && PARTITION=0 npx ts-node-dev src/consumer.ts",
    "dev:engine1": "cd services/game-engine && PARTITION=1 npx ts-node-dev src/consumer.ts",
    "dev:engine2": "cd services/game-engine && PARTITION=2 npx ts-node-dev src/consumer.ts",
    "dev:leaderboard": "cd services/leaderboard && npx ts-node-dev src/consumer.ts"
  }
}
```

### `docker-compose.yml`

```yaml
version: "3"
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

---

## 🧩 Shared Files

### `shared/hash.ts`

```typescript
export const hashGame = (gameId: string, partitions: number) => {
  let hash = 0;
  for (let i = 0; i < gameId.length; i++) {
    hash = (hash * 31 + gameId.charCodeAt(i)) % partitions;
  }
  return hash;
};
```

### `shared/types.ts`

```typescript
export type MoveEvent = {
  type: "MOVE";
  gameId: string;
  playerId: string;
  move: { from: string; to: string };
};
```

---

## 🚪 Gateway Service

### `services/gateway/package.json`

```json
{
  "name": "gateway",
  "dependencies": {
    "amqplib": "^0.10.3",
    "express": "^4.18.2",
    "ws": "^8.13.0"
  },
  "devDependencies": {
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0",
    "@types/ws": "^8.5.0",
    "@types/node": "^20.0.0"
  }
}
```

### `services/gateway/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true
  }
}
```

### `gateway/src/rabbit.ts`

```typescript
import amqp from "amqplib";
import { hashGame } from "../../../shared/hash";

let channel: amqp.Channel;
const PARTITIONS = 3;

export const initRabbit = async () => {
  const conn = await amqp.connect("amqp://localhost");
  channel = await conn.createChannel();

  for (let i = 0; i < PARTITIONS; i++) {
    await channel.assertQueue(`chess.moves.${i}`);
  }

  await channel.assertExchange("chess.events", "fanout", {
    durable: false
  });
};

export const publishMove = (msg: any) => {
  const index = hashGame(msg.gameId, PARTITIONS);

  channel.sendToQueue(
    `chess.moves.${index}`,
    Buffer.from(JSON.stringify(msg))
  );
};

export const subscribeEvents = async (cb: (msg: any) => void) => {
  const q = await channel.assertQueue("", { exclusive: true });

  await channel.bindQueue(q.queue, "chess.events", "");

  channel.consume(q.queue, (msg) => {
    if (msg) cb(JSON.parse(msg.content.toString()));
  }, { noAck: true });
};
```

### `gateway/src/ws.ts`

```typescript
import { WebSocketServer } from "ws";
import { publishMove, subscribeEvents } from "./rabbit";

const clients = new Map<string, any>();
const gameRooms = new Map<string, string[]>();

export const initWS = (server: any) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    const playerId = crypto.randomUUID();
    clients.set(playerId, ws);

    ws.on("message", (msg) => {
      const data = JSON.parse(msg.toString());

      if (data.type === "JOIN") {
        if (!gameRooms.has(data.gameId)) {
          gameRooms.set(data.gameId, []);
        }
        gameRooms.get(data.gameId)!.push(playerId);
      }

      if (data.type === "MOVE") {
        publishMove({ ...data, playerId });
      }
    });
  });

  subscribeEvents((event) => {
    const players = gameRooms.get(event.gameId) || [];

    players.forEach((playerId) => {
      clients.get(playerId)?.send(JSON.stringify(event));
    });
  });
};
```

### `gateway/src/server.ts`

```typescript
import express from "express";
import http from "http";
import { initRabbit } from "./rabbit";
import { initWS } from "./ws";

const app = express();
const server = http.createServer(app);

app.get("/", (_, res) => res.send("Gateway running"));

const start = async () => {
  await initRabbit();
  initWS(server);

  server.listen(3000, () => {
    console.log("Gateway running on 3000");
  });
};

start();
```

---

## ♟️ Game Engine

### `services/game-engine/package.json`

```json
{
  "dependencies": {
    "amqplib": "^0.10.3",
    "chess.js": "^1.0.0"
  },
  "devDependencies": {
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### `services/game-engine/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true
  }
}
```

### `game-engine/src/state.ts`

```typescript
import { Chess } from "chess.js";

const games = new Map<string, Chess>();

export const getGame = (id: string) => {
  if (!games.has(id)) {
    games.set(id, new Chess());
  }
  return games.get(id)!;
};
```

### `game-engine/src/engine.ts`

```typescript
import { getGame } from "./state";

export const processMove = (event: any) => {
  const game = getGame(event.gameId);

  const move = game.move(event.move);

  if (!move) return { error: true };

  return {
    fen: game.fen(),
    gameOver: game.isGameOver(),
    winner: game.turn() === "w" ? "b" : "w"
  };
};
```

### `game-engine/src/consumer.ts`

```typescript
import amqp from "amqplib";
import { processMove } from "./engine";

const PARTITION = process.env.PARTITION || "0";

const start = async () => {
  const conn = await amqp.connect("amqp://localhost");
  const ch = await conn.createChannel();

  const queue = `chess.moves.${PARTITION}`;
  await ch.assertQueue(queue);

  await ch.assertExchange("chess.events", "fanout", {
    durable: false
  });

  console.log(`Engine running on ${queue}`);

  ch.consume(queue, (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    const result = processMove(event);

    if (result.error) return;

    ch.publish("chess.events", "", Buffer.from(JSON.stringify({
      type: "GAME_UPDATE",
      gameId: event.gameId,
      fen: result.fen
    })));

  }, { noAck: true });
};

start();
```

---

## 🏆 Leaderboard

### `services/leaderboard/package.json`

```json
{
  "dependencies": {
    "amqplib": "^0.10.3"
  },
  "devDependencies": {
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### `services/leaderboard/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true
  }
}
```

### `leaderboard/src/leaderboard.ts`

```typescript
const scores = new Map<string, number>();

export const updateScore = (playerId: string) => {
  scores.set(playerId, (scores.get(playerId) || 0) + 1);
};
```

### `leaderboard/src/consumer.ts`

```typescript
import amqp from "amqplib";
import { updateScore } from "./leaderboard";

const start = async () => {
  const conn = await amqp.connect("amqp://localhost");
  const ch = await conn.createChannel();

  await ch.assertExchange("chess.events", "fanout", {
    durable: false
  });

  const q = await ch.assertQueue("", { exclusive: true });
  await ch.bindQueue(q.queue, "chess.events", "");

  ch.consume(q.queue, (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());

    if (event.type === "GAME_OVER") {
      updateScore(event.winner);
    }

  }, { noAck: true });
};

start();
```

---

## ▶️ Run Commands (Step-by-Step)

### 1. Start RabbitMQ

```bash
docker-compose up -d
```

### 2. Install Dependencies

Run inside each service directory:

```bash
cd services/gateway && npm install
cd ../game-engine && npm install
cd ../leaderboard && npm install
```

### 3. Start Services (4 terminals)

**Gateway**
```bash
npm run dev:gateway
```

**Engines**
```bash
npm run dev:engine0
npm run dev:engine1
npm run dev:engine2
```

**Leaderboard**
```bash
npm run dev:leaderboard
```

---

## 🧠 Final Result

This project gives you a fully distributed chess backend with:

- ✅ Distributed system
- ✅ Sticky routing
- ✅ Event-driven architecture
- ✅ Scalable chess backend
