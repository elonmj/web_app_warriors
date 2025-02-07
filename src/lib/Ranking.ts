interface Ranking {
  weekNumber: number;
  playerId: number;
  rank: number;
  timestamp: Date;
}

// Types for tracking historical rankings
interface RankingHistory {
  playerId: number;
  rankings: Array<{
    weekNumber: number;
    rank: number;
    timestamp: Date;
  }>;
}

// Input type for updating rankings
interface UpdateWeeklyRankingInput {
  weekNumber: number;
  rankings: Array<{
    playerId: number;
    newRank: number;
  }>;
}

export type { Ranking, RankingHistory, UpdateWeeklyRankingInput };