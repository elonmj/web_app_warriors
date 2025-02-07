interface PlayerMatch {
  date: string;
  opponent: string;
  opponentRating: number;
  result: {
    score: [number, number];
    pr: number;    // Points de Rencontre
    pdi: number;   // Points de Départage Interne
    ds: number;    // Différence de Score
  };
  ratingChange: number;
  categoryAtTime: string;
}

interface PlayerStatistics {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  totalPR: number;
  averageDS: number;
  inactivityWeeks: number;
}

interface Player {
  id: string;
  name: string;
  currentRating: number;
  category: string;
  matches: Array<PlayerMatch>;
  statistics: PlayerStatistics;
}

// Input type for updating player category
interface UpdatePlayerCategoryInput {
  playerId: string;
  newCategory: string;
}

// Input type for updating player rating
interface UpdatePlayerRatingInput {
  playerId: string;
  ratingChange: number;
  matchResult: PlayerMatch;
}

// Input type for updating player statistics
interface UpdatePlayerStatisticsInput {
  playerId: string;
  matchResult: PlayerMatch;
}

export type {
  Player,
  PlayerMatch,
  PlayerStatistics,
  UpdatePlayerCategoryInput,
  UpdatePlayerRatingInput,
  UpdatePlayerStatisticsInput
};