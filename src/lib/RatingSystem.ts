import { Match, MatchResult } from '@/types/Match';
import { Player } from '@/types/Player';
import { PlayerCategoryType } from '@/types/Enums';

interface RatingConfig {
  kFactors: {
    beginner: number;    // K=30 for beginners
    intermediate: number; // K=20 for intermediate players
    expert: number;      // K=10 for expert players
  };
  dsImpact: number;      // Impact factor of DS on rating (α)
  ratingDivider: number; // Typically 400, can be adjusted
}

const DEFAULT_CONFIG: RatingConfig = {
  kFactors: {
    beginner: 30,
    intermediate: 20,
    expert: 10
  },
  dsImpact: 0.1, // 10% impact of DS on rating change
  ratingDivider: 400
};

class RatingSystem {
  private config: RatingConfig;

  constructor(config: Partial<RatingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Determine K-factor based on player's rating and experience
   */
  private determineKFactor(player: Player): number {
    const { currentRating, statistics } = player;
    const { totalMatches } = statistics;

    // Experienced players (more than 30 matches)
    if (totalMatches > 30) {
      if (currentRating >= 1700) {
        return this.config.kFactors.expert;
      }
      return this.config.kFactors.intermediate;
    }

    // New players
    return this.config.kFactors.beginner;
  }

  /**
   * Calculate expected score (probability of winning)
   */
  private calculateExpectedScore(playerRating: number, opponentRating: number): number {
    const exponent = (opponentRating - playerRating) / this.config.ratingDivider;
    return 1 / (1 + Math.pow(10, exponent));
  }

  /**
   * Calculate rating change based on ELO formula
   */
  private calculateBaseRatingChange(
    player: Player,
    opponentRating: number,
    actualScore: number
  ): number {
    const K = this.determineKFactor(player);
    const expectedScore = this.calculateExpectedScore(player.currentRating, opponentRating);
    return Math.round(K * (actualScore - expectedScore));
  }

  /**
   * Calculate additional rating change based on DS
   */
  private calculateDSImpact(ds: number): number {
    return Math.round(this.config.dsImpact * ds);
  }

  /**
   * Calculate new rating after a match
   */
  calculateNewRating(
    player: Player,
    opponentRating: number,
    matchResult: MatchResult
  ): number {
    // Determine actual score (1 for win, 0.5 for draw, 0 for loss)
    const [playerScore, opponentScore] = matchResult.score;
    const actualScore = playerScore > opponentScore ? 1 : 
                       playerScore === opponentScore ? 0.5 : 0;

    // Calculate base rating change
    const baseChange = this.calculateBaseRatingChange(
      player,
      opponentRating,
      actualScore
    );

    // Add DS impact if player won
    const dsChange = actualScore === 1 ? this.calculateDSImpact(matchResult.ds) : 0;

    // Calculate new rating
    const newRating = player.currentRating + baseChange + dsChange;

    // Ensure rating doesn't go below minimum (1000)
    return Math.max(1000, newRating);
  }

  /**
   * Process match results and update ratings for both players
   */
  processMatchRatings(match: Match): [number, number] {
    if (!match.result) {
      throw new Error('Match result not available');
    }

    // Get players from match
    const player1Rating = match.player1Rating;
    const player2Rating = match.player2Rating;

    // Create temporary player objects for rating calculation
    const tempPlayer1: Player = {
      id: match.player1.id,
      name: '',
      currentRating: player1Rating,
      category: match.player1Category,
      matches: [],
      statistics: { totalMatches: 0, wins: 0, draws: 0, losses: 0, totalPR: 0, averageDS: 0, inactivityWeeks: 0 }
    };

    const tempPlayer2: Player = {
      id: match.player2.id,
      name: '',
      currentRating: player2Rating,
      category: match.player2Category,
      matches: [],
      statistics: { totalMatches: 0, wins: 0, draws: 0, losses: 0, totalPR: 0, averageDS: 0, inactivityWeeks: 0 }
    };

    // Calculate new ratings
    const [score1, score2] = match.result.score;
    const result1: MatchResult = {
      score: [score1, score2] as [number, number],
      pr: match.result.pr,
      pdi: match.result.pdi,
      ds: match.result.ds
    };
    const result2: MatchResult = {
      score: [score2, score1] as [number, number],
      pr: match.result.pr,
      pdi: match.result.pdi,
      ds: match.result.ds
    };

    const newRating1 = this.calculateNewRating(tempPlayer1, player2Rating, result1);
    const newRating2 = this.calculateNewRating(tempPlayer2, player1Rating, result2);

    return [newRating1, newRating2];
  }
}

export { RatingSystem };
export type { RatingConfig };