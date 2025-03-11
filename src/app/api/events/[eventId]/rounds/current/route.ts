import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '../../../../../../api/repository/FirebaseEventRepository';
import { Match } from '@/types/Match';

const eventRepository = new FirebaseEventRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Get event to verify it exists and check metadata
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const currentRound = event.metadata.currentRound;
    if (!currentRound) {
      return NextResponse.json(
        { error: 'No current round found for this event' },
        { status: 404 }
      );
    }

    // Get matches for the current round
    const matches = await eventRepository.getRoundMatches(eventId, currentRound);
    
    // Get round metadata from event
    const roundStats = event.metadata.roundHistory[currentRound] || {
      date: event.metadata.roundDates?.[currentRound],
      totalMatches: matches.length,
      completedMatches: matches.filter((m: Match) => m.status === 'completed').length
    };

    return NextResponse.json({
      round: currentRound,
      matches,
      metadata: {
        scheduledDate: roundStats.date,
        totalMatches: matches.length,
        completedMatches: matches.filter((m: Match) => m.status === 'completed').length,
        pendingMatches: matches.filter((m: Match) => m.status === 'pending').length,
        byePlayerId: roundStats.byePlayerId
      }
    });

  } catch (error) {
    console.error('Error getting current round:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}