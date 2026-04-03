// import { WebSocketServer } from "ws";
// import { publishMove, subscribeEvents } from "./rabbit";
// import { verifyToken } from "./middleware/auth";
// import { Game } from "shared/models/Game";

// const clients = new Map<string, any>();
// const gameRooms = new Map<
//   string,
//   { players: string[]; playerColors: Map<string, "w" | "b"> }
// >();

// export const initWS = (server: any) => {
//   const wss = new WebSocketServer({ server, path: "/game-ws" });

//   wss.on("connection", (ws, req) => {
//     const url = new URL(req.url || "", `http://${req.headers.host}`);
//     const token = url.searchParams.get("token");

//     if (!token) {
//       ws.send(
//         JSON.stringify({
//           type: "ERROR",
//           message: "Authentication required. Provide ?token=<JWT>",
//         })
//       );
//       ws.close(1008, "Authentication required");
//       return;
//     }

//     const decoded = verifyToken(token);
//     if (!decoded) {
//       ws.send(
//         JSON.stringify({ type: "ERROR", message: "Invalid or expired token" })
//       );
//       ws.close(1008, "Invalid token");
//       return;
//     }

//     const { userId, username } = decoded;
//     clients.set(username, ws);
//     console.log(`Player ${username} connected via WebSocket`);

//     ws.send(JSON.stringify({ type: "AUTH_SUCCESS", username }));

//     ws.on("message", async (msg) => {
//       try {
//         const data = JSON.parse(msg.toString());

//         if (data.type === "JOIN") {
//           const gameId = data.gameId;

//           const game = await Game.findOne({ gameId });
//           if (!game) {
//             ws.send(
//               JSON.stringify({ type: "ERROR", message: "Game not found" })
//             );
//             return;
//           }

//           // Only block strangers from joining a waiting game, not the creator
//           if (game.status === "waiting" && game.whitePlayer !== username) {
//             ws.send(
//               JSON.stringify({
//                 type: "ERROR",
//                 message:
//                   "Game is waiting for an opponent. Share the game ID for someone to join.",
//               })
//             );
//             return;
//           }

//           if (game.whitePlayer !== username && game.blackPlayer !== username) {
//             ws.send(
//               JSON.stringify({
//                 type: "ERROR",
//                 message: "You are not a participant in this game",
//               })
//             );
//             return;
//           }

//           if (!gameRooms.has(gameId)) {
//             const playerColors = new Map<string, "w" | "b">();
//             playerColors.set(game.whitePlayer, "w");
//             if (game.blackPlayer) {
//               playerColors.set(game.blackPlayer, "b");
//             }
//             gameRooms.set(gameId, { players: [], playerColors });
//           }

//           const room = gameRooms.get(gameId)!;
//           if (!room.players.includes(username)) {
//             room.players.push(username);
//           }

//           const color = room.playerColors.get(username) || "spectator";
//           ws.send(
//             JSON.stringify({
//               type: "JOINED",
//               gameId,
//               color,
//               whitePlayer: game.whitePlayer,
//               blackPlayer: game.blackPlayer,
//             })
//           );
//         }

//         if (data.type === "MOVE") {
//           const gameId = data.gameId;
//           const room = gameRooms.get(gameId);

//           if (!room || !room.players.includes(username)) {
//             ws.send(
//               JSON.stringify({
//                 type: "ERROR",
//                 message: "You must JOIN the game first",
//               })
//             );
//             return;
//           }

//           await Game.findOneAndUpdate(
//             { gameId },
//             {
//               $push: {
//                 moves: {
//                   from: data.move.from,
//                   to: data.move.to,
//                   player: username,
//                   timestamp: new Date(),
//                 },
//               },
//             }
//           );

//           const playerColor = room.playerColors.get(username);
//           publishMove({
//             ...data,
//             playerId: userId,
//             username,
//             playerColor,
//             whitePlayer: [...room.playerColors.entries()].find(
//               ([_, c]) => c === "w"
//             )?.[0],
//             blackPlayer: [...room.playerColors.entries()].find(
//               ([_, c]) => c === "b"
//             )?.[0],
//           });
//         }
//       } catch (err) {
//         console.error("WS message error:", err);
//         ws.send(
//           JSON.stringify({ type: "ERROR", message: "Invalid message format" })
//         );
//       }
//     });

//     ws.on("close", () => {
//       clients.delete(username);
//       for (const [gameId, room] of gameRooms.entries()) {
//         room.players = room.players.filter((p) => p !== username);
//         if (room.players.length === 0) {
//           gameRooms.delete(gameId);
//         }
//       }
//       console.log(`Player ${username} disconnected and cleaned up`);
//     });
//   });

//   subscribeEvents((event) => {
//     const room = gameRooms.get(event.gameId);
//     if (!room) return;

//     room.players.forEach((playerUsername) => {
//       clients.get(playerUsername)?.send(JSON.stringify(event));
//     });
//   });
// };

