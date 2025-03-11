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

    // Generate pairings using EventService
    const result = await eventService.generatePairings(
      eventId,
      pairingOptions
    );

    // Save matches for the new round
    const saveMatchPromises = result.matches.map((match: Match) =>
      eventRepository.addEventMatch(eventId, match)
    );
    await Promise.all(saveMatchPromises);

    // Update event metadata
    const roundNumber = result.round;
    const roundMatches = result.matches;
    
    const roundStats = {
      date: scheduledDate || new Date().toISOString(),
      totalMatches: roundMatches.length,
      completedMatches: roundMatches.filter((m: Match) => m.status === 'completed').length,
      byePlayerId: roundMatches.find((m: Match) => m.player2.id === 'BYE')?.player1.id
    };

    const updatedMetadata = {
      ...event.metadata,
      currentRound: roundNumber,
      totalMatches: (event.metadata.totalMatches || 0) + roundMatches.length,
      roundDates: {
        ...event.metadata.roundDates,
        [roundNumber]: scheduledDate || new Date().toISOString()
      },
      roundHistory: {
        ...event.metadata.roundHistory,
        [roundNumber]: roundStats
      },
      lastUpdated: new Date().toISOString()
    };

    // Update event with new metadata
    await eventRepository.updateEvent(eventId, {
      id: eventId,
      metadata: updatedMetadata
    });

    return NextResponse.json({
      round: roundNumber,
      matches: result.matches,
      metadata: {
        scheduledDate: roundStats.date,
        totalMatches: roundStats.totalMatches,
        completedMatches: roundStats.completedMatches,
        pendingMatches: roundStats.totalMatches - roundStats.completedMatches,
        byePlayerId: roundStats.byePlayerId
      },
      warnings: result.warnings
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
