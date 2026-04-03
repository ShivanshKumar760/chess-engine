import mongoose, { Schema, Document } from "mongoose";

export interface IGameMove {
  from: string;
  to: string;
  player: string; // username
  timestamp: Date;
}

export interface IGame extends Document {
  gameId: string; // shareable unique code (e.g., "A3X9K2")
  whitePlayer: string; // username
  blackPlayer: string | null; // username (null until opponent joins)
  moves: IGameMove[];
  status: "waiting" | "active" | "completed";
  winner: string | null; // username of winner, "draw", or null
  finalFen: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const GameMoveSchema = new Schema<IGameMove>(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    player: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GameSchema = new Schema<IGame>(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    whitePlayer: { type: String, required: true },
    blackPlayer: { type: String, default: null },
    moves: { type: [GameMoveSchema], default: [] },
    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting",
    },
    winner: { type: String, default: null },
    finalFen: { type: String, default: null },
  },
  { timestamps: true }
);

export const Game = mongoose.model<IGame>("Game", GameSchema);
