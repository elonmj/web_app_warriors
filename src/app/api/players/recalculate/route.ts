import { NextRequest, NextResponse } from 'next/server';
import { PlayerRepository } from '@/api/repository/playerRepository';

export async function POST(request: NextRequest) {
  try {
    const playerRepo = new PlayerRepository();
    const players = await playerRepo.getAllPlayers();

    // Recalculate statistics for all players
    for (const player of players) {
      await playerRepo.recalculatePlayerStatistics(player.id);
    }

    return NextResponse.json({ message: 'Player statistics recalculated successfully' });
  } catch (error) {
    console.error('Error recalculating player statistics:', error);
    return NextResponse.json({ error: 'Failed to recalculate player statistics' }, { status: 500 });
  }
}