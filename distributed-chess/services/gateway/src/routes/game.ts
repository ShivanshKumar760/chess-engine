import { Router, Response } from "express";
import { randomBytes } from "crypto";
import { Game } from "shared/models/Game";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Generate 6-char alphanumeric game ID
const generateGameId = (): string => {
  return randomBytes(3).toString("hex").toUpperCase(); // e.g., "A3F9B2"
};

// POST /api/game/create (protected) — create a new game and get shareable ID
router.post("/create", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let gameId = generateGameId();

    // Ensure uniqueness
    while (await Game.findOne({ gameId })) {
      gameId = generateGameId();
    }

    const game = await Game.create({
      gameId,
      whitePlayer: req.user!.username,
      status: "waiting",
    });

    res.status(201).json({
      message: "Game created! Share this ID with your opponent.",
      gameId: game.gameId,
      status: game.status,
      whitePlayer: game.whitePlayer,
    });
  } catch (err: any) {
    console.error("Create game error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/game/join/:gameId (protected) — join an existing game
router.post("/join/:gameId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const username = req.user!.username;

    const game = await Game.findOne({ gameId });

    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    if (game.status !== "waiting") {
      res.status(400).json({ error: "Game is not available for joining" });
      return;
    }

    if (game.whitePlayer === username) {
      res.status(400).json({ error: "You cannot join your own game" });
      return;
    }

    game.blackPlayer = username;
    game.status = "active";
    await game.save();

    res.json({
      message: "Successfully joined the game!",
      gameId: game.gameId,
      status: game.status,
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
    });
  } catch (err: any) {
    console.error("Join game error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/game/history (protected) — get current user's game history
router.get("/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user!.username;

    const games = await Game.find({
      $or: [{ whitePlayer: username }, { blackPlayer: username }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-moves"); // exclude moves array for list view

    res.json({
      games: games.map((g) => ({
        gameId: g.gameId,
        whitePlayer: g.whitePlayer,
        blackPlayer: g.blackPlayer,
        status: g.status,
        winner: g.winner,
        createdAt: g.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("Get history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/game/:gameId (protected) — get full game details including moves
router.get("/:gameId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findOne({ gameId });

    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    res.json({
      gameId: game.gameId,
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
      moves: game.moves,
      status: game.status,
      winner: game.winner,
      finalFen: game.finalFen,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    });
  } catch (err: any) {
    console.error("Get game error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
