import { PlayerCategory, PlayerCategoryType } from '@/types/Enums';

/**
 * Gets the appropriate CSS class for a player category
 * @param category The player's category
 * @returns CSS class name for styling the category
 */
export function getCategoryColor(category: PlayerCategoryType | undefined): string {
  if (!category) return 'text-gray-500'; // Default color for undefined category
  
  switch (category) {
    case PlayerCategory.ONYX:
      return 'text-onyx-600 dark:text-onyx-300';
    case PlayerCategory.DIAMANT:
      return 'text-blue-600 dark:text-blue-400';
    case PlayerCategory.TOPAZE:
      return 'text-amber-600 dark:text-amber-400';
    case PlayerCategory.AMÉTHYSTE:
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

