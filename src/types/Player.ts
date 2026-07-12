import { PlayerCategoryType } from './Enums';
import { PlayerISCStats } from './ISC';
import { PlayerWooglesStats } from './Woogles';

export interface PlayerMatch {
  date: string;
  eventId: string;
  matchId: string;
  opponent: {
    id: string; // Changed from number to string
    ratingAtTime: number;
    categoryAtTime: string;
  };
  result: {
    score: [number, number];
    pr: number;
    /** @deprecated PDI supprimé par le Règlement V2 ; présent sur les anciens matchs */
    pdi?: number;
    /** Spread signé du point de vue du joueur, plafonné à ±100 (Règlement V2 §III.B) */
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
  /** @deprecated legacy ISC stats, kept read-only for history */
  iscData?: PlayerISCStats;
  wooglesData?: PlayerWooglesStats;
}

export interface Player {
  id: string;  // Changed from number to string
  name: string;
  /** @deprecated players now play on Woogles.io — see wooglesUsername */
  iscUsername?: string;
  wooglesUsername?: string;
  currentRating: number;
  category: PlayerCategoryType;
  statistics: PlayerStatistics;
  lastUpdated?: string;
  matches?: PlayerMatch[];
}

export interface CreatePlayerInput {
  name: string;
  iscUsername?: string;
  wooglesUsername?: string;
  initialRating?: number;
  initialCategory?: PlayerCategoryType;
}

export interface UpdatePlayerInput {
  name?: string;
  iscUsername?: string;
  wooglesUsername?: string;
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
