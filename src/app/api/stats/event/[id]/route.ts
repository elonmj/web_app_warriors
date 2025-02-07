import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/api/services/StatisticsService';
import { Match } from '@/lib/Match';
import { Player } from '@/lib/Player';

/**
 * GET /api/stats/event/[id]
 * Calculate event statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    const { getEventMatches, getEventPlayers } = require('@/api/repository/eventRepository');
    
    const matches = await getEventMatches(eventId);
    const players = await getEventPlayers(eventId);

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'No matches found for event' },
        { status: 404 }
      );
    }

    const statistics = await new StatisticsService().calculateEventStats(
      eventId,
      matches,
      players
    );

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error calculating event statistics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate event statistics' },
      { status: 500 }
    );
  }
}