import { WebSocketServer } from "ws";
import { publishMove, subscribeEvents } from "./rabbit";
import { verifyToken } from "./middleware/auth";
import { Game } from "shared/models/Game";
import { Chess } from "chess.js";

const clients = new Map<string, any>();
const gameRooms = new Map<
  string,
  { players: string[]; playerColors: Map<string, "w" | "b"> }
>();

export const initWS = (server: any) => {
  const wss = new WebSocketServer({ server, path: "/game-ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Authentication required. Provide ?token=<JWT>",
        })
      );
      ws.close(1008, "Authentication required");
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Invalid or expired token" })
      );
      ws.close(1008, "Invalid token");
      return;
    }

    const { userId, username } = decoded;
    clients.set(username, ws);
    console.log(`Player ${username} connected via WebSocket`);

    ws.send(JSON.stringify({ type: "AUTH_SUCCESS", username }));

    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg.toString());

        if (data.type === "JOIN") {
          const gameId = data.gameId;

          const game = await Game.findOne({ gameId });
          if (!game) {
            ws.send(
              JSON.stringify({ type: "ERROR", message: "Game not found" })
            );
            return;
          }

          // Only block strangers from a waiting game — the creator (whitePlayer) can always join
          if (game.status === "waiting" && game.whitePlayer !== username) {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message:
                  "Game is waiting for an opponent. Share the game ID for someone to join.",
              })
            );
            return;
          }

          if (game.whitePlayer !== username && game.blackPlayer !== username) {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "You are not a participant in this game",
              })
            );
            return;
          }

          // Always rebuild the room so playerColors is always up to date
          // This handles the case where black player joined via HTTP after room was created
          if (!gameRooms.has(gameId)) {
            const playerColors = new Map<string, "w" | "b">();
            playerColors.set(game.whitePlayer, "w");
            if (game.blackPlayer) {
              playerColors.set(game.blackPlayer, "b");
            }
            gameRooms.set(gameId, { players: [], playerColors });
          } else {
            // Room exists — ensure black player is in the color map (may have joined via HTTP after room was created)
            const room = gameRooms.get(gameId)!;
            if (game.blackPlayer && !room.playerColors.has(game.blackPlayer)) {
              room.playerColors.set(game.blackPlayer, "b");
            }
          }

          const room = gameRooms.get(gameId)!;
          if (!room.players.includes(username)) {
            room.players.push(username);
          }

          // Determine color — always from playerColors map which is now guaranteed correct
          const color = room.playerColors.get(username) || "w";

          // Restore board state from MongoDB moves so refresh works
          // Replay all stored moves to reconstruct the FEN
          let currentFen = "start";
          if (game.moves && game.moves.length > 0) {
            try {
              const chess = new Chess();
              for (const move of game.moves) {
                chess.move({ from: move.from, to: move.to, promotion: "q" });
              }
              currentFen = chess.fen();
            } catch (err) {
              console.error("Error replaying moves for FEN restore:", err);
              currentFen = "start";
            }
          }

          // Send JOINED with full board state so frontend can restore on refresh
          ws.send(
            JSON.stringify({
              type: "JOINED",
              gameId,
              color,
              whitePlayer: game.whitePlayer,
              blackPlayer: game.blackPlayer,
              fen: currentFen,
              status: game.status,
              winner: game.winner || null,
            })
          );
        }

        if (data.type === "MOVE") {
          const gameId = data.gameId;
          const room = gameRooms.get(gameId);

          if (!room || !room.players.includes(username)) {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "You must JOIN the game first",
              })
            );
            return;
          }

          await Game.findOneAndUpdate(
            { gameId },
            {
              $push: {
                moves: {
                  from: data.move.from,
                  to: data.move.to,
                  player: username,
                  timestamp: new Date(),
                },
              },
            }
          );

          const playerColor = room.playerColors.get(username);
          publishMove({
            ...data,
            playerId: userId,
            username,
            playerColor,
            whitePlayer: [...room.playerColors.entries()].find(
              ([_, c]) => c === "w"
            )?.[0],
            blackPlayer: [...room.playerColors.entries()].find(
              ([_, c]) => c === "b"
            )?.[0],
          });
        }
      } catch (err) {
        console.error("WS message error:", err);
        ws.send(
          JSON.stringify({ type: "ERROR", message: "Invalid message format" })
        );
      }
    });

    ws.on("close", () => {
      clients.delete(username);
      // Only remove the player from the room, NOT the room itself
      // This allows the other player to keep playing and reconnecting player to rejoin
      for (const [gameId, room] of gameRooms.entries()) {
        room.players = room.players.filter((p) => p !== username);
        // Only delete room if BOTH players have disconnected
        if (room.players.length === 0) {
          gameRooms.delete(gameId);
        }
      }
      console.log(`Player ${username} disconnected and cleaned up`);
    });
  });

  subscribeEvents((event) => {
    const room = gameRooms.get(event.gameId);
    if (!room) return;

    room.players.forEach((playerUsername) => {
      clients.get(playerUsername)?.send(JSON.stringify(event));
    });
  });
};
