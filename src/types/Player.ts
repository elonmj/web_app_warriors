import { MatchResult } from './Match';

export interface PlayerPreferences {
  availableDays?: string[];      // Days of week
  preferredPlayTime?: string[];  // Time ranges
  notifications?: boolean;
  autoValidateResults?: boolean;
}

export interface PlayerStatistics {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  forfeits: {
    given: number;    // Forfeits conceded by this player
    received: number; // Forfeits received from opponents
  };
  totalPR: number;    // Total Points de Rencontre
  averageDS: number;  // Average Différence de Score
  inactivityWeeks: number;
  bestRating: number;
  worstRating: number;
  categoryHistory: Array<{
    category: string;
    from: string;     // ISO-8601
    to?: string;      // ISO-8601, undefined if current
    reason: 'rating_change' | 'admin_change' | 'season_reset';
  }>;
  eventParticipation: Array<{
    eventId: string;
    finalRank: number;
    matchesPlayed: number;
    performance: {
      wins: number;
      draws: number;
      losses: number;
      pointsEarned: number;
    };
  }>;
}

export interface PlayerMatch {
  date: string;       // ISO-8601
  eventId: string;
  matchId: string;
  opponent: {
    id: string;
    ratingAtTime: number;
    categoryAtTime: string;
  };
  result: {
    score: [number, number];
    pr: number;      // Points de Rencontre
    pdi: number;     // Points de Départage Interne
    ds: number;      // Différence de Score
  };
  ratingChange: {
    before: number;
    after: number;
    change: number;
  };
  categoryAtTime: string;
}

export interface Player {
  id: string;
  name: string;
  currentRating: number;
  category: string;
  joinDate: string;   // ISO-8601
  active: boolean;
  matches: PlayerMatch[];
  statistics: PlayerStatistics;
  preferences?: PlayerPreferences;
}

export interface CreatePlayerInput {
  name: string;
  initialRating?: number;  // Defaults to minimum rating
  initialCategory?: string; // Derived from rating if not provided
}

export interface UpdatePlayerInput {
  id: string;
  name?: string;
  active?: boolean;
  preferences?: Partial<PlayerPreferences>;
}

export interface UpdatePlayerCategoryInput {
  playerId: string;
  newCategory: string;
  reason: string;
  adminId: string;  // ID of admin making the change
}

export interface UpdatePlayerRatingInput {
  playerId: string;
  ratingChange: number;
  matchResult: MatchResult;
  eventId: string;
}

export interface UpdatePlayerStatisticsInput {
  playerId: string;
  matchResult: MatchResult;
  eventId: string;
}

// Constants
export const PLAYER_CONSTANTS = {
  DEFAULT_RATING: 1000,
  MINIMUM_RATING: 1000,
  MAXIMUM_RATING: 3000,
  INITIAL_CATEGORY: 'ONYX',
  INACTIVITY_THRESHOLD: 14 // days
} as const;