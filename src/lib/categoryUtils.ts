import { PlayerCategory, PlayerCategoryType } from '@/types/Enums';

/**
 * Calculate player category based on rating
 * @param rating Player's current rating
 * @returns The appropriate PlayerCategory string value
 */
export function calculateCategory(rating: number): PlayerCategoryType {
  // Using the exact enum values from your project's Enums.ts
  if (rating >= 1300) return PlayerCategory.ONYX as PlayerCategoryType;
  if (rating >= 1100) return PlayerCategory.DIAMANT as PlayerCategoryType;
  if (rating >= 900) return PlayerCategory.TOPAZE as PlayerCategoryType;
  if (rating >= 700) return PlayerCategory.AMÉTHYSTE as PlayerCategoryType;
  // Default category
  return PlayerCategory.AMÉTHYSTE as PlayerCategoryType;
}

/**
 * Update player data with the correct category based on current rating
 * @param player Player object with currentRating
 * @returns Updated player with correct category
 */
export function updatePlayerCategory<T extends { currentRating: number, category?: PlayerCategoryType }>(player: T): T {
  return {
    ...player,
    category: calculateCategory(player.currentRating)
  };
}
