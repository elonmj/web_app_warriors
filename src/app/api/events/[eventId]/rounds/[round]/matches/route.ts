import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '../../../../../../../api/repository/FirebaseEventRepository';
import { MatchStatus } from '@/types/Enums';

const eventRepository = new FirebaseEventRepository();

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

    // Calculate round statistics
    const stats = {
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === MatchStatus.COMPLETED).length,
      pendingMatches: matches.filter(m => m.status === MatchStatus.PENDING).length,
      disputedMatches: matches.filter(m => m.status === MatchStatus.DISPUTED).length,
      forfeitMatches: matches.filter(m => m.status === MatchStatus.FORFEIT).length
    };

    // Get round metadata from event
    const roundStats = event.metadata.roundHistory[roundNumber] || {
      date: event.metadata.roundDates?.[roundNumber],
      totalMatches: stats.totalMatches,
      completedMatches: stats.completedMatches
    };

    return NextResponse.json({
      round: roundNumber,
      matches,
      metadata: {
        ...stats,
        scheduledDate: roundStats.date,
        byePlayerId: roundStats.byePlayerId,
        isCurrentRound: roundNumber === event.metadata.currentRound
      }
    });

  } catch (error) {
    console.error('Error getting round matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Verify this is the current round
    if (roundNumber !== event.metadata.currentRound) {
      return NextResponse.json(
        { error: 'Can only modify matches in the current round' },
        { status: 400 }
      );
    }

    // Get match data from request body
    const matchData = await request.json();

    // Add the match
    await eventRepository.addEventMatch(eventId, {
      ...matchData,
      metadata: {
        ...matchData.metadata,
        round: roundNumber
      }
    });

    // Get updated round data
    const updatedMatches = await eventRepository.getRoundMatches(eventId, roundNumber);
    const stats = {
      totalMatches: updatedMatches.length,
      completedMatches: updatedMatches.filter(m => m.status === MatchStatus.COMPLETED).length,
      pendingMatches: updatedMatches.filter(m => m.status === MatchStatus.PENDING).length
    };

    return NextResponse.json({
      round: roundNumber,
      matches: updatedMatches,
      metadata: {
        ...stats,
        scheduledDate: event.metadata.roundDates?.[roundNumber],
        isCurrentRound: true
      }
    });

  } catch (error) {
    console.error('Error updating round match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}