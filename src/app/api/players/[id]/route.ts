import { NextRequest, NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { PlayerService } from '@/api/services/PlayerService';

const playerRepo = new FirebasePlayerRepository();
const playerService = new PlayerService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await playerRepo.getPlayer(params.id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Validate input
    if (data.id && data.id !== params.id) {
      return NextResponse.json(
        { error: 'Player ID mismatch' },
        { status: 400 }
      );
    }

    // Update player
    const updatedPlayer = await playerService.updatePlayer(params.id, data);
    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update player';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}