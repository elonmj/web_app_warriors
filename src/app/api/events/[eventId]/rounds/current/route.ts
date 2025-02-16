import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/api/services/EventService';

const eventService = new EventService();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Get current round number
    const currentRound = await eventService.getCurrentRound(eventId);

    // Get pairings for the current round
    const pairings = await eventService.getRoundPairings(eventId, currentRound);

    return NextResponse.json({
      currentRound,
      pairings
    });
  } catch (error: any) {
    console.error('Error getting current round:', error);

    if (error.message === 'Event not found') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}