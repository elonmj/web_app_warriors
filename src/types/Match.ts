import { MatchStatusType, ValidationStatusType, PlayerCategoryType } from './Enums';

interface PlayerMatchInfo {
  id: string;
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
  pr: number;    // Points de Rencontre
  pdi: number;   // Points de Départage Interne
  ds: number;    // Différence de Score
  validation: MatchValidation;
}

export interface Match {
  id: string;
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
  player1Id: string;
  player2Id: string;
  isRandom?: boolean;
  round?: number;
}

export interface UpdateMatchResultInput {
  matchId: string;
  eventId: string;
  score: MatchScore;
  forfeit?: {
    winner: string;
    reason: string;
  };
}

export interface ApproveMatchResultInput {
  matchId: string;
  eventId: string;
  playerId: string;
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