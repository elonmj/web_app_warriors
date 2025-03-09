import { NextResponse } from 'next/server';
import { PlayerRepository } from '@/api/repository/playerRepository';
import { PlayerService } from '@/api/services/PlayerService';
import { CreatePlayerInput } from '@/types/Player';

const playerRepo = new PlayerRepository();
const playerService = new PlayerService(playerRepo);

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

export async function POST(request: Request) {
  try {
    // Parse and validate input
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    const input: CreatePlayerInput = {
      name: body.name,
      iscUsername: body.iscUsername,
      initialRating: body.initialRating,
      initialCategory: body.initialCategory
    };

    // Create player
    const newPlayer = await playerService.createPlayer(input);

    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);

    if (error instanceof Error) {
      // Handle known error cases
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
