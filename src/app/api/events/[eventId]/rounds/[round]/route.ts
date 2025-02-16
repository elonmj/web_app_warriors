import { NextRequest, NextResponse } from 'next/server';
import { Event } from '@/types/Event';
import { Match } from '@/types/Match';
import { EventRepository } from '@/api/repository/eventRepository';

const eventRepository = new EventRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; round: string } }
) {
  try {
    const { eventId, round } = params;
    const roundNumber = parseInt(round);

    if (isNaN(roundNumber) || roundNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid round number' },
        { status: 400 }
      );
    }

    // Get event to verify it exists and check metadata
    const event: Event | null = await eventRepository.getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get all matches for the event
    const matches: Match[] = await eventRepository.getEventMatches(eventId);
    
    // Filter matches for the specified round
    const roundMatches = matches.filter(
      (match: Match) => match.metadata.round === roundNumber
    );

    // Calculate round statistics
    const totalMatches = roundMatches.length;
    const completedMatches = roundMatches.filter(
      (match: Match) => match.status === 'completed'
    ).length;
    const pendingMatches = roundMatches.filter(
      (match: Match) => match.status === 'pending'
    ).length;

    return NextResponse.json({
      round: roundNumber,
      scheduledDate: event.metadata?.roundDates?.[roundNumber],
      matches: roundMatches,
      metadata: {
        totalMatches,
        completedMatches,
        pendingMatches,
      }
    });
  } catch (error) {
    console.error('Error getting round pairings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}