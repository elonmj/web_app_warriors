import { RankingService } from '@/api/services/RankingService';
import { NextRequest, NextResponse } from 'next/server';

const rankingService = new RankingService();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'rating'; // rating, wins, matches

    // Get global rankings
    const globalRankings = await rankingService.getGlobalRankings();

    // Apply category filter if specified
    let rankings = globalRankings.rankings;
    if (category) {
      rankings = rankings.filter(r => r.category === category);
    }

    // Apply custom sorting if requested
    if (sortBy !== 'rating') {
      rankings.sort((a, b) => {
        switch (sortBy) {
          case 'wins':
            return b.wins - a.wins;
          case 'matches':
            return b.matches - a.matches;
          default:
            return b.rating - a.rating;
        }
      });

      // Reassign ranks after sorting
      rankings.forEach((r, index) => {
        r.rank = index + 1;
      });
    }

    // Build response with metadata
    const response = {
      ...globalRankings,
      rankings,
      metadata: {
        totalPlayers: rankings.length,
        category: category || 'all',
        sortBy,
        timestamp: new Date().toISOString()
      }
    };

    // Return response with caching headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Last-Modified': new Date().toUTCString()
      }
    });
  } catch (error) {
    console.error('Global rankings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global rankings' },
      { status: 500 }
    );
  }
}

// Handle pre-flight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Allow': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}