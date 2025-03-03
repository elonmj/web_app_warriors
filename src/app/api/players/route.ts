import { NextResponse } from 'next/server';
import { PlayerRepository } from '@/api/repository/playerRepository';

const playerRepo = new PlayerRepository();

export async function GET() {
  try {
    const players = await playerRepo.getAllPlayers();
    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching players:", error);
    
    // More specific error responses
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return NextResponse.json(
          { error: 'Player data file not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'Invalid player data format' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
