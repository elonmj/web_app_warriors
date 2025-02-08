import { NextResponse } from 'next/server';
import { PlayerRepository } from '@/api/repository/playerRepository';
import { CategoryManager } from '@/lib/CategoryManager';
import { PlayerCategoryType } from '@/types/Enums';

export async function POST() {
  try {
    const playerRepo = new PlayerRepository();
    const players = await playerRepo.getAllPlayers();
    let updatedCount = 0;

    // Process each player
    for (const player of players) {
      // Calculate correct category based on current rating
      const correctCategory = CategoryManager.determineCategory(player.currentRating);
      
      // Update if category is different
      if (correctCategory !== player.category) {
        await playerRepo.updatePlayerCategory(
          player.id,
          correctCategory,
          'rating_change'
        );
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} player categories`,
      updatedCount
    });
  } catch (error) {
    console.error('Error recalculating categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to recalculate categories' },
      { status: 500 }
    );
  }
}