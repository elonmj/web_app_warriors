interface CategoryDefinition {
  minRating: number;
  maxRating: number | null;
}

interface Category {
  name: string;
  definition: CategoryDefinition;
}

interface CategoryWithPlayers extends Category {
  players: Array<string>; // Player IDs
}

// Category constants based on parcours.json
const CATEGORIES: Record<string, CategoryDefinition> = {
  ONYX: { 
    minRating: 1000, 
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

// Helper functions for category management
function determineCategory(rating: number): string {
  for (const [name, def] of Object.entries(CATEGORIES)) {
    if (rating >= def.minRating && 
        (def.maxRating === null || rating < def.maxRating)) {
      return name;
    }
  }
  return 'ONYX'; // Default category for ratings below 1000
}

function isValidCategory(category: string): boolean {
  return category in CATEGORIES;
}

function getCategoryDefinition(category: string): CategoryDefinition | null {
  return CATEGORIES[category] || null;
}

function isCategoryPromotion(fromCategory: string, toCategory: string): boolean {
  const categories = Object.keys(CATEGORIES);
  return categories.indexOf(fromCategory) > categories.indexOf(toCategory);
}

export {
  CATEGORIES,
  determineCategory,
  isValidCategory,
  getCategoryDefinition,
  isCategoryPromotion
};

export type {
  Category,
  CategoryDefinition,
  CategoryWithPlayers
};