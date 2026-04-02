const scores = new Map<string, number>();

export const updateScore = (playerId: string) => {
  scores.set(playerId, (scores.get(playerId) || 0) + 1);
};

export const getScores = () => Object.fromEntries(scores);
