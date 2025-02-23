import { NextRequest, NextResponse } from 'next/server';
import { EventRepository } from '@/api/repository/eventRepository';

const eventRepository = new EventRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Get event to check existence and metadata
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const currentRound = event.metadata.currentRound;

    // Get matches for current round
    const matches = await eventRepository.getRoundMatches(eventId, currentRound);
    
    // Calculate round statistics
    const stats = {
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === 'completed').length,
      pendingMatches: matches.filter(m => m.status === 'pending').length,
    };

    // Get round metadata from event
    const roundStats = event.metadata.roundHistory[currentRound] || {
      date: event.metadata.roundDates?.[currentRound],
      totalMatches: stats.totalMatches,
      completedMatches: stats.completedMatches
    };

    return NextResponse.json({
      currentRound,
      matches,
      metadata: {
        ...stats,
        scheduledDate: roundStats.date,
        byePlayerId: roundStats.byePlayerId,
        roundProgress: stats.completedMatches / stats.totalMatches,
        status: stats.completedMatches === stats.totalMatches ? 'completed' : 'in-progress'
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