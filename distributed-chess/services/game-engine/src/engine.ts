// game-engine/src/engine.ts
import { getGame, setPlayers } from "./state";

export const processMove = (event: any) => {
  const state = getGame(event.gameId);

  // Store player info if available
  if (event.whitePlayer && event.blackPlayer) {
    setPlayers(event.gameId, event.whitePlayer, event.blackPlayer);
  }

  let move;
  try {
    move = state.chess.move(event.move);
  } catch {
    return { error: true };
  }

  if (!move) return { error: true };

  const gameOver = state.chess.isGameOver();
  const isCheckmate = state.chess.isCheckmate();
  const isDraw = state.chess.isDraw();

  let winner: string | null = null;
  let loser: string | null = null;
  let winnerColor: "w" | "b" | null = null;

  if (gameOver && isCheckmate) {
    // The side whose turn it is has been checkmated
    // So the winner is the OTHER side
    winnerColor = state.chess.turn() === "w" ? "b" : "w";
    winner =
      winnerColor === "w" ? state.whitePlayer : state.blackPlayer;
    loser =
      winnerColor === "w" ? state.blackPlayer : state.whitePlayer;
  }

  return {
    fen: state.chess.fen(),
    gameOver,
    isCheckmate,
    isDraw,
    winner,
    loser,
    winnerColor,
  };
};
