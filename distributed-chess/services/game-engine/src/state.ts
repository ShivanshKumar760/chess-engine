import { Chess } from "chess.js";

interface GameState {
  chess: Chess;
  whitePlayer: string | null;
  blackPlayer: string | null;
}

const games = new Map<string, GameState>();

export const getGame = (id: string) => {
  if (!games.has(id)) {
    games.set(id, {
      chess: new Chess(),
      whitePlayer: null,
      blackPlayer: null,
    });
  }
  return games.get(id)!;
};

export const setPlayers = (
  id: string,
  whitePlayer: string,
  blackPlayer: string
) => {
  const state = getGame(id);
  state.whitePlayer = whitePlayer;
  state.blackPlayer = blackPlayer;
};

export const removeGame = (id: string) => {
  games.delete(id);
};
