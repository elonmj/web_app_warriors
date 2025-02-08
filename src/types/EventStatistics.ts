export interface EventStatistics {
  totalMatches: number;
  totalPlayers: number;
  matchesCompleted: number;
  matchesInProgress: number;
  averagePR: number;
  averageDS: number;
  categoryDistribution: {
    [key: string]: number;
  };
  playerStats: {
    playerId: string;
    name: string;
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    averagePR: number;
    averageDS: number;
  }[];
}