import { RatingSystem, PlayerRatingContext } from '@/lib/RatingSystem';
import { PlayerCategoryType } from '@/types/Enums';
import { Match } from '@/types/Match';

export class RatingService {
  private ratingSystem: RatingSystem;

  constructor() {
    this.ratingSystem = new RatingSystem();
  }

  /**
   * Get category based on rating
   */
  getCategory(rating: number): PlayerCategoryType {
    // Use RatingSystem's category determination
    return this.ratingSystem.getCategory(rating);
  }

  /**
   * Process match ratings
   */
  processMatchRatings(
    match: Match,
    player1Context?: PlayerRatingContext,
    player2Context?: PlayerRatingContext
  ): [number, number] {
    return this.ratingSystem.processMatchRatings(match, player1Context, player2Context);
  }

  /**
   * Calculate new rating
   */
  calculateNewRating(
    currentRating: number,
    opponentRating: number,
    outcome: 1 | 0.5 | 0,
    context?: PlayerRatingContext
  ): number {
    return this.ratingSystem.calculateNewRating(
      currentRating,
      opponentRating,
      outcome,
      context ?? { matchesPlayed: 15, isReturning: false }
    );
  }
}