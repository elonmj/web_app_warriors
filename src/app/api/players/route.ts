import { NextRequest, NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { PlayerService } from '@/api/services/PlayerService';

const playerRepo = new FirebasePlayerRepository();
const playerService = new PlayerService();

export async function GET(request: NextRequest) {
  try {
    const players = await playerRepo.getAllPlayers();

    // Get filter and sort parameters from query
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const sortBy = url.searchParams.get('sort') || 'rating'; // Default to sort by rating
    const sortOrder = url.searchParams.get('order') || 'desc'; // Default to descending

    // Filter by category if specified
    let filteredPlayers = category 
      ? players.filter(p => p.category === category)
      : players;
    
    // Apply sorting
    filteredPlayers.sort((a, b) => {
      let valueA, valueB;
      
      // Determine sort field
      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          // String comparison
          return sortOrder === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case 'rating':
          valueA = a.currentRating;
          valueB = b.currentRating;
          break;
        case 'matches':
          valueA = a.statistics?.totalMatches || 0;
          valueB = b.statistics?.totalMatches || 0;
          break;
        case 'winrate':
          valueA = a.statistics?.wins / (a.statistics?.totalMatches || 1) || 0;
          valueB = b.statistics?.wins / (b.statistics?.totalMatches || 1) || 0;
          break;
        default:
          valueA = a.currentRating;
          valueB = b.currentRating;
      }
      
      // Numeric comparison
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    return NextResponse.json(filteredPlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newPlayer = await playerService.createPlayer(data);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    const message = error instanceof Error ? error.message : 'Failed to create player';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
