import { PlayerCategoryType, PlayerCategory } from '../types/Enums';

interface CategoryDefinition {
  minRating: number;
  maxRating: number | null;
}

// Category constants
const CATEGORY_DEFINITIONS: Record<PlayerCategoryType, CategoryDefinition> = {
  ONYX: { 
    minRating: 800, 
    maxRating: 1399 
  },
  AMÉTHYSTE: { 
    minRating: 1400, 
    maxRating: 1699 
  },
  TOPAZE: { 
    minRating: 1700, 
    maxRating: 1899 
  },
  DIAMANT: { 
    minRating: 1900, 
    maxRating: null 
  }
};

export class CategoryManager {
  /**
   * Determine player category based on rating
   */
  static determineCategory(rating: number): PlayerCategoryType {
    for (const [name, def] of Object.entries(CATEGORY_DEFINITIONS)) {
      if (rating >= def.minRating && 
          (def.maxRating === null || rating < def.maxRating)) {
        return name as PlayerCategoryType;
      }
    }
    return "ONYX"; // Default category for lowest ratings
  }

  /**
   * Check if a category change would be a promotion
   */
  static isPromotion(fromCategory: PlayerCategoryType, toCategory: PlayerCategoryType): boolean {
    const categories = Object.keys(CATEGORY_DEFINITIONS);
    return categories.indexOf(fromCategory) < categories.indexOf(toCategory);
  }

  /**
   * Get category definition including rating ranges
   */
  static getCategoryDefinition(category: PlayerCategoryType): CategoryDefinition {
    return CATEGORY_DEFINITIONS[category];
  }

  /**
   * Validate a category name
   */
  static isValidCategory(category: string): category is PlayerCategoryType {
    return category in CATEGORY_DEFINITIONS;
  }

  /**
   * Check if player is eligible for category
   */
  static isEligibleForCategory(rating: number, category: PlayerCategoryType): boolean {
    const def = CATEGORY_DEFINITIONS[category];
    return rating >= def.minRating && (def.maxRating === null || rating < def.maxRating);
  }

  /**
   * Get all available categories
   */
  static getAllCategories(): PlayerCategoryType[] {
    return Object.keys(CATEGORY_DEFINITIONS) as PlayerCategoryType[];
  }

  /**
   * Get minimum rating required for a category
   */
  static getMinRatingForCategory(category: PlayerCategoryType): number {
    return CATEGORY_DEFINITIONS[category].minRating;
  }

  /**
   * Calculate rating needed for next category
   */
  static getRatingForNextCategory(currentCategory: PlayerCategoryType): number | null {
    const categories = this.getAllCategories();
    const currentIndex = categories.indexOf(currentCategory);
    
    if (currentIndex === categories.length - 1) {
      return null; // Already at highest category
    }

    const nextCategory = categories[currentIndex + 1];
    return this.getMinRatingForCategory(nextCategory);
  }
}

export const DEFAULT_CATEGORY: PlayerCategoryType = "ONYX";
export const CATEGORY_DEFINITIONS_ARRAY = Object.entries(CATEGORY_DEFINITIONS).map(
  ([name, def]) => ({ name: name as PlayerCategoryType, ...def })
);