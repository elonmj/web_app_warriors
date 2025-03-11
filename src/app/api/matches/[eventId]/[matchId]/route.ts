import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '@/api/repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { Match } from '@/types/Match';

const eventRepository = new FirebaseEventRepository();
const playerRepository = new FirebasePlayerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; matchId: string } }
) {
  try {
    const { eventId, matchId } = params;
    
    // Get event to verify it exists
    const event = await eventRepository.getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Find the match in this event
    let match: Match | null = null;
    
    // First check the current round
    if (event.metadata?.currentRound) {
      const currentRoundMatches = await eventRepository.getRoundMatches(eventId, event.metadata.currentRound);
      match = currentRoundMatches.find((m: Match) => m.id === matchId) || null;
    }
    
    // If not found, check all rounds
    if (!match && event.metadata?.totalRounds) {
      for (let round = 1; round <= event.metadata.totalRounds; round++) {
        if (round === event.metadata?.currentRound) continue; // Already checked
        
        const roundMatches = await eventRepository.getRoundMatches(eventId, round);
        match = roundMatches.find((m: Match) => m.id === matchId) || null;
        
        if (match) break;
      }
    }

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Enrich match with player names
    const [player1, player2] = await Promise.all([
      playerRepository.getPlayer(match.player1.id),
      match.player2.id !== 'BYE' ? playerRepository.getPlayer(match.player2.id) : null
    ]);

    const enrichedMatch = {
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

    return NextResponse.json(enrichedMatch);
  } catch (error) {
    console.error('Error getting match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; matchId: string } }
): Promise<NextResponse> {
  try {
    // Get event to verify it exists and get current round
    const event = await eventRepository.getEvent(params.eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Can only update matches in current round
    const currentRound = event.metadata.currentRound;
    const matches = await eventRepository.getRoundMatches(params.eventId, currentRound);
    const matchToUpdate = matches.find(m => m.id === params.matchId);

    if (!matchToUpdate) {
      return NextResponse.json(
        { error: 'Match not found in current round' },
        { status: 404 }
      );
    }

    // Get update data
    const updates = await request.json();

    // Validate updates
    if (updates.metadata?.round && updates.metadata.round !== currentRound) {
      return NextResponse.json(
        { error: 'Cannot change match round' },
        { status: 400 }
      );
    }

    // Update the match
    const updatedMatch = await eventRepository.updateEventMatch(
      params.eventId,
      params.matchId,
      updates
    );

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}