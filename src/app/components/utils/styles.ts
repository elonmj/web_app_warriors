import { PlayerCategory, PlayerCategoryType } from "@/types/Enums";



export function getCategoryColor(category: PlayerCategoryType): string {
  switch (category) {
    case PlayerCategory.ONYX:
      return "text-onyx-900 dark:text-white";
    case PlayerCategory.AMÉTHYSTE:
      return "text-amethyst-900 dark:text-white";
    case PlayerCategory.TOPAZE:
      return "text-topaz-900 dark:text-white";
    case PlayerCategory.DIAMANT:
      return "text-diamond-900 dark:text-white";
    default:
      return "text-onyx-400"; // Fallback color
  }
}

