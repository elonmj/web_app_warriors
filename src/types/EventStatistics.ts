export interface EventStatistics {
  eventId: string;
  totalMatches: number;
  completedMatches: number;
  matchesInProgress: number;
  activePlayers: number;
  averageRating: number;
  averageDS: number;
  averagePR: number;
  matchesPerCategory: {
    [key: string]: number;
  };
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
    averageRating: number;
    averageDS: number;
  }[];
  lastUpdated?: string;
}