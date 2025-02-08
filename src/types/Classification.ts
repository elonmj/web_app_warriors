import { PlayerCategoryType } from './Enums';

export interface PlayerClassification {
  playerId: string;
  playerName: string;
  category: PlayerCategoryType;
  rank: number;
  points: number;
  matchesPlayed: number;
  metadata: {
    previousRank?: number;
    rankChange?: number;
    trend: 'up' | 'down' | 'stable';
    lastMatch: string;  // ISO-8601 date
  };
}

export interface Classification {
  eventId: string;
  lastUpdated: string;  // ISO-8601 date
  rankings: PlayerClassification[];
  metadata: {
    totalPlayers: number;
    roundsCompleted: number;
    categoryDistribution: Record<PlayerCategoryType, number>;
    averageRating: number;
  };
}

export interface UpdateClassificationInput {
  eventId: string;
  rankings: Array<{
    playerId: string;
    newRank: number;
    newPoints: number;
    matchId?: string;
  }>;
}

// Input for individual player rank updates
export interface UpdatePlayerRankInput {
  eventId: string;
  playerId: string;
  newRank: number;
  newPoints: number;
  reason?: 'match_result' | 'admin_adjustment' | 'forfeit' | 'category_change';
}