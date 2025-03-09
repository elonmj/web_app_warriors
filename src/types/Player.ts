import { PlayerCategoryType } from './Enums';
import { PlayerISCStats } from './ISC';

export interface PlayerMatch {
  date: string;
  eventId: string;
  matchId: string;
  opponent: {
    id: number;
    ratingAtTime: number;
    categoryAtTime: string;
  };
  result: {
    score: [number, number];
    pr: number;
    pdi: number;
    ds: number;
  };
  ratingChange: {
    before: number;
    after: number;
    change: number;
  };
  categoryAtTime: string;
}

export interface PlayerStatistics {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  forfeits: {
    given: number;
    received: number;
  };
  totalPR: number;
  averageDS: number;
  inactivityWeeks: number;
  bestRating: number;
  worstRating: number;
  categoryHistory: {
    category: PlayerCategoryType;
    from: string;
    to?: string;
    reason: 'rating_change' | 'admin_change' | 'season_reset';
  }[];
  eventParticipation: {
    eventId: string;
    finalRank: number;
    matchesPlayed: number;
    performance: {
      wins: number;
      draws: number;
      losses: number;
      pointsEarned: number;
    };
  }[];
  iscData?: PlayerISCStats;
}

export interface Player {
  id: number;
  name: string;
  iscUsername?: string;  // Optional to maintain compatibility with existing data
  currentRating: number;
  category: PlayerCategoryType;
  joinDate?: string;
  active?: boolean;
  matches: PlayerMatch[];
  statistics: PlayerStatistics;
}

export interface CreatePlayerInput {
  name: string;
  iscUsername?: string;
  initialRating?: number;
  initialCategory?: PlayerCategoryType;
}

export interface UpdatePlayerInput {
  name?: string;
  iscUsername?: string;
  currentRating?: number;
  category?: PlayerCategoryType;
  active?: boolean;
  matches?: PlayerMatch[];
  statistics?: PlayerStatistics;
}

export interface PlayerPreferences {
  id: number;
  theme: 'light' | 'dark';
  notifications: boolean;
}

export const PLAYER_CONSTANTS = {
  DEFAULT_RATING: 1000,
  DEFAULT_CATEGORY: 'ONYX' as PlayerCategoryType,
  MIN_MATCHES_FOR_RANKING: 3,
  INACTIVITY_THRESHOLD_WEEKS: 4
};
