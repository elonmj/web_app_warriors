import { determineCategory } from './Category';

interface MatchValidation {
  player1Approved: boolean;
  player2Approved: boolean;
  timestamp: string;
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
  validation?: MatchValidation;
}

interface Match {
  id: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  player1: string;
  player2: string;
  player1Rating: number;
  player2Rating: number;
  player1Category: string;  // Category of player1 at match time
  player2Category: string;  // Category of player2 at match time
  status: 'pending' | 'completed' | 'forfeit' | 'disputed';
  result?: MatchResult;
  isRandom: boolean;
  eventId?: string;
}

// Input types for match operations
interface UpdateMatchResultInput {
  matchId: string;
  score: MatchScore;
  forfeit?: {
    winner: string;
    reason: string;
  };
}

interface ApproveMatchResultInput {
  matchId: string;
  playerId: string;
}

// Constants for point calculations
const POINTS = {
  WIN: 3,
  DRAW: 2,
  LOSS: 1,
  FORFEIT_WIN: 3,
  FORFEIT_LOSS: 0,
  ABSENT: 0
};

// Helper functions for match calculations
function calculatePR(winner: string, player: string, status: Match['status']): number {
  if (status === 'forfeit') {
    return player === winner ? POINTS.FORFEIT_WIN : POINTS.FORFEIT_LOSS;
  }
  return player === winner ? POINTS.WIN : POINTS.LOSS;
}

/**
 * Calculate Points de Départage Interne (PDI) for direct confrontations between two players
 * PDI is used as a tiebreaker when players have equal PR (Points de Rencontre)
 *
 * @param matches - Array of all matches
 * @param player1 - First player ID
 * @param player2 - Second player ID
 * @returns Total PDI for direct confrontations between the players
 */
function calculatePDI(matches: Match[], player1: string, player2: string): number {
  // Only consider completed or forfeit matches between these players
  const directMatches = matches.filter(m =>
    (m.status === 'completed' || m.status === 'forfeit') &&
    ((m.player1 === player1 && m.player2 === player2) ||
     (m.player1 === player2 && m.player2 === player1))
  );

  return directMatches.reduce((pdi, match) => {
    if (!match.result) return pdi;
    
    const isPlayer1 = match.player1 === player1;
    
    // Handle forfeits
    if (match.status === 'forfeit') {
      const [score1] = match.result.score;
      return pdi + (score1 === 1 ?
        (isPlayer1 ? POINTS.FORFEIT_WIN : POINTS.FORFEIT_LOSS) :
        (isPlayer1 ? POINTS.FORFEIT_LOSS : POINTS.FORFEIT_WIN));
    }
    
    // Handle regular matches
    const [score1, score2] = match.result.score;
    
    if (score1 === score2) {
      return pdi + POINTS.DRAW;
    }
    
    const playerWon = isPlayer1 ? score1 > score2 : score2 > score1;
    return pdi + (playerWon ? POINTS.WIN : POINTS.LOSS);
  }, 0);
}

/**
 * Validates a match result
 * @param match Match to validate
 * @returns True if the match result is valid
 */
function isValidMatchResult(match: Match): boolean {
  if (!match.result) return false;
  
  const [score1, score2] = match.result.score;
  
  // Validate scores
  if (typeof score1 !== 'number' || typeof score2 !== 'number') return false;
  if (score1 < 0 || score2 < 0) return false;
  
  // Validate status-specific rules
  if (match.status === 'forfeit') {
    return (score1 === 1 && score2 === 0) || (score1 === 0 && score2 === 1);
  }
  
  // For completed matches, at least one score should be positive
  if (match.status === 'completed') {
    return score1 > 0 || score2 > 0;
  }
  
  return true;
}

function calculateDS(winnerScore: number, loserScore: number): number {
  if (loserScore === 0) return 100; // Prevent division by zero
  const deltaScore = winnerScore - loserScore;
  const percentage = (deltaScore / loserScore) * 100;
  return Math.min(100, Math.max(0, percentage));
}

/**
 * Calculates the complete match result including validation
 * @param match Current match
 * @param score Score details
 * @param previousMatches Previous matches for PDI calculation
 * @returns Complete match result with validation
 * @throws Error if the match or score is invalid
 */
function calculateMatchResult(
  match: Match,
  score: MatchScore,
  previousMatches: Match[]
): MatchResult {
  // Input validation
  if (!score || typeof score.player1Score !== 'number' || typeof score.player2Score !== 'number') {
    throw new Error('Invalid score input');
  }

  const { player1Score, player2Score } = score;
  
  // Validate scores are non-negative
  if (player1Score < 0 || player2Score < 0) {
    throw new Error('Scores cannot be negative');
  }

  // Handle draw case
  const isDraw = player1Score === player2Score;
  const winner = isDraw ? undefined :
                player1Score > player2Score ? match.player1 : match.player2;

  // Calculate result
  const result: MatchResult = {
    score: [player1Score, player2Score],
    pr: isDraw ? POINTS.DRAW : calculatePR(winner!, match.player1, match.status),
    pdi: calculatePDI(previousMatches, match.player1, match.player2),
    ds: isDraw ? 0 : calculateDS(
      Math.max(player1Score, player2Score),
      Math.min(player1Score, player2Score)
    ),
    validation: {
      player1Approved: false,
      player2Approved: false,
      timestamp: new Date().toISOString()
    }
  };

  // Validate final result
  if (!isValidMatchResult({ ...match, result })) {
    throw new Error('Invalid match result');
  }

  return result;
}

export {
  POINTS,
  calculatePR,
  calculatePDI,
  calculateDS,
  calculateMatchResult
};

export type {
  Match,
  MatchScore,
  MatchResult,
  UpdateMatchResultInput,
  ApproveMatchResultInput
};