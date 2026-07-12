import { MatchStatusType, ValidationStatusType, PlayerCategoryType } from './Enums';

interface PlayerMatchInfo {
  id: string; // Changed from number to string
  name?: string;
  category?: PlayerCategoryType;
  ratingBefore: number;
  ratingAfter: number;
  categoryBefore: PlayerCategoryType;
  categoryAfter: PlayerCategoryType;
}

interface MatchValidation {
  player1Approved: boolean;
  player2Approved: boolean;
  timestamp: string;  // ISO-8601
  status: ValidationStatusType;
}

interface MatchScore {
  player1Score: number;
  player2Score: number;
}

interface MatchResult {
  score: [number, number];  // [player1Score, player2Score]
  pr: number;    // Points de Rencontre (victoire 3 / nul 1 / défaite 0)
  /** @deprecated PDI supprimé par le Règlement V2 (remplacé par le Buchholz) ; présent sur les anciens matchs */
  pdi?: number;
  /** Spread signé du point de vue de player1, plafonné à ±100 (Règlement V2 §III.B).
   *  Les matchs antérieurs à la V2 stockent l'ancienne DS en pourcentage :
   *  pour les agrégations, recalculer depuis score. */
  ds: number;
}

export interface Match {
  id: string; // Match ID is still a string (Firebase requirement)
  eventId: string;
  date: string;        // ISO-8601
  player1: PlayerMatchInfo;
  player2: PlayerMatchInfo;
  status: MatchStatusType;
  result?: MatchResult;
  metadata: {
    round: number;
    isRandom: boolean;
    createdAt: string;  // ISO-8601
    updatedAt: string;  // ISO-8601
  };
}

export interface CreateMatchInput {
  eventId: string;
  player1Id: string; // Changed from number to string
  player2Id: string; // Changed from number to string
  isRandom?: boolean;
  round?: number;
}

export interface UpdateMatchResultInput {
  matchId: string; // Changed from number to string
  eventId: string;
  score: MatchScore;
  forfeit?: {
    winner: string;  // Changed from number to string
    reason: string;
  };
}

export interface ApproveMatchResultInput {
  matchId: string; // Changed from number to string
  eventId: string;
  playerId: string; // Changed from number to string
}

// Constants
export const MATCH_POINTS = {
  WIN: 3,
  DRAW: 2,
  LOSS: 1,
  FORFEIT_WIN: 3,
  FORFEIT_LOSS: 0,
  ABSENT: 0
} as const;

export type { 
  PlayerMatchInfo,
  MatchValidation,
  MatchScore,
  MatchResult
};
