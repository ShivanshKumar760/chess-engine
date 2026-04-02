export const hashGame = (gameId: string, partitions: number) => {
  let hash = 0;
  for (let i = 0; i < gameId.length; i++) {
    hash = (hash * 31 + gameId.charCodeAt(i)) % partitions;
  }
  return hash;
};
