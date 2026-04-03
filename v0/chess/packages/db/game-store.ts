import { redis } from "./redis";

type PieceColor = "white" | "black";

type GameStatus = "waiting" | "active" | "completed" | "abandoned";

interface Player {
  id: string;
  color: PieceColor;
}

interface Move {
  from: string;
  to: string;
  san: string;
  playerId: string;
  timestamp: string;
}

interface GameRecord {
  id: string;
  players: Player[];
  moves: Move[];
  status: GameStatus;
  currentTurn: PieceColor;
  fen: string;
  winner: string | null;
  endReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const GAME_KEY = (id: string) => `game:${id}`;

class GameStore {
  private async getGame(gameId: string): Promise<GameRecord | null> {
    const data = await redis.get(GAME_KEY(gameId));
    return data ? JSON.parse(data) : null;
  }

  private async saveGame(game: GameRecord): Promise<void> {
    await redis.set(GAME_KEY(game.id), JSON.stringify(game));
  }

  async createGame(playerId: string): Promise<GameRecord> {
    const game: GameRecord = {
      id: crypto.randomUUID(),
      players: [{ id: playerId, color: "white" }],
      moves: [],
      status: "waiting",
      currentTurn: "white",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      winner: null,
      endReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveGame(game);
    return game;
  }

  async joinGame(gameId: string, playerId: string): Promise<GameRecord> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "waiting")
      throw new Error("Game is not accepting players");
    if (game.players.length >= 2) throw new Error("Game is full");
    if (game.players.some((p) => p.id === playerId))
      throw new Error("Already in this game");

    game.players.push({ id: playerId, color: "black" });
    game.status = "active";
    game.updatedAt = new Date().toISOString();
    await this.saveGame(game);
    return game;
  }

  async getPlayerColor(
    gameId: string,
    playerId: string,
  ): Promise<PieceColor | null> {
    const game = await this.getGame(gameId);
    if (!game) return null;
    const player = game.players.find((p) => p.id === playerId);
    return player?.color ?? null;
  }

  async addMove(
    gameId: string,
    playerId: string,
    move: { from: string; to: string; promotion?: string },
    san: string,
    fen: string,
  ): Promise<GameRecord> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "active") throw new Error("Game is not active");

    game.moves.push({
      from: move.from,
      to: move.to,
      san,
      playerId,
      timestamp: new Date().toISOString(),
    });
    game.fen = fen;
    game.currentTurn = game.currentTurn === "white" ? "black" : "white";
    game.updatedAt = new Date().toISOString();
    await this.saveGame(game);
    return game;
  }

  async endGame(
    gameId: string,
    winner: string | null,
    reason: string,
  ): Promise<GameRecord> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");

    game.status = "completed";
    game.winner = winner;
    game.endReason = reason;
    game.updatedAt = new Date().toISOString();
    await this.saveGame(game);
    return game;
  }

  async resign(gameId: string, playerId: string): Promise<GameRecord> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "active") throw new Error("Game is not active");

    const opponent = game.players.find((p) => p.id !== playerId);
    if (!opponent) throw new Error("No opponent found");

    return this.endGame(gameId, opponent.id, "resign");
  }

  async undoMove(gameId: string): Promise<GameRecord> {
    const game = await this.getGame(gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "active") throw new Error("Game is not active");
    if (game.moves.length === 0) throw new Error("No moves to undo");

    game.moves.pop();
    game.currentTurn = game.currentTurn === "white" ? "black" : "white";
    game.updatedAt = new Date().toISOString();
    // fen will be set by the caller after chess.undo()
    return game;
  }

  async saveGamePublic(game: GameRecord): Promise<void> {
    await this.saveGame(game);
  }

  async findById(id: string): Promise<GameRecord | null> {
    return this.getGame(id);
  }
}

export const gameStore = new GameStore();
export type { GameRecord, Player, Move, PieceColor, GameStatus };
