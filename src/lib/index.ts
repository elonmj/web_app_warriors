// Core types
export type {
  Player,
  PlayerMatch,
  PlayerStatistics,
  UpdatePlayerCategoryInput,
  UpdatePlayerRatingInput,
  UpdatePlayerStatisticsInput
} from './Player';

export type {
  Category,
  CategoryDefinition,
  CategoryWithPlayers
} from './Category';

export type {
  Match,
  MatchScore,
  MatchResult,
  UpdateMatchResultInput,
  ApproveMatchResultInput
} from './Match';

export type {
  RatingConfig
} from './RatingSystem';

export type {
  EventStatistics
} from './Statistics';

// Constants
export {
  CATEGORIES,
  determineCategory,
  isValidCategory,
  getCategoryDefinition,
  isCategoryPromotion
} from './Category';

export {
  POINTS,
  calculatePR,
  calculatePDI,
  calculateDS,
  calculateMatchResult
} from './Match';

// Classes
export { RatingSystem } from './RatingSystem';
export { StatisticsCalculator, EventStatisticsCalculator } from './Statistics';
export { MatchManager } from './MatchManager';

// Example usage:
/*
const matchManager = new MatchManager();

// Create a match
const match = matchManager.createMatch(player1, player2, "ONYX");

// Process match result
const result = matchManager.processMatch(match, {
  player1Score: 450,
  player2Score: 380
});

// Handle forfeit
const forfeitResult = matchManager.processForfeitMatch(match, player1.id, "No show");

// Calculate statistics
const playerStats = StatisticsCalculator.calculatePlayerStatistics(player);
const eventStats = EventStatisticsCalculator.calculateEventStatistics(matches, players);
*/