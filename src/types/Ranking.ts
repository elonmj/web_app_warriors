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
  /** Buchholz : somme des PR finaux des adversaires rencontrés (Règlement V2 §III.C) */
  buchholz?: number;
  /** Spread cumulé, plafonné ±100 par match (Règlement V2 §III.B) */
  spread?: number;
  /** Statut d'activité (Règlement V2 §V.D) : aucun match depuis 6 semaines.
   *  Informatif — la cote ne se dégrade jamais par inactivité. */
  isInactive?: boolean;
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