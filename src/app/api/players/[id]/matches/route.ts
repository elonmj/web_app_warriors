import { NextRequest, NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { MatchDisplay } from '@/types/MatchHistory';

const playerRepo = new FirebasePlayerRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await playerRepo.getPlayer(params.id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get match history if available
    const matches = player.matches || [];
    
    // Sort matches by date (newest first)
    matches.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      matches,
      pagination: {
        hasMore: false,
        total: matches.length
      },
      statistics: {
        totalMatches: player.statistics?.totalMatches || matches.length,
        wins: player.statistics?.wins || 0,
        losses: player.statistics?.losses || 0,
        draws: player.statistics?.draws || 0
      }
    });
  } catch (error) {
    console.error('Error fetching player matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player matches' },
      { status: 500 }
    );
  }
}