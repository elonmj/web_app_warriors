import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '../../../../../../api/services/EventService';
import { FirebaseEventRepository } from '../../../../../../api/repository/FirebaseEventRepository';
import { Match } from '@/types/Match';
import { MatchStatus } from '@/types/MatchStatus';

const eventService = new EventService();
const eventRepository = new FirebaseEventRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const { scheduledDate, options = {} } = await request.json();

    // Get event to verify it exists and check metadata
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const pairingOptions = {
      avoidRematches: options.avoidRematches ?? true,
      balanceCategories: options.balanceCategories ?? true,
      isFirstRound: event.metadata.currentRound === 1 && !event.metadata.totalMatches
    };

    const roundNumber = event.metadata.totalMatches ? event.metadata.currentRound + 1 : 1;

    // Generate pairings and save matches using EventService
    const matches = await eventService.generatePairingsForRound(eventId, roundNumber);

    return NextResponse.json({
      round: roundNumber,
      matches,
      metadata: {
        scheduledDate: scheduledDate || new Date().toISOString(),
        totalMatches: matches.length,
        completedMatches: 0,
        pendingMatches: matches.length,
        byePlayerId: matches.find((m: Match) => m.player2.id === 'BYE')?.player1.id
      },
      warnings: []
    });

  } catch (error: any) {
    console.error('Error generating round pairings:', error);

    if (error.message === 'Event not found') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Handle constraint violations
    if (error.message.includes('constraint')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
