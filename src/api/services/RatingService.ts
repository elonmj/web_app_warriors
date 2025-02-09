import { RatingSystem } from '../../lib/RatingSystem';
import { Match } from '../../types/Match';
import { Player } from '../../types/Player';

export class RatingService {
  private ratingSystem: RatingSystem;

  constructor() {
    this.ratingSystem = new RatingSystem();
  }

  /**
   * Calculate new ratings for both players after a match
   */
  async calculateNewRatings(match: Match): Promise<[number, number]> {
    return this.ratingSystem.processMatchRatings(match);
  }

  /**
   * Calculate rating change preview without saving
   */
  async previewRatingChange(
    player: Player,
    opponentRating: number,
    matchResult: Match['result']
  ): Promise<{
    currentRating: number;
    newRating: number;
    change: number;
  }> {
    if (!matchResult) {
      throw new Error('Match result required for rating preview');
    }

    const newRating = this.ratingSystem.calculateNewRating(
      player,
      opponentRating,
      matchResult
    );

    return {
      currentRating: player.currentRating,
      newRating,
      change: newRating - player.currentRating
    };
  }

  /**
   * Get estimated win probability between two players
   */
  async calculateWinProbability(
    playerRating: number,
    opponentRating: number
  ): Promise<number> {
    const exponent = (opponentRating - playerRating) / 400; // Using standard ELO divider
    return Number((1 / (1 + Math.pow(10, exponent))).toFixed(2));
  }
}