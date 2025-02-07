import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/api/services/CategoryService';
import { StatisticsService } from '@/api/services/StatisticsService';
import { Player } from '@/lib/Player';
import { getAllPlayers, updatePlayerCategory } from '@/api/repository/playerRepository';

let categoryService: CategoryService;
let statisticsService: StatisticsService;

interface CategoryUpdate {
  playerId: string;
  oldCategory: string;
  newCategory: string;
  rating: number;
}

/**
 * POST /api/categories/recalculate
 * Recalculate categories for all players
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize services if not already initialized
    if (!categoryService) categoryService = new CategoryService();
    if (!statisticsService) statisticsService = new StatisticsService();

    const players = await getAllPlayers();

    if (!players || players.length === 0) {
      return NextResponse.json(
        { error: 'No players found' },
        { status: 404 }
      );
    }

    const updates: CategoryUpdate[] = [];

    // Process each player
    try {
      for (const player of players) {
        // Determine if category change is needed
        const categoryChange = await categoryService.shouldChangeCategory(
          player,
          player.currentRating
        );

        // Only process if we have a valid category change response
        if (categoryChange && categoryChange.shouldChange && categoryChange.newCategory) {
          // Validate category transition
          const validation = await categoryService.validateCategoryTransition(
            player.category,
            categoryChange.newCategory,
            player.currentRating
          );

          if (validation.isValid) {
            updates.push({
              playerId: player.id,
              oldCategory: player.category,
              newCategory: categoryChange.newCategory,
              rating: player.currentRating
            });

            // Update player category in repository
            await updatePlayerCategory(player.id, categoryChange.newCategory);
          }
        }
      }

      // Calculate category distribution after updates
      const newDistribution = await categoryService.getCategoryDistribution(players);

      return NextResponse.json({
        updates,
        categoryDistribution: newDistribution,
        totalUpdates: updates.length
      }, { status: 200 });

    } catch (processingError) {
      console.error('Error processing players:', processingError);
      throw processingError; // Re-throw to be caught by outer try-catch
    }

  } catch (error) {
    console.error('Error recalculating categories:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate categories' },
      { status: 500 }
    );
  }
}