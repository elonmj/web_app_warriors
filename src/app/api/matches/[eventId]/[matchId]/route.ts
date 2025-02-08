import { NextRequest, NextResponse } from 'next/server';
import { MatchRepository } from '@/api/repository/MatchRepository';

const matchRepository = new MatchRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; matchId: string } }
): Promise<NextResponse> {
  try {
    // Get matches for the event
    const matches = await matchRepository.getEventMatches(params.eventId);
    
    // Find the specific match
    const match = matches.find(m => m.id === params.matchId);
    
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error getting match:', error);
    return NextResponse.json(
      { error: 'Failed to get match' },
      { status: 500 }
    );
  }
}