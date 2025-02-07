interface PlayerRanking {
  playerId: number;
  playerName: string;
  category: string;
  rank: number;
  points: number;
  matchesPlayed: number;
}

interface Classification {
  eventId: number;
  lastUpdated: Date;
  rankings: Array<PlayerRanking>;
}

// Input type for ranking updates
interface UpdateRankingsInput {
  eventId: number;
  rankings: Array<{
    playerId: number;
    newRank: number;
    newPoints: number;
  }>;
}

export type { Classification, PlayerRanking, UpdateRankingsInput };