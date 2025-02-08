import {
  CategoryManager,
  DEFAULT_CATEGORY,
  CATEGORY_DEFINITIONS_ARRAY
} from '../../lib/CategoryManager';
import { PlayerCategoryType } from '../../types/Enums';
import type { Player } from '../../types/Player';

export class CategoryService {
  private categories: Record<string, CategoryManager>;

  constructor() {
    this.categories = {};
    CategoryManager.getAllCategories().forEach(category => {
      this.categories[category] = CategoryManager;
    });
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<Array<{ name: PlayerCategoryType, definition: { minRating: number, maxRating: number | null } }>> {
    return CATEGORY_DEFINITIONS_ARRAY.map(category => ({
      name: category.name,
      definition: {
        minRating: category.minRating,
        maxRating: category.maxRating
      }
    }));
  }

  /**
   * Get category with its players
   */
  async getCategoryWithPlayers(categoryName: string, players: Player[]): Promise<{
    name: string,
    definition: { minRating: number, maxRating: number | null },
    players: string[]
  } | null> {
    if (!CategoryManager.isValidCategory(categoryName)) {
      return null;
    }

    const definition = CategoryManager.getCategoryDefinition(categoryName as PlayerCategoryType);
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
  async determineCategoryForRating(rating: number): Promise<PlayerCategoryType> {
    return CategoryManager.determineCategory(rating);
  }

  /**
   * Check if player should be promoted/demoted based on new rating
   */
  async shouldChangeCategory(player: Player, newRating: number): Promise<{
    shouldChange: boolean;
    newCategory: PlayerCategoryType | null;
    isPromotion: boolean;
  }> {
    const newCategory = CategoryManager.determineCategory(newRating);
    const shouldChange = newCategory !== player.category;
    const isPromotion = shouldChange && CategoryManager.isPromotion(player.category as PlayerCategoryType, newCategory);

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
    
    for (const category of CategoryManager.getAllCategories()) {
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
    if (!CategoryManager.isValidCategory(fromCategory) || !CategoryManager.isValidCategory(toCategory)) {
      return {
        isValid: false,
        reason: 'Invalid category'
      };
    }

    const expectedCategory = CategoryManager.determineCategory(rating);
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

      if (CategoryManager.isPromotion(oldCategory as PlayerCategoryType, newCategory as PlayerCategoryType)) {
        stats.promotions++;
        stats.transitionsByCategory[oldCategory].promotionsFrom++;
      } else {
        stats.demotions++;
        stats.transitionsByCategory[newCategory].demotionsTo++;
      }
    }

    return stats;
  }
}