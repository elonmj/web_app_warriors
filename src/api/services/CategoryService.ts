import {
  Category,
  CategoryDefinition,
  CategoryWithPlayers,
  CATEGORIES,
  determineCategory,
  isValidCategory
} from '../../lib/Category';
import type { Player } from '../../lib/Player';

export class CategoryService {
  private categories: Record<string, CategoryDefinition>;

  constructor() {
    this.categories = CATEGORIES;
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<Category[]> {
    return Object.entries(this.categories).map(([name, definition]) => ({
      name,
      definition
    }));
  }

  /**
   * Get category with its players
   */
  async getCategoryWithPlayers(categoryName: string, players: Player[]): Promise<CategoryWithPlayers | null> {
    if (!isValidCategory(categoryName)) {
      return null;
    }

    const definition = this.categories[categoryName];
    const categoryPlayers = players.filter(player => player.category === categoryName);

    return {
      name: categoryName,
      definition,
      players: categoryPlayers.map(player => player.id)
    };
  }

  /**
   * Determine appropriate category for a rating
   */
  async determineCategoryForRating(rating: number): Promise<string> {
    return determineCategory(rating);
  }

  /**
   * Check if player should be promoted/demoted based on new rating
   */
  async shouldChangeCategory(player: Player, newRating: number): Promise<{
    shouldChange: boolean;
    newCategory: string | null;
    isPromotion: boolean;
  }> {
    const newCategory = determineCategory(newRating);
    const shouldChange = newCategory !== player.category;
    const isPromotion = shouldChange && newRating > player.currentRating;

    return {
      shouldChange,
      newCategory: shouldChange ? newCategory : null,
      isPromotion
    };
  }

  /**
   * Get category distribution statistics
   */
  async getCategoryDistribution(players: Player[]): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};
    
    for (const category of Object.keys(this.categories)) {
      distribution[category] = players.filter(p => p.category === category).length;
    }

    return distribution;
  }

  /**
   * Validate if a category transition is allowed
   */
  async validateCategoryTransition(
    fromCategory: string,
    toCategory: string,
    rating: number
  ): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    if (!isValidCategory(fromCategory) || !isValidCategory(toCategory)) {
      return {
        isValid: false,
        reason: 'Invalid category'
      };
    }

    const expectedCategory = determineCategory(rating);
    if (expectedCategory !== toCategory) {
      return {
        isValid: false,
        reason: `Rating ${rating} should be in category ${expectedCategory}`
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate category transition statistics
   */
  async calculateTransitionStats(matches: Array<{ 
    playerId: string; 
    oldCategory: string; 
    newCategory: string; 
    date: string; 
  }>): Promise<{
    promotions: number;
    demotions: number;
    transitionsByCategory: Record<string, {
      promotionsFrom: number;
      demotionsTo: number;
    }>;
  }> {
    const stats = {
      promotions: 0,
      demotions: 0,
      transitionsByCategory: {} as Record<string, {
        promotionsFrom: number;
        demotionsTo: number;
      }>
    };

    for (const match of matches) {
      const { oldCategory, newCategory } = match;

      // Initialize category stats if needed
      if (!stats.transitionsByCategory[oldCategory]) {
        stats.transitionsByCategory[oldCategory] = {
          promotionsFrom: 0,
          demotionsTo: 0
        };
      }
      if (!stats.transitionsByCategory[newCategory]) {
        stats.transitionsByCategory[newCategory] = {
          promotionsFrom: 0,
          demotionsTo: 0
        };
      }

      // Check if promotion or demotion
      const categoryOrder = Object.keys(this.categories);
      const oldIndex = categoryOrder.indexOf(oldCategory);
      const newIndex = categoryOrder.indexOf(newCategory);

      if (newIndex < oldIndex) { // Lower index means higher category
        stats.promotions++;
        stats.transitionsByCategory[oldCategory].promotionsFrom++;
      } else if (newIndex > oldIndex) {
        stats.demotions++;
        stats.transitionsByCategory[newCategory].demotionsTo++;
      }
    }

    return stats;
  }
}