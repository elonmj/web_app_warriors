import { NextRequest, NextResponse } from 'next/server';
import { EventRepository } from '@/api/repository/eventRepository';
import { Match } from '@/types/Match';

const eventRepository = new EventRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; matchId: string } }
): Promise<NextResponse> {
  try {
    // Get event first to verify it exists and get current round
    const event = await eventRepository.getEvent(params.eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get matches from current round
    const roundMatches = await eventRepository.getRoundMatches(
      params.eventId,
      event.metadata.currentRound
    );

    // Find the specific match
    const match = roundMatches.find(m => m.id === params.matchId);

    if (!match) {
      // If not found in current round, try to find in all rounds
      const totalRounds = event.metadata.totalRounds;
      for (let round = 1; round <= totalRounds; round++) {
        if (round === event.metadata.currentRound) continue; // Already checked

        const matches = await eventRepository.getRoundMatches(params.eventId, round);
        const foundMatch = matches.find(m => m.id === params.matchId);
        if (foundMatch) {
          return NextResponse.json(foundMatch);
        }
      }

      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error getting match:', error);
    return NextResponse.json(
      { error: 'Failed to get match' },
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