export type MoveEvent = {
  type: "MOVE";
  gameId: string;
  playerId: string;
  username: string;
  move: { from: string; to: string };
};

export type GameOverEvent = {
  type: "GAME_OVER";
  gameId: string;
  winner: string; // username
  loser: string; // username
  winnerColor: "w" | "b";
  finalFen: string;
};

export type GameUpdateEvent = {
  type: "GAME_UPDATE";
  gameId: string;
  fen: string;
  gameOver: boolean;
};

export type JoinEvent = {
  type: "JOIN";
  gameId: string;
};

export type WSMessage = MoveEvent | JoinEvent;
