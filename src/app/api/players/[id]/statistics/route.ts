import { NextRequest, NextResponse } from 'next/server';
import { FirebasePlayerRepository } from '@/api/repository/FirebasePlayerRepository';
import { StatisticsService } from '@/api/services/StatisticsService';

const playerRepo = new FirebasePlayerRepository();
const statisticsService = new StatisticsService();

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

    // Get detailed player statistics
    const detailedStats = await statisticsService.getDetailedPlayerStatistics(player.id);
    const matches = player.matches || [];

    return NextResponse.json({
      basic: player.statistics,
      detailed: {
        ...detailedStats,
        ratingHistory: matches.map(match => ({
          date: match.date,
          rating: match.ratingChange.after,
          category: match.categoryAtTime,
        })),
        categoryTransitions: player.statistics.categoryHistory,
        recentPerformance: matches.slice(0, 10).map(match => ({
          date: match.date,
          opponentId: match.opponent.id,
          result: match.result,
          ratingChange: match.ratingChange.change,
        })),
        eventStats: player.statistics.eventParticipation,
      }
    });
  } catch (error) {
    console.error('Error fetching player statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player statistics' },
      { status: 500 }
    );
  }
}