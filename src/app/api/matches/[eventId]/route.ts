import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';

const eventRepository = new FirebaseEventRepository();
const playerRepository = new FirebasePlayerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    
    // Get all matches for the event
    const matches = await eventRepository.getEventMatches(eventId);
    
    // Transform matches to include player names and filter by status if needed
    let result = await Promise.all(matches.map(async match => {
      // Get player names (enrich match object)
      const [player1, player2] = await Promise.all([
        playerRepository.getPlayer(match.player1.id),
        match.player2.id === 'BYE' ? null : playerRepository.getPlayer(match.player2.id)
      ]);
      
      return {
        ...match,
        player1: {
          ...match.player1,
          name: player1?.name
        },
        player2: {
          ...match.player2,
          name: match.player2.id === 'BYE' ? 'BYE' : player2?.name
        }
      };
    }));

    // Apply filters if provided in query string
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    if (statusFilter) {
      result = result.filter(match => match.status === statusFilter);
    }

    const roundFilter = url.searchParams.get('round');
    if (roundFilter && !isNaN(parseInt(roundFilter))) {
      const round = parseInt(roundFilter);
      result = result.filter(match => match.metadata?.round === round);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting event matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}