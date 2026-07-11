import { WooglesGameEvent } from './Woogles';

/** A Woogles game persisted in our database (path /games/{gameId}) */
export interface StoredGame {
  gameId: string;
  lexicon: string;
  letterDistribution: string;
  createdAt?: string;
  importedAt: string;
  players: [string, string];
  scores: { [player: string]: number };
  winner: string;
  events: WooglesGameEvent[];
  gcg?: string;
  /** Set when the game belongs to a league match */
  matchId?: string;
  eventId?: string;
}

/** Per-player statistical summary of one game (no engine required) */
export interface PlayerGameSummary {
  username: string;
  score: number;
  won: boolean;
  turns: number;
  avgScorePerTurn: number;
  bingos: number;
  bingoPoints: number;
  exchanges: number;
  passes: number;
  /** Phony plays that were challenged off (points lost) */
  phonies: number;
  phonyPointsLost: number;
  /** Premium squares covered by newly placed tiles */
  tripleWordsUsed: number;
  doubleWordsUsed: number;
  tripleLettersUsed: number;
  doubleLettersUsed: number;
  /** Score split into thirds of the game (early / mid / late) */
  scoreByPhase: [number, number, number];
}

export interface GameAnalysisSummary {
  version: number;
  gameId: string;
  computedAt: string;
  players: [PlayerGameSummary, PlayerGameSummary];
}

/** Recurring leak categories shown in Training Insights */
export type LeakTag =
  | 'FEW_BINGOS'
  | 'PHONY_LOSSES'
  | 'LOW_SCORING_TURNS'
  | 'WEAK_ENDGAME'
  | 'PREMIUM_UNDERUSE'
  | 'TOO_MANY_PASSES';

export interface PlayerLeak {
  tag: LeakTag;
  label: string;
  detail: string;
  /** Estimated points lost per game to this leak */
  avgPointsLostPerGame: number;
  occurrences: number;
}

/** Aggregates stored at /playerInsights/{playerId} */
export interface PlayerInsights {
  playerId: string;
  wooglesUsername: string;
  updatedAt: string;
  gamesAnalyzed: number;
  wins: number;
  avgScore: number;
  avgScorePerTurn: number;
  bingosPerGame: number;
  avgOpponentScore: number;
  topLeaks: PlayerLeak[];
  /** last N games, newest first, for the "equity lost / score" chart */
  recentGames: {
    gameId: string;
    date?: string;
    score: number;
    opponentScore: number;
    bingos: number;
    won: boolean;
  }[];
}
