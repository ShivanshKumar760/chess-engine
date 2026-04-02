import { WebSocketServer } from "ws";
import { randomUUID } from "crypto"; // FIX (Bug 4): explicit import
import { publishMove, subscribeEvents } from "./rabbit";

const clients = new Map<string, any>();
const gameRooms = new Map<string, string[]>();

export const initWS = (server: any) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    const playerId = randomUUID(); // FIX (Bug 4): use imported randomUUID
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

    // FIX (Bug 3): Clean up disconnected clients to prevent memory leak
    ws.on("close", () => {
      clients.delete(playerId);
      for (const [gameId, players] of gameRooms.entries()) {
        const updated = players.filter((id) => id !== playerId);
        if (updated.length === 0) {
          gameRooms.delete(gameId);
        } else {
          gameRooms.set(gameId, updated);
        }
      }
      console.log(`Player ${playerId} disconnected and cleaned up`);
    });
  });

  subscribeEvents((event) => {
    const players = gameRooms.get(event.gameId) || [];
    players.forEach((pid) => {
      clients.get(pid)?.send(JSON.stringify(event));
    });
  });
};
