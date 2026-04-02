import { Chess } from "chess.js";

const games = new Map<string, Chess>();

export const getGame = (id: string) => {
  if (!games.has(id)) {
    games.set(id, new Chess());
  }
  return games.get(id)!;
};
