export type MoveEvent = {
  type: "MOVE";
  gameId: string;
  playerId: string;
  move: { from: string; to: string };
};
