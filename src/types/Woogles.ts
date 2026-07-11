import { Move } from './ISC';

/**
 * Types for the Woogles.io public API (ConnectRPC, JSON, no auth for public games).
 * Contract frozen from real responses — see scripts/fixtures/.
 * Base URL: https://woogles.io/api/game_service.GameMetadataService/
 */

export interface WooglesPlayerInfo {
  user_id: string;
  nickname: string;
  rating: string;
  is_bot: boolean;
  first: boolean;
}

export interface WooglesGameRequest {
  lexicon: string;
  challenge_rule: string;
  initial_time_seconds: number;
  rating_mode: string;
  rules?: {
    board_layout_name: string;
    letter_distribution_name: string;
    variant_name: string;
  };
}

/** One entry of GetRecentGames.game_info */
export interface WooglesGameInfo {
  game_id: string;
  players: WooglesPlayerInfo[];
  scores: number[];
  winner: number;
  created_at: string;
  game_end_reason: string;
  game_request: WooglesGameRequest;
  type: string;
}

/** One entry of GetGameHistory.history.events */
export interface WooglesGameEvent {
  rack: string;
  type:
    | 'TILE_PLACEMENT_MOVE'
    | 'EXCHANGE'
    | 'PASS'
    | 'PHONY_TILES_RETURNED'
    | 'CHALLENGE_BONUS'
    | 'END_RACK_PTS'
    | 'END_RACK_PENALTY'
    | 'TIME_PENALTY'
    | 'CHALLENGE'
    | string;
  row: number;
  column: number;
  direction: 'HORIZONTAL' | 'VERTICAL' | string;
  position: string;
  played_tiles: string;
  exchanged: string;
  score: number;
  cumulative: number;
  is_bingo: boolean;
  words_formed: string[];
  millis_remaining: number;
  player_index: number;
}

/** GetGameHistory.history */
export interface WooglesGameHistory {
  events: WooglesGameEvent[];
  players: { nickname: string; user_id: string }[];
  lexicon: string;
  letter_distribution: string;
  final_scores: number[];
  winner: number;
  play_state: string;
  challenge_rule: string;
  uid: string;
  last_known_racks: string[];
}

/**
 * Normalized game data. Structurally compatible with the legacy ISCGameData
 * consumed by ScoreProgressionChart / MoveList, plus Woogles-specific fields.
 */
export interface WooglesGameData {
  gameId: string;
  lexicon: string;
  letterDistribution: string;
  createdAt?: string;
  players: [string, string];
  scores: { [player: string]: number };
  move_history: Move[];
  winner: string;
  /** Full per-move detail (racks, coordinates, timing) for persistence/analysis */
  events: WooglesGameEvent[];
  /** Raw GCG text as exported by Woogles */
  gcg?: string;
}

export interface PlayerWooglesStats {
  wooglesUsername: string;
  totalGames: number;
  totalWins: number;
  totalBingos: number;
  averageScore: number;
  highestScore: number;
  highestScoringMove: { word: string; score: number };
  lastUpdated: string;
}

export interface WooglesFetchResponse {
  success: boolean;
  gameData?: WooglesGameData;
  error?: string;
  message?: string;
}
