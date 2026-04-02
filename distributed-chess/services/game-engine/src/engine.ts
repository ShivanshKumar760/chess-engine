// game-engine/src/engine.ts
import { getGame } from "./state";

export const processMove = (event: any) => {
  const game = getGame(event.gameId);

  let move;
  try {
    move = game.move(event.move);
  } catch {
    return { error: true };
  }

  if (!move) return { error: true };

  const gameOver = game.isGameOver();
  const winner =
    gameOver && game.isCheckmate() ? (game.turn() === "w" ? "b" : "w") : null;

  return { fen: game.fen(), gameOver, winner };
};
