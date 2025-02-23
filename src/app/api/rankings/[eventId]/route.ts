import { NextRequest, NextResponse } from 'next/server';
import { RankingService } from '@/api/services/RankingService';
import { EventRepository } from '@/api/repository/eventRepository';

const rankingService = new RankingService();
const eventRepository = new EventRepository();

/**
 * GET /api/rankings/[eventId]
 * Get event rankings with optional round parameter
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const searchParams = request.nextUrl.searchParams;
    
    // Check if event exists and get metadata
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Handle round parameter
    const roundParam = searchParams.get('round');
    const round = roundParam 
      ? parseInt(roundParam, 10)
      : event.metadata.currentRound;

    // Validate round number
    if (isNaN(round) || round < 1 || round > event.metadata.totalRounds) {
      return NextResponse.json(
        { error: 'Invalid round number' },
        { status: 400 }
      );
    }

    try {
      // Get rankings for the specified round
      const rankings = await rankingService.getRoundRankings(eventId, round);
      return NextResponse.json({
        ...rankings,
        metadata: {
          round,
          isCurrentRound: round === event.metadata.currentRound,
          totalRounds: event.metadata.totalRounds
        }
      });
    } catch (error) {
      // If rankings don't exist, calculate them
      const rankings = await rankingService.updateRoundRankings(eventId, round);
      return NextResponse.json({
        ...rankings,
        metadata: {
          round,
          isCurrentRound: round === event.metadata.currentRound,
          totalRounds: event.metadata.totalRounds
        }
      });
    }
  } catch (error) {
    console.error('Error retrieving rankings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rankings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rankings/[eventId]
 * Force update event rankings for a specific round
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const searchParams = request.nextUrl.searchParams;
    
    // Get event and validate
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Handle round parameter
    const roundParam = searchParams.get('round');
    const round = roundParam 
      ? parseInt(roundParam, 10)
      : event.metadata.currentRound;

    // Validate round number
    if (isNaN(round) || round < 1 || round > event.metadata.totalRounds) {
      return NextResponse.json(
        { error: 'Invalid round number' },
        { status: 400 }
      );
    }

    // Update rankings for the specified round
    const rankings = await rankingService.updateRoundRankings(eventId, round);
    
    return NextResponse.json({
      ...rankings,
      metadata: {
        round,
        isCurrentRound: round === event.metadata.currentRound,
        totalRounds: event.metadata.totalRounds
      }
    });
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    );
  }
}