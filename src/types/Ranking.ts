import { PlayerCategoryType } from './Enums'; // Add this import

export interface PlayerRanking {
  playerId: string; // Changed from number to string
  rank: number;
  points: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  ratingChange: number;
  category: PlayerCategoryType;
  playerDetails?: {
    name: string;
    currentRating: number;
    category: PlayerCategoryType;
  };
}

export interface RoundMetadata {
  round?: number;
  isCurrentRound?: boolean;
  totalRounds?: number;
  scheduledDate?: string;
  completed?: boolean;
  byePlayerId?: string; // Changed from number to string
}

export interface EventRanking {
  eventId: string;
  lastUpdated: string;
  rankings: PlayerRanking[];
  metadata?: RoundMetadata;
}