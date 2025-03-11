import { NextRequest, NextResponse } from 'next/server';
import { FirebaseEventRepository } from '../../../../api/repository/FirebaseEventRepository';
import { RankingService } from '@/api/services/RankingService';

const eventRepository = new FirebaseEventRepository();
const rankingService = new RankingService();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Global rankings case
    if (eventId === 'global') {
      const globalRankings = await rankingService.getGlobalRankings();
      return NextResponse.json(globalRankings);
    }

    // Get event to verify it exists
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get current round from event
    const currentRound = event.metadata.currentRound;
    if (!currentRound) {
      return NextResponse.json(
        { error: 'Event has no rounds' },
        { status: 400 }
      );
    }

    // Get rankings for current round
    const rankings = await rankingService.getRoundRankings(eventId, currentRound);

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error getting rankings:', error);
    return NextResponse.json(
      { error: 'Failed to get rankings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const { round } = await request.json();

    // Validate round
    if (!round || typeof round !== 'number' || round < 1) {
      return NextResponse.json(
        { error: 'Valid round number is required' },
        { status: 400 }
      );
    }

    // Get event to verify it exists
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if round exists
    if (round > event.metadata.totalRounds) {
      return NextResponse.json(
        { error: 'Round exceeds event total rounds' },
        { status: 400 }
      );
    }

    // Force recalculate rankings for specified round
    const updatedRankings = await rankingService.updateRoundRankings(eventId, round);

    return NextResponse.json({
      success: true,
      rankings: updatedRankings
    });
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    );
  }
}