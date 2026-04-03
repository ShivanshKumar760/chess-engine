import { WebSocketServer } from "ws";
import { websocketMessage } from "@repo/shared/zod-schema";
import { verifyJwt, extractToken } from "./auth";
import { handleMessage, connections } from "./handlers";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws, req) => {
  if (!req.url) return ws.close(1008, "Missing token");

  const token = extractToken(req.url);
  const decoded = token ? verifyJwt(token) : null;

  if (!decoded || typeof decoded === "string") return ws.close(1008, "Invalid token");

  const payload = decoded as Record<string, unknown>;
  const username = payload.email as string;
  if (!username) return ws.close(1008, "Invalid token payload");

  // Use username as id since the user store lives in the API process
  const user = { id: username, username };

  // Register this connection
  connections.set(user.id, ws);

  console.log("Connected:", user);

  ws.on("error", console.error);

  ws.on("close", () => {
    connections.delete(user.id);
    console.log("Disconnected:", user);
  });

  ws.on("message", (raw) => {
    const { data, success } = websocketMessage.safeParse(
      JSON.parse(raw.toString()),
    );

    if (!success) {
      console.error("Invalid message:", raw.toString());
      return;
    }

    handleMessage(ws, user, data.type, data.payload);
  });
});

console.log("WebSocket server running on ws://localhost:8080");
