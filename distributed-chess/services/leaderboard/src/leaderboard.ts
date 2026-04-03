import { User } from "shared/models/User";

export const updateScore = async (
  winner: string,
  loser: string | null
) => {
  if (winner === "draw") {
    // Both players get a draw increment
    // loser field is not used in draw scenario — both players are passed via separate call
    return;
  }

  // Increment winner's wins and gamesPlayed
  await User.findOneAndUpdate(
    { username: winner },
    { $inc: { wins: 1, gamesPlayed: 1 } }
  );

  // Increment loser's losses and gamesPlayed
  if (loser) {
    await User.findOneAndUpdate(
      { username: loser },
      { $inc: { losses: 1, gamesPlayed: 1 } }
    );
  }
};

export const updateDraw = async (player1: string, player2: string) => {
  await User.findOneAndUpdate(
    { username: player1 },
    { $inc: { draws: 1, gamesPlayed: 1 } }
  );
  await User.findOneAndUpdate(
    { username: player2 },
    { $inc: { draws: 1, gamesPlayed: 1 } }
  );
};

export const getLeaderboard = async () => {
  const topPlayers = await User.find({ gamesPlayed: { $gt: 0 } })
    .sort({ wins: -1, gamesPlayed: 1 })
    .limit(50)
    .select("username wins losses draws gamesPlayed");

  return topPlayers.map((p, index) => ({
    rank: index + 1,
    username: p.username,
    wins: p.wins,
    losses: p.losses,
    draws: p.draws,
    gamesPlayed: p.gamesPlayed,
    winRate:
      p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0,
  }));
};
