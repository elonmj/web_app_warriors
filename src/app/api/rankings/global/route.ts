import { RankingService } from '@/api/services/RankingService';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const rankingService = new RankingService();
    const globalRankings = await rankingService.getGlobalRankings();
    
    return Response.json(globalRankings);
  } catch (error) {
    console.error('Global rankings error:', error);
    return Response.json(
      { error: 'Failed to fetch global rankings' },
      { status: 500 }
    );
  }
}