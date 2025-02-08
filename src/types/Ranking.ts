export interface PlayerRanking {
  playerId: string;
  rank: number;
  points: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  ratingChange: number;
  category: string;
  playerDetails?: {
    name: string;
    currentRating: number;
    category: string;
  };
}

export interface EventRanking {
  eventId: string;
  lastUpdated: string;
  rankings: PlayerRanking[];
}