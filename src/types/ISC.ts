export interface ISCCredentials {
  username: string;
  password: string;
}

export interface ISCPlayerIdentifier {
  iscUsername: string;
  iscId?: string; // Rendre optionnel en ajoutant ?
}

export interface Move {
  player: string;
  word: string;
  score: number;
  position: string;
  isBingo: boolean;
}

export interface PlayerISCStats {
  playerName: string;
  totalGames: number;
  totalWins: number;
  totalBingos: number;
  averageScore: number;
  highestScore: number;
  highestScoringMove: { word: string; score: number };
  lastUpdated: string; // ISO-8601 date string
}

export interface ISCGameData {
  players: [string, string];
  scores: { [player: string]: number };
  move_history: Move[];
  winner: string;
}

export interface ISCMatchResult {
  // Legacy fields (keep for backward compatibility)
  player1Score: number;
  player2Score: number;
  timestamp: string;
  status?: 'FOUND' | 'NOT_FOUND';
  message?: string;
  
  // New fields for detailed game data
  gameData?: ISCGameData;
  warnings?: string[]; // Array of warning messages (e.g., failed EXAMINE commands)
}

export interface ISCFetchResponse {
  success: boolean;
  data?: ISCMatchResult | ISCMatchResult[];  // Can be array when fetching all games for one player
  error?: string;
  warnings?: string[];  // API-level warnings
}
