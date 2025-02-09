import { NextRequest, NextResponse } from 'next/server';
import { MatchService } from '@/api/services/MatchService';
import { RankingService } from '@/api/services/RankingService';
import { UpdateMatchResultInput, Match } from '@/types/Match';
import { PlayerCategoryType } from '@/types/Enums';
import { MatchRepository } from '@/api/repository/MatchRepository';

const matchService = new MatchService();
const rankingService = new RankingService();
const matchRepository = new MatchRepository();

interface MatchUpdate {
  id: string;
  newRating: number;
  newCategory: PlayerCategoryType;
  ratingChange: number;
}

interface MatchResponse {
  match: Match;
  updates: {
    player1: MatchUpdate;
    player2: MatchUpdate;
  };
}

/**
 * POST /api/matches/result
 * Process a match result and update rankings
 */
export async function POST(request: NextRequest): Promise<NextResponse<MatchResponse | { error: string }>> {
  try {
    const input: UpdateMatchResultInput = await request.json();
    
    // Validate required fields
    if (!input.matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }
    
    if (!input.score) {
      return NextResponse.json(
        { error: 'Score is required' },
        { status: 400 }
      );
    }
    
    if (typeof input.score.player1Score !== 'number' || typeof input.score.player2Score !== 'number') {
      return NextResponse.json(
        { error: 'Player scores must be numbers' },
        { status: 400 }
      );
    }

    // Get match from repository
    const match = await matchRepository.getMatch(input.matchId);

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    try {
      // Process match result with all updates
      const { updatedMatch, player1Update, player2Update } = await matchService.processMatchResult(match, input);

      // Update rankings
      try {
        await rankingService.updateEventRankings(match.eventId);
      } catch (rankingError) {
        console.error('Error updating rankings:', rankingError);
        // Rankings update failure shouldn't block match result response
      }

      // Return response with player updates
      const response: MatchResponse = {
        match: updatedMatch,
        updates: {
          player1: {
            id: player1Update.id || match.player1.id,
            newRating: player1Update.currentRating || match.player1.ratingBefore,
            newCategory: (player1Update.category || match.player1.categoryBefore || 'ONYX') as PlayerCategoryType,
            ratingChange: (player1Update.currentRating || match.player1.ratingBefore) - match.player1.ratingBefore
          },
          player2: {
            id: player2Update.id || match.player2.id,
            newRating: player2Update.currentRating || match.player2.ratingBefore,
            newCategory: (player2Update.category || match.player2.categoryBefore || 'ONYX') as PlayerCategoryType,
            ratingChange: (player2Update.currentRating || match.player2.ratingBefore) - match.player2.ratingBefore
          }
        }
      };

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error('Error processing match:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to process match result' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing match result:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error processing match result' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/result/[id]
 * Get match result by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<Match | { error: string }>> {
  try {
    const match = await matchRepository.getMatch(params.id);

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error retrieving match:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve match' },
      { status: 500 }
    );
  }
}