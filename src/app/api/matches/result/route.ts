import { NextRequest, NextResponse } from 'next/server';
import { MatchService } from '@/api/services/MatchService';
import { RankingService } from '@/api/services/RankingService';
import { UpdateMatchResultInput, Match } from '@/types/Match';
import { Player } from '@/types/Player';
import { MatchRepository } from '@/api/repository/MatchRepository';

const matchService = new MatchService();
const rankingService = new RankingService();
const matchRepository = new MatchRepository();

interface MatchUpdate {
  id: string;
  newRating: number;
  newCategory: string;
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
    // Validate required fields with specific error messages
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
      // Process match result
      const processResult = await matchService.processMatchResult(
        match,
        input
      );

      const { updatedMatch, player1Update, player2Update } = processResult;

      // Update rankings for the event
      await rankingService.updateEventRankings(match.eventId);

      // Ensure we have valid categories and IDs
      if (!player1Update.id || !player2Update.id) {
        throw new Error('Missing player IDs in update');
      }

      const response: MatchResponse = {
        match: updatedMatch,
        updates: {
          player1: {
            id: player1Update.id,
            newRating: player1Update.currentRating || 0,
            newCategory: player1Update.category || 'ONYX',
            ratingChange: (player1Update.currentRating || 0) - (match.player1?.ratingBefore || 0)
          },
          player2: {
            id: player2Update.id,
            newRating: player2Update.currentRating || 0,
            newCategory: player2Update.category || 'ONYX',
            ratingChange: (player2Update.currentRating || 0) - (match.player2?.ratingBefore || 0)
          }
        }
      };

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error('Error processing match:', error);
      return NextResponse.json(
        { error: 'Failed to process match result' },
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