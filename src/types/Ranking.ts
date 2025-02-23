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

export interface RoundMetadata {
  round?: number;
  isCurrentRound?: boolean;
  totalRounds?: number;
  scheduledDate?: string;
  completed?: boolean;
  byePlayerId?: string;
}

export interface EventRanking {
  eventId: string;
  lastUpdated: string;
  rankings: PlayerRanking[];
  metadata?: RoundMetadata;
}