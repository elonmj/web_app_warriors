import { NextRequest, NextResponse } from 'next/server';
import { Event } from '@/types/Event';
import { Match } from '@/types/Match';
import { EventRepository } from '@/api/repository/eventRepository';
import { MatchStatus } from '@/types/Enums';

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
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate round number against event metadata
    if (roundNumber > event.metadata.totalRounds) {
      return NextResponse.json(
        { error: 'Round number exceeds event total rounds' },
        { status: 400 }
      );
    }

    // Get matches for the specified round
    const matches = await eventRepository.getRoundMatches(eventId, roundNumber);

    // Get round stats from event metadata
    const roundStats = event.metadata.roundHistory[roundNumber] || {
      date: event.metadata.roundDates?.[roundNumber],
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === MatchStatus.COMPLETED).length
    };

    // Calculate current round statistics
    const stats = {
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === MatchStatus.COMPLETED).length,
      pendingMatches: matches.filter(m => m.status === MatchStatus.PENDING).length,
      disputedMatches: matches.filter(m => m.status === MatchStatus.DISPUTED).length,
      forfeitMatches: matches.filter(m => m.status === MatchStatus.FORFEIT).length
    };

    return NextResponse.json({
      round: roundNumber,
      matches,
      metadata: {
        ...stats,
        scheduledDate: roundStats.date,
        byePlayerId: roundStats.byePlayerId,
        isCurrentRound: roundNumber === event.metadata.currentRound,
        roundProgress: stats.completedMatches / stats.totalMatches,
        status: stats.completedMatches === stats.totalMatches ? 'completed' : 'in-progress'
      }
    });
  } catch (error) {
    console.error('Error getting round info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate round number against event metadata
    if (roundNumber > event.metadata.totalRounds) {
      return NextResponse.json(
        { error: 'Round number exceeds event total rounds' },
        { status: 400 }
      );
    }

    // Get update data from request body
    const updates = await request.json();

    // Update round metadata in event
    const updatedMetadata = {
      ...event.metadata,
      roundHistory: {
        ...event.metadata.roundHistory,
        [roundNumber]: {
          ...event.metadata.roundHistory[roundNumber],
          ...updates
        }
      }
    };

    // Update event with new metadata
    await eventRepository.updateEvent(eventId, {
      id: eventId,
      metadata: updatedMetadata
    });

    // Return updated round info
    const matches = await eventRepository.getRoundMatches(eventId, roundNumber);
    const stats = {
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === MatchStatus.COMPLETED).length,
      pendingMatches: matches.filter(m => m.status === MatchStatus.PENDING).length
    };

    return NextResponse.json({
      round: roundNumber,
      metadata: {
        ...stats,
        ...updates,
        isCurrentRound: roundNumber === event.metadata.currentRound,
        roundProgress: stats.completedMatches / stats.totalMatches,
        status: stats.completedMatches === stats.totalMatches ? 'completed' : 'in-progress'
      }
    });

  } catch (error) {
    console.error('Error updating round info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}