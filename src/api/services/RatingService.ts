import { RatingSystem } from '@/lib/RatingSystem';
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
  processMatchRatings(match: Match): [number, number] {
    return this.ratingSystem.processMatchRatings(match);
  }

  /**
   * Calculate new rating
   */
  calculateNewRating(currentRating: number, opponentRating: number, matchResult: any): number {
    return this.ratingSystem.calculateNewRating({
      currentRating,
      id: '',
      name: '',
      category: this.getCategory(currentRating),
      matches: [],
      statistics: this.ratingSystem.initializeStatistics()
    }, opponentRating, matchResult);
  }
}