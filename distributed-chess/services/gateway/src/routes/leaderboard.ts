import { Router, Request, Response } from "express";
import { User } from "shared/models/User";

const router = Router();

// GET /api/leaderboard — public, returns top players with usernames and stats
router.get("/", async (_req: Request, res: Response) => {
  try {
    const topPlayers = await User.find({ gamesPlayed: { $gt: 0 } })
      .sort({ wins: -1, gamesPlayed: 1 })
      .limit(50)
      .select("username wins losses draws gamesPlayed");

    res.json({
      leaderboard: topPlayers.map((p, index) => ({
        rank: index + 1,
        username: p.username,
        wins: p.wins,
        losses: p.losses,
        draws: p.draws,
        gamesPlayed: p.gamesPlayed,
        winRate:
          p.gamesPlayed > 0
            ? Math.round((p.wins / p.gamesPlayed) * 100)
            : 0,
      })),
    });
  } catch (err: any) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
