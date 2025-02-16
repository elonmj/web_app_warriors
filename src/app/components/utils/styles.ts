import { PlayerCategory, PlayerCategoryType } from "@/types/Enums";

export const getCategoryColor = (category: PlayerCategoryType) => {
  switch (category) {
    case PlayerCategory.ONYX:
      return "text-onyx-600 dark:text-onyx-400";
    case PlayerCategory.AMÉTHYSTE:
      return "text-amethyste-600 dark:text-amethyste-400";
    case PlayerCategory.TOPAZE:
      return "text-topaze-600 dark:text-topaze-400";
    case PlayerCategory.DIAMANT:
      return "text-diamant-600 dark:text-diamant-400";
    default:
      return "text-onyx-600 dark:text-onyx-400";
  }
